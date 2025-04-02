import { Router } from "express";
import { getAllRecords, newRecord } from "../controller/record";
import HomeProperties from "../controller/home";

const router = Router();

router.get('/get_all_records', getAllRecords);
router.post('/new_record', newRecord);
router.get('/dashboard',HomeProperties)

export default router;