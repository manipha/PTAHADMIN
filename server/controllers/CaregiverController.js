import Caregiver from "../models/Caregiver.js";
import mongoose from "mongoose";

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
  console.log("Fetching caregiver for patient ID:", id);
  
  try {
    // ตรวจสอบว่า ID ที่ส่งมาถูกต้อง
    if (!id || id === 'undefined') {
      console.log("Invalid patient ID provided");
      return res.status(400).json({ status: "Error", message: "ID ของผู้ป่วยไม่ถูกต้อง" });
    }
    
    // วิธีที่ 1: ค้นหาโดยใช้ caregiverRelationship.user 
    console.log("Method 1: Searching via caregiverRelationship.user");
    let caregiver = await Caregiver.findOne({ 
      "caregiverRelationship.user": id 
    });
    
    if (caregiver) {
      console.log("Found caregiver via method 1:", caregiver._id);
      return res.status(200).json({ status: "Ok", caregiver });
    }
    
    // วิธีที่ 2: ค้นหาจากค่า userRelationships.user (ชื่อฟิลด์เก่า)
    console.log("Method 2: Searching via userRelationships.user");
    caregiver = await Caregiver.findOne({ 
      "userRelationships.user": id 
    });
    
    if (caregiver) {
      console.log("Found caregiver via method 2:", caregiver._id);
      return res.status(200).json({ status: "Ok", caregiver });
    }

    // วิธีที่ 3: ทำการค้นหาผู้ดูแลจากคอลเลคชัน Caregiver ที่มีการเชื่อมโยงกับผู้ป่วย
    console.log("Method 3: Checking if patient has caregivers field");
    const Patient = mongoose.model('Patient');
    const patient = await Patient.findById(id).populate('caregivers');
    
    if (patient && patient.caregivers && patient.caregivers.length > 0) {
      const firstCaregiverId = patient.caregivers[0];
      console.log("Found caregiver reference in patient.caregivers:", firstCaregiverId);
      
      caregiver = await Caregiver.findById(firstCaregiverId);
      if (caregiver) {
        console.log("Found caregiver via method 3:", caregiver._id);
        return res.status(200).json({ status: "Ok", caregiver });
      }
    }
    
    // วิธีที่ 4: ค้นหาทั้งหมดและเช็คทีละรายการ (วิธีสุดท้าย)
    console.log("Method 4: Manual search through all caregivers");
    const allCaregivers = await Caregiver.find();
    console.log(`Found ${allCaregivers.length} total caregivers in database`);
    
    for (const cg of allCaregivers) {
      // ตรวจสอบใน caregiverRelationship
      if (cg.caregiverRelationship && Array.isArray(cg.caregiverRelationship)) {
        for (const rel of cg.caregiverRelationship) {
          if (rel.user && rel.user.toString() === id) {
            console.log("Found matching caregiver via method 4 (caregiverRelationship):", cg._id);
            return res.status(200).json({ status: "Ok", caregiver: cg });
          }
        }
      }
      
      // ตรวจสอบใน userRelationships (ถ้ามี - ฟิลด์เก่า)
      if (cg.userRelationships && Array.isArray(cg.userRelationships)) {
        for (const rel of cg.userRelationships) {
          if (rel.user && rel.user.toString() === id) {
            console.log("Found matching caregiver via method 4 (userRelationships):", cg._id);
            return res.status(200).json({ status: "Ok", caregiver: cg });
          }
        }
      }
    }
    
    console.log("No caregiver found for patient ID:", id);
    return res.status(404).json({ status: "Not Found", message: "ไม่พบข้อมูลผู้ดูแล" });
  } catch (error) {
    console.error("Error finding caregiver:", error);
    return res.status(500).json({ status: "Error", message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์", error: error.message });
  }
};

// สร้างผู้ดูแลใหม่หรือเพิ่ม user relationship ให้กับ caregiver ที่มีอยู่แล้วแล้ว
export const createCaregiver = async (req, res) => {
  // รับข้อมูลจากฟอร์ม - สามารถรับได้ทั้งรูปแบบเดิมและรูปแบบใหม่
  const { 
    // รับค่าจากฟอร์มใหม่ด้วย (มี prefix "caregiver")
    caregiverID_card_number,
    caregiverName,
    caregiverSurname,
    caregiverTel,
    caregiverRelationship,
    user // ID ของผู้ป่วยที่เชื่อมโยงกับผู้ดูแล
  } = req.body;

  console.log("Create caregiver request body:", req.body);

  if (!user) {
    return res.status(400).json({ error: "User ID is required" });
  }

  // ตรวจสอบความถูกต้องของข้อมูล
  if (!caregiverName || !caregiverSurname) {
    return res.status(400).json({ error: "ชื่อ และนามสกุล ไม่ควรเป็นค่าว่าง" });
  }

  try {
    // ตรวจสอบว่ามีผู้ดูแลที่มีหมายเลขบัตรประชาชนนี้อยู่แล้วหรือไม่
    const existingCaregiver = await Caregiver.findOne({ caregiverID_card_number });
    
    if (existingCaregiver) {
      console.log("Found existing caregiver:", existingCaregiver);
      
      // ตรวจสอบว่าผู้ป่วยคนนี้มีผู้ดูแลคนนี้อยู่แล้วหรือไม่
      const userExists = existingCaregiver.caregiverRelationship.find(
        (rel) => rel.user && rel.user.toString() === user.toString()
      );

      if (!userExists) {
        // ถ้ายังไม่มีความสัมพันธ์ระหว่างผู้ป่วยและผู้ดูแลนี้ ให้เพิ่มเข้าไป
        const relationshipToAdd = { 
          user, 
          relationship: caregiverRelationship 
        };
        
        console.log("Adding new relationship:", relationshipToAdd);
        existingCaregiver.caregiverRelationship.push(relationshipToAdd);
        
        // อัปเดตข้อมูลอื่นๆ ของผู้ดูแลด้วย
        existingCaregiver.caregiverName = caregiverName;
        existingCaregiver.caregiverSurname = caregiverSurname;
        existingCaregiver.caregiverTel = caregiverTel;
        
        await existingCaregiver.save();
        return res.status(200).json({
          status: "Ok",
          message: "User added to existing caregiver with relationship",
          caregiver: existingCaregiver,
        });
      } else {
        console.log("User already has this caregiver with relationship:", userExists);
        return res.status(400).json({ error: "ผู้ป่วยมีผู้ดูแลคนนี้แล้ว" });
      }
    }

    // สร้าง Caregiver ใหม่ถ้ายังไม่มี
    const newCaregiverData = {
      caregiverID_card_number,
      caregiverName,
      caregiverSurname,
      caregiverTel,
      caregiverRelationship: [{ 
        user, 
        relationship: caregiverRelationship 
      }]
    };
    
    console.log("Creating new caregiver with data:", newCaregiverData);
    const newCaregiver = await Caregiver.create(newCaregiverData);

    console.log("Created new caregiver:", newCaregiver);
    return res.status(201).json({
      status: "Ok",
      message: "Caregiver added successfully",
      caregiver: newCaregiver,
    });
  } catch (error) {
    console.error("Error adding caregiver:", error);
    return res.status(500).json({ error: "Error adding caregiver", details: error.message });
  }
};

// อัปเดตข้อมูลผู้ดูแลสำหรับผู้ใช้ที่ระบุ (ใช้ caregiver _id จาก URL)
export const updateCaregiver = async (req, res) => {
  const { 
    user,
    caregiverID_card_number,
    caregiverName,
    caregiverSurname,
    caregiverTel,
    caregiverRelationship
  } = req.body;

  console.log("Update caregiver request:", req.params.id, req.body);

  const caregiverId = req.params.id;
  
  if (!user) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // อัปเดตข้อมูลทั้งหมดของ caregiver
    const updateData = {
      caregiverID_card_number,
      caregiverName,
      caregiverSurname,
      caregiverTel,
    };

    console.log("Update data:", updateData);
    console.log("Finding caregiver by ID:", caregiverId);
    
    // อัปเดตข้อมูล caregiver และความสัมพันธ์กับผู้ป่วย
    const caregiver = await Caregiver.findById(caregiverId);
    
    if (!caregiver) {
      console.log("Caregiver not found with ID:", caregiverId);
      return res.status(404).json({ error: "Caregiver not found" });
    }
    
    console.log("Found caregiver:", caregiver);
    
    // อัปเดตข้อมูลพื้นฐานของ caregiver
    caregiver.caregiverID_card_number = caregiverID_card_number;
    caregiver.caregiverName = caregiverName;
    caregiver.caregiverSurname = caregiverSurname;
    caregiver.caregiverTel = caregiverTel;
    
    // อัปเดตข้อมูลความสัมพันธ์
    // หาว่ามีความสัมพันธ์กับผู้ป่วยรายนี้อยู่หรือไม่
    const relationshipIndex = caregiver.caregiverRelationship.findIndex(
      rel => rel.user && rel.user.toString() === user.toString()
    );
    
    if (relationshipIndex >= 0) {
      // ถ้ามีความสัมพันธ์อยู่แล้ว ให้อัปเดต
      console.log("Updating existing relationship at index:", relationshipIndex);
      caregiver.caregiverRelationship[relationshipIndex].relationship = caregiverRelationship;
    } else {
      // ถ้ายังไม่มีความสัมพันธ์ ให้เพิ่มใหม่
      console.log("Adding new relationship for user:", user);
      caregiver.caregiverRelationship.push({
        user,
        relationship: caregiverRelationship
      });
    }
    
    // บันทึกการเปลี่ยนแปลง
    await caregiver.save();
    console.log("Caregiver updated successfully:", caregiver);
    
    return res.status(200).json({ 
      status: "Ok", 
      message: "Caregiver updated successfully",
      caregiver
    });
  } catch (error) {
    console.error("Error updating caregiver:", error);
    return res.status(500).json({ error: "Error updating caregiver", details: error.message });
  }
};

