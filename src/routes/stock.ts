import { getAllStocks ,addNewStocks,transferStock,updateStock } from "../controller/stock";
import { Router } from "express";

const router = Router();

router.get("/get_all_stocks", getAllStocks);
router.post("/add_new_stock", addNewStocks);
router.put("/update_stock", updateStock);
router.put("/transfer_stock", transferStock);

export default router;