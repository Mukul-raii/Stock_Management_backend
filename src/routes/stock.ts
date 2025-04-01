import { getAllStocks ,addNewStocks,transferStock,updateStock } from "../controller/stock";
import { Router } from "express";

const router = Router();

router.get("/get_all_stocks", getAllStocks);
router.post("/add_new_stock", addNewStocks);
//router.post("/transfer_stock", transferStock);
router.put("/update_stock", updateStock);

export default router;