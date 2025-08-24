




import { Router } from "express";
import { verifyWebHook } from "src/service/clerkAuth";
import express from "express";

const router = Router();

router.post(
  "/webhooks/clerk",
  express.raw({ type: "application/json" }), 
  verifyWebHook
);

export default router;
