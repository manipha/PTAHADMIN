import Patient from "../models/PatientModel.js";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import day from "dayjs";
import {
  TYPESTATUS
} from "../../server/utils/constants.js";

export const getAllPatients = async (req, res) => {
  try {
    const { search, userStatus, userType, sort, isDeleted } = req.query;
    console.log("Query params received in controller:", { search, userStatus, userType, sort, isDeleted });

    // Start with an empty query object
    const queryObject = {};
    
    // Handle soft delete filtering
    if (typeof isDeleted !== "undefined") {
      queryObject.isDeleted = isDeleted === "true";
      console.log(`Setting isDeleted filter to: ${queryObject.isDeleted}`);
    } else {
      queryObject.isDeleted = { $nin: [true] };
      console.log("Setting default isDeleted filter: exclude deleted records");
    }

    // Handle search term filtering
    if (search) {
      queryObject.$or = [
        { username: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { surname: { $regex: search, $options: "i" } },
      ];
      console.log(`Adding search filter for: "${search}"`);
    }

    // Handle status filtering
    if (userStatus && userStatus !== "ทั้งหมด") {
      // ตรวจสอบว่า userStatus ที่ส่งมาตรงกับค่าที่มีอยู่ใน TYPESTATUS หรือไม่
      const statusValues = Object.values(TYPESTATUS);
      console.log("Valid status values:", statusValues);
      
      if (statusValues.includes(userStatus)) {
        queryObject.userStatus = userStatus;
        console.log(`Setting status filter to: ${userStatus}`);
      } else {
        console.log(`Invalid status value: ${userStatus}. Not adding to query.`);
      }
    } else {
      console.log("No status filter applied or 'ทั้งหมด' selected.");
    }

    // Handle user type filtering
    if (userType && userType !== "all") {
      queryObject.userType = userType;
      console.log(`Setting userType filter to: ${userType}`);
    }

    // Get sort options with simple string-based sorting like in NotificationController
    const sortOptions = {
      ใหม่ที่สุด: "-updatedAt", // Sort by updatedAt which exists in all documents
      เก่าที่สุด: "updatedAt",
      "เรียงจาก ก-ฮ": "name",
      "เรียงจาก ฮ-ก": "-name",
    };

    // Get sort key from options
    const sortKey = sortOptions[sort] ?? sortOptions.ใหม่ที่สุด;
    console.log(`Using sort key: "${sortKey}"`);

    // Handle pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    console.log(`Pagination: page ${page}, limit ${limit}, skip ${skip}`);

    // Log final query
    console.log("Final MongoDB query:", JSON.stringify(queryObject, null, 2));

    // Retrieve patients based on query using simple find and sort
    console.log("Executing patient find query...");
    const allusers = await Patient.find(queryObject)
      .sort(sortKey)
      .skip(skip)
      .limit(limit);
    
    // Debug timestamps in returned documents
    if (allusers.length > 0) {
      console.log("Checking first document fields:", Object.keys(allusers[0]).join(', '));
    }
    
    // Count total matching patients
    console.log("Counting total patients matching query...");
    const totalPatients = await Patient.countDocuments(queryObject);
    
    // Get status distribution statistics
    console.log("Getting status distribution statistics...");
    const statusCounts = await Patient.aggregate([
      { $match: { isDeleted: { $nin: [true] } } },
      { $group: { _id: "$userStatus", count: { $sum: 1 } } }
    ]);
    
    // Log results
    console.log("Status distribution in database:", 
      statusCounts.map(status => `${status._id}: ${status.count} patients`).join(", ")
    );
    
    console.log(`Total patients in DB: ${await Patient.countDocuments({ isDeleted: { $nin: [true] } })}`);
    console.log(`Found ${allusers.length} patients matching query out of ${totalPatients} total.`);
    
    // Log detailed info about retrieved patients
    console.log("Found patients:", allusers.map(user => ({ 
      id: user._id, 
      name: user.name,
      status: user.userStatus,
      physicalTherapy: user.physicalTherapy,
      isDeleted: user.isDeleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })));
    
    // Calculate pagination info
    const numOfPages = Math.ceil(totalPatients / limit);
    
    // Send response
    console.log(`Sending response with ${allusers.length} patients`);
    res
      .status(StatusCodes.OK)
      .json({ totalPatients, numOfPages, currentPage: page, allusers });
  } catch (error) {
    console.error("Error in getAllPatients:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: "Could not retrieve patients",
      error: error.message 
    });
  }
};

// export const createPatient = async (req, res) => {
//   // Extract username from request body
//   const { _id } = req.body;

