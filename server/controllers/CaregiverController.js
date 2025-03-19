import Caregiver from "../models/Caregiver.js";

// ดึงข้อมูลผู้ดูแลทั้งหมด (มี populate ข้อมูลผู้ใช้งานและคนไข้)
export const getAllCaregivers = async (req, res) => {
  try {
    const caregivers = await Caregiver.find().populate("userRelationships.user");
    res.status(200).json({ caregivers });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// ดึงข้อมูลผู้ดูแลตาม ID_card_number (ใน URL จะส่งเป็น :id)
export const getCaregiverById = async (req, res) => {
  const { id } = req.params;
  try {
    // ค้นหาผู้ดูแลโดยใช้ ID_card_number แทน _id ของ MongoDB
    const caregiver = await Caregiver.findOne({ ID_card_number: id }).populate("userRelationships.user");
    if (caregiver) {
      return res.status(200).json({ status: "Ok", caregiver });
    } else {
      return res.status(404).json({ status: "Not Found", message: "ไม่พบข้อมูลผู้ดูแล" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "Error", message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
};

// สร้างผู้ดูแลใหม่หรือเพิ่ม user relationship ให้กับ caregiver ที่มีอยู่แล้ว
export const createCaregiver = async (req, res) => {
  const { user, name, surname, tel, Relationship, ID_card_number } = req.body;

  if (!user || !name || !surname) {
    return res.status(400).json({ error: "ชื่อ และนามสกุล ไม่ควรเป็นค่าว่าง" });
  }

  try {
    const existingCaregiver = await Caregiver.findOne({ ID_card_number });
    if (existingCaregiver) {
      // ตรวจสอบว่าผู้ใช้คนนี้มีอยู่แล้วหรือไม่
      const userExists = existingCaregiver.userRelationships.find(
        (rel) => rel.user.toString() === user.toString()
      );

      if (!userExists) {
        existingCaregiver.userRelationships.push({ user, relationship: Relationship });
        await existingCaregiver.save();
        return res.status(200).json({
          status: "Ok",
          message: "User added to existing caregiver with relationship",
          existingCaregiver,
        });
      } else {
        return res.status(400).json({ error: "ผู้ป่วยมีผู้ดูแลคนนี้แล้ว" });
      }
    }

    // สร้าง Caregiver ใหม่ถ้ายังไม่มี
    const newCaregiver = await Caregiver.create({
      ID_card_number,
      name,
      surname,
      tel,
      userRelationships: [{ user, relationship: Relationship }],
    });

    return res.status(201).json({
      status: "Ok",
      message: "Caregiver added successfully",
      newCaregiver,
    });
  } catch (error) {
    console.error("Error adding caregiver:", error);
    return res.status(500).json({ error: "Error adding caregiver" });
  }
};

// อัปเดตข้อมูลผู้ดูแลสำหรับผู้ใช้ที่ระบุ (ใช้ caregiver _id จาก URL)
export const updateCaregiver = async (req, res) => {
  const { user, name, surname, tel, Relationship } = req.body;
  const caregiverId = req.params.id;
  if (!user) {
    return res.status(400).json({ error: "User is required" });
  }

  try {
    const result = await Caregiver.updateOne(
      { _id: caregiverId, "userRelationships.user": user },
      {
        $set: {
          name,
          surname,
          tel,
          "userRelationships.$.relationship": Relationship,
        },
      }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "No caregiver updated. Check caregiver ID and user." });
    }
    return res.status(200).json({ status: "Ok", data: "Updated" });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Error updating user" });
  }
};

// ลบผู้ดูแลหรือเอา user ออกจาก caregiver (ใช้ caregiver _id จาก URL และรับ userId ใน req.body)
export const deleteCaregiver = async (req, res) => {
  const caregiverId = req.params.id;
  const { userId } = req.body;
  if (!caregiverId || !userId) {
    return res.status(400).json({ error: "Caregiver ID and User ID are required" });
  }

  try {
    const caregiver = await Caregiver.findById(caregiverId);
    if (!caregiver) {
      return res.status(404).json({ error: "Caregiver not found" });
    }

    // กรอง userRelationships เพื่อลบ userId ที่ระบุออก
    caregiver.userRelationships = caregiver.userRelationships.filter(
      (rel) => rel.user.toString() !== userId.toString()
    );

    // ถ้าไม่มี userRelationships เหลือ ให้ลบ caregiver ทิ้งไป
    if (caregiver.userRelationships.length === 0) {
      await Caregiver.findByIdAndDelete(caregiverId);
      return res.status(200).json({ status: "Ok", message: "Caregiver deleted successfully" });
    }

    // ถ้ายังมี relationship อยู่ ให้บันทึกข้อมูลที่อัปเดต
    await caregiver.save();
    return res.status(200).json({ status: "Ok", message: "User removed from caregiver" });
  } catch (error) {
    console.error("Error deleting caregiver:", error);
    return res.status(500).json({ error: "Error deleting caregiver" });
  }
};
