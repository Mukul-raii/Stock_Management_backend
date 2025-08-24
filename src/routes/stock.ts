import { getAllStocks ,addNewStocks,transferStock,updateStock } from "../controller/stock";
import { Router } from "express";
import { requireAuth } from "@clerk/express";

const router = Router();

router.get("/get_all_stocks", requireAuth(), getAllStocks);
router.post("/add_new_stock", requireAuth(), addNewStocks);
router.put("/update_stock", requireAuth(), updateStock);
router.put("/transfer_stock", requireAuth(), transferStock);

export default router;