//   // Check if username already exists in the database
//   const existingPatient = await Patient.findOne({ _id });
//   if (existingPatient) {
//     return res
//       .status(StatusCodes.BAD_REQUEST)
//       .json({ message: "username already exists" });
//   }

//   // If username does not exist, proceed to create new patient
//   req.body.createdBy = req.user.userId;
//   const patientuser = await Patient.create(req.body);
//   res.status(StatusCodes.CREATED).json({ patientuser });
// };

export const createPatient = async (req, res) => {
  try {
    const { _id, username, name, email } = req.body;

    console.log("Request body:", req.body);

    if (!_id || !username || !name || !email) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Missing required fields" });
    }

    const existingPatient = await Patient.findOne({ _id });
    if (existingPatient) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Patient with this ID already exists" });
    }

    req.body.createdBy = req.user?.userId || "unknown"; // Handle missing userId
    const patientuser = await Patient.create(req.body);
    res.status(StatusCodes.CREATED).json({ patientuser });
  } catch (error) {
    console.error("Error in createPatient:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const getPatient = async (req, res) => {
  const patient = await Patient.findById(req.params._id);
  if (!patient) throw new NotFoundError(`no patient with id : ${username}`);
  res.status(StatusCodes.OK).json({ patient });
};

export const updatePatient = async (req, res) => {
  try {
    console.log("📌 Update Request Params ID:", req.params._id);
    console.log("📌 Update Request Body:", req.body);

    let updateData = { ...req.body };

    // ✅ ตรวจสอบว่า TYPESTATUS ถูกใช้ได้ถูกต้อง
    if (!TYPESTATUS) {
      throw new Error("❌ TYPESTATUS is not defined");
    }

    // แปลง physicalTherapy ให้เป็น Boolean ถ้ามีการส่งค่ามา
    if (typeof updateData.physicalTherapy === "string") {
      updateData.physicalTherapy = updateData.physicalTherapy === "true";
    }

    // ตรวจสอบถ้า userStatus เป็น "จบการรักษา" ให้ตั้ง physicalTherapy เป็น false
    if (updateData.userStatus === TYPESTATUS.TYPE_ST2) {
      updateData.physicalTherapy = false;
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params._id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ error: `ไม่พบผู้ป่วย ID: ${req.params._id}` });
    }

    res.status(200).json({ patient: updatedPatient });
  } catch (error) {
    console.error("❌ Backend Error:", error);
    res.status(500).json({ error: error.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" });
  }
};


export const deletePatient = async (req, res) => {
  const { _id } = req.params;

  try {
    const updatedPatients = await Patient.findByIdAndUpdate(
      _id,
      { isDeleted: true, deletedAt: new Date(), },
      { new: true }
    );

    if (!updatedPatients) {
      throw new NotFoundError(`no Patient with id : ${_id}`);
    }

    res.status(StatusCodes.OK).json({ Patient: updatedPatients });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
  }
};

export const showStats = async (req, res) => {
  let stats = await Patient.aggregate([
    { $group: { _id: "$userStatus", count: { $sum: 1 } } },
  ]);

  stats = stats.reduce((acc, curr) => {
    const { _id: title, count } = curr;
    acc[title] = count;
    return acc;
  }, {});

  const totalPatients = await Patient.countDocuments(); // นับจำนวนผู้ป่วยทั้งหมด

  const totalphysicalTherapyPatients = await Patient.countDocuments({
    physicalTherapy: true,
  });

  const defaultStats = {
    กำลังรักษา: stats.กำลังรักษาอยู่ || 0,
    จบการรักษา: stats.จบการรักษา || 0,
    ผู้ป่วยทั้งหมด: totalPatients || 0,
    ผู้ป่วยที่ทำกายภาพบำบัด: totalphysicalTherapyPatients || 0,
  };

  let monthlyApplications = await Patient.aggregate([
    { $match: { physicalTherapy: true } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: 6 },
  ]);

  monthlyApplications = monthlyApplications
    .map((item) => {
      const {
        _id: { year, month },
        count,
      } = item;

      const date = day()
        .month(month - 1)
        .year(year)
        .format("MMM YYYY");

      return { date, count };
    })
    .reverse();

  let monthlyApplications2 = await Patient.aggregate([
    { $match: { createdAt: { $exists: true } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: 6 },
  ]);

  monthlyApplications2 = monthlyApplications2
    .map((item) => {
      const {
        _id: { year, month },
        count,
      } = item;

      const date = day()
        .month(month - 1)
        .year(year)
        .format("MMM YYYY");

      return { date, count };
    })
    .reverse();

  res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications, monthlyApplications2 });
};
