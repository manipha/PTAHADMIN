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

// ดึงข้อมูลผู้ดูแลตาม patient ID
export const getCaregiverByPatientId = async (req, res) => {
  const { id } = req.params; // Patient ID
  try {
    // ค้นหาผู้ดูแลที่มี userRelationships.user ตรงกับ ID ของคนไข้
    const caregiver = await Caregiver.findOne({ 
      "userRelationships.user": id 
    });
    
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
  // รับข้อมูลจากฟอร์ม - สามารถรับได้ทั้งรูปแบบเดิมและรูปแบบใหม่
  const { 
    // รับค่าจากฟอร์มใหม่ด้วย (มี prefix "caregiver")
    caregiverID_card_number,
    caregiverName,
    caregiverSurname,
    caregiverTel,
    caregiverRelationship
  } = req.body;

  // ใช้ค่าจากฟอร์มใหม่ถ้ามี หรือใช้ค่าจากฟอร์มเดิมถ้าไม่มี
  const finalID = caregiverID_card_number || ID_card_number;
  const finalName = caregiverName || name;
  const finalSurname = caregiverSurname || surname;
  const finalTel = caregiverTel || tel;
  const finalRelationship = caregiverRelationship || Relationship;
  
  if (!user || !finalName || !finalSurname) {
    return res.status(400).json({ error: "ชื่อ และนามสกุล ไม่ควรเป็นค่าว่าง" });
  }

  try {
    const existingCaregiver = await Caregiver.findOne({ ID_card_number: finalID });
    if (existingCaregiver) {
      // ตรวจสอบว่าผู้ใช้คนนี้มีอยู่แล้วหรือไม่
      const userExists = existingCaregiver.userRelationships.find(
        (rel) => rel.user.toString() === user.toString()
      );

      if (!userExists) {
        existingCaregiver.userRelationships.push({ user, relationship: finalRelationship });
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
      ID_card_number: finalID,
      name: finalName,
      surname: finalSurname,
      tel: finalTel,
      userRelationships: [{ user, relationship: finalRelationship }],
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
  const { 
    user, 
    ID_card_number, 
    name, 
    surname, 
    tel, 
    Relationship,
    // รับค่าจากฟอร์มใหม่ด้วย (มี prefix "caregiver")
    caregiverID_card_number,
    caregiverName,
    caregiverSurname,
    caregiverTel,
    caregiverRelationship
  } = req.body;

  // ใช้ค่าจากฟอร์มใหม่ถ้ามี หรือใช้ค่าจากฟอร์มเดิมถ้าไม่มี
  const finalID = caregiverID_card_number || ID_card_number;
  const finalName = caregiverName || name;
  const finalSurname = caregiverSurname || surname;
  const finalTel = caregiverTel || tel;
  const finalRelationship = caregiverRelationship || Relationship;
  
  const caregiverId = req.params.id;
  
  if (!user) {
    return res.status(400).json({ error: "User is required" });
  }

  try {
    // อัปเดตข้อมูลทั้งหมดของ caregiver รวมทั้ง ID_card_number
    const updateData = {
      ID_card_number: finalID,
      name: finalName,
      surname: finalSurname,
      tel: finalTel,
    };

    // เป็นการอัปเดตข้อมูลทั้งหมดของ caregiver และ relationships ที่ตรงกับ user
    const result = await Caregiver.updateOne(
      { _id: caregiverId, "userRelationships.user": user },
      {
        $set: {
          ...updateData,
          "userRelationships.$.relationship": finalRelationship,
        },
      }
    );

    if (result.modifiedCount === 0) {
      // ถ้าไม่มีการอัปเดต ให้ตรวจสอบว่า caregiver มีอยู่จริงไหม
      const caregiver = await Caregiver.findById(caregiverId);
      
      if (!caregiver) {
        return res.status(404).json({ error: "Caregiver not found" });
      }
      
      // ถ้า caregiver มีอยู่ แต่ไม่มี user นี้ในความสัมพันธ์ ให้เพิ่มความสัมพันธ์ใหม่
      if (!caregiver.userRelationships.some(rel => rel.user.toString() === user.toString())) {
        caregiver.userRelationships.push({ user, relationship: finalRelationship });
        
        // อัปเดตข้อมูลอื่นๆ ของ caregiver ด้วย
        caregiver.ID_card_number = finalID;
        caregiver.name = finalName;
        caregiver.surname = finalSurname;
        caregiver.tel = finalTel;
        
        await caregiver.save();
        return res.status(200).json({ status: "Ok", message: "Added new relationship and updated caregiver" });
      }
      
      return res.status(404).json({ error: "No caregiver updated. Check caregiver ID and user." });
    }
    
    return res.status(200).json({ status: "Ok", message: "Updated successfully" });
  } catch (error) {
    console.error("Error updating caregiver:", error);
    return res.status(500).json({ error: "Error updating caregiver" });
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
