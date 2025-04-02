import { PrismaClient, Shop } from "@prisma/client"

const prisma= new PrismaClient ()


export default async function HomeProperties() {
    const shops = ["Amariya", "Vamanpuri"];
    let AmariyaTotalCash: any = null;
    let VamanpuriTotalCash: any = null;

    await Promise.all(
        shops.map(async (shop) => {
            console.log(shop);

            const temp = await prisma.billHistory.aggregate({
                where: {
                    shop: shop as Shop,
                },
                _sum: {
                    totalCashReceived: true,
                },
            });

            if (shop === "Amariya") {
                AmariyaTotalCash = temp._sum.totalCashReceived;
            } else {
                VamanpuriTotalCash = temp._sum.totalCashReceived;
            }
        })
    );
    console.log(AmariyaTotalCash,VamanpuriTotalCash);
    

}