// ลบผู้ดูแลหรือเอา user ออกจาก caregiver (ใช้ caregiver _id จาก URL และรับ userId ใน req.body)
export const deleteCaregiver = async (req, res) => {
  const caregiverId = req.params.id;
  const { userId } = req.body;
  console.log("Delete request for caregiver:", caregiverId, "user:", userId);
  
  if (!caregiverId || !userId) {
    return res.status(400).json({ error: "Caregiver ID and User ID are required" });
  }

  try {
    const caregiver = await Caregiver.findById(caregiverId);
    if (!caregiver) {
      return res.status(404).json({ error: "Caregiver not found" });
    }

    console.log("Found caregiver:", caregiver);
    console.log("Current caregiverRelationship:", caregiver.caregiverRelationship);

    // กรอง caregiverRelationship เพื่อลบ userId ที่ระบุออก
    caregiver.caregiverRelationship = caregiver.caregiverRelationship.filter(
      (rel) => rel.user && rel.user.toString() !== userId.toString()
    );
    
    console.log("After filtering caregiverRelationship:", caregiver.caregiverRelationship);

    // ถ้าไม่มี caregiverRelationship เหลือ ให้ลบ caregiver ทิ้งไป
    if (caregiver.caregiverRelationship.length === 0) {
      console.log("No relationships left, deleting caregiver");
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
