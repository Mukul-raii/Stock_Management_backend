import { Webhook } from "svix"; // official Clerk webhook verifier
import { app } from "../index"; // Corrected import
import { Request, RequestHandler, Response } from "express";
import { PrismaClient } from "@prisma/client";

export const verifyWebHook: RequestHandler = async (
    req: Request,
    res: Response
): Promise<void> => {
    const prisma = new PrismaClient();

    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error("❌ Missing Clerk Webhook Secret");
        res.status(500).json({ error: "Server configuration error" });
        return;
    }

    const wh = new Webhook(webhookSecret);
    try {
        const evt = wh.verify(req.body, req.headers as Record<string, string>
        );

        const event = evt as { type: string; data: any };

        if (event.type === "user.created") {
            const user = event.data;
            const clerkId = user.id;
            const email = user.email_addresses?.[0]?.email_address;
            const name = `${user.first_name || ""} ${user.last_name || ""}`;

            // Store user in your DB
            await prisma.user.create({ data: { userId: clerkId, email, name, role: "employee" } });
            console.log("✅ User created in backend:", clerkId, email, name);
        }

        res.status(200).json({ success: true });
    } catch (err) {
        const error = err as Error;
        console.error("❌ Webhook verification failed:", error.message);
        res.status(400).json({ error: "Invalid webhook signature" });
    }
}; 