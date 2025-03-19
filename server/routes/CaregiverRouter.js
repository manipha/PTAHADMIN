import express from "express";
import {
  getAllCaregivers,
  getCaregiverById,
  createCaregiver,
  updateCaregiver,
  deleteCaregiver,
} from "../controllers/CaregiverController.js";

const router = express.Router();

// เส้นทางสำหรับดึงข้อมูลผู้ดูแลทั้งหมดและการสร้างผู้ดูแลใหม่
router.route("/")
  .get(getAllCaregivers)
  .post(createCaregiver);

// เส้นทางสำหรับดึงข้อมูลผู้ดูแล (ค้นจาก ID_card_number),
// อัปเดต และลบผู้ดูแลโดยใช้ _id ของ caregiver จาก URL
router.route("/:id")
  .get(getCaregiverById)
  .patch(updateCaregiver)
  .delete(deleteCaregiver);

export default router;
