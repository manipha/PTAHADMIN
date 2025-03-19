import { StatusCodes } from "http-status-codes";
import Mission from "../models/MissionModel.js";
import { NotFoundError } from "../errors/customError.js";
import Submission from "../models/SubmissionModel.js";
import { TYPEPOSTURES } from "../utils/constants.js";

export const getAllMissions = async (req, res) => {
  // เก็บค่าพารามิเตอร์จาก URL
  const { search, missionType, page, limit, sort = "ใหม่ที่สุด" } = req.query;
  console.log("Mission query params:", { search, missionType, page, limit, sort });

  // เริ่มต้นด้วย object ว่าง
  const queryObject = {
    isDeleted: { $ne: true } // ไม่แสดงข้อมูลที่ถูกลบ
  };

  // ถ้ามี search หรือ missionType ให้เพิ่มเงื่อนไขในการค้นหา
  if (search) {
    console.log(`🔍 Searching for: "${search}"`);
    queryObject.$or = [
      { name: { $regex: search, $options: "i" } },
      { no: isNaN(Number(search)) ? { $exists: true } : Number(search) }
    ];
  }

  if (missionType && missionType !== "ทั้งหมด") {
    console.log(`🔍 Filtering by mission type: "${missionType}"`);
    
    // ค้นหารูปแบบต่างๆ ของ mission type
    queryObject.$or = [];
    
    // 1. ตรวจสอบตรงๆ กับค่าใน TYPEPOSTURES
    queryObject.$or.push({ missionType: { $regex: missionType, $options: "i" } });
    
    // 2. ตรวจสอบว่าชื่อมิชชั่นมีคำที่ระบุหรือไม่
    queryObject.$or.push({ name: { $regex: missionType, $options: "i" } });
    
    // 2. ถ้ายังไม่มีเงื่อนไขการค้นหา ให้ใช้ missionType โดยตรง
    if (queryObject.$or.length === 0) {
      queryObject.$or.push({ name: { $regex: missionType, $options: "i" } });
    }
  }

  console.log("🔍 Final query object:", JSON.stringify(queryObject, null, 2));

  // กำหนด pagination
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 30;
  const skip = (pageNum - 1) * limitNum;

  try {
    // ถ้าไม่ได้เรียงตาม submissions ให้ใช้วิธีปกติ
    const sortOptions = {
      "ใหม่ที่สุด": "-updatedAt",
      "เก่าที่สุด": "updatedAt",
      "เรียงชื่อ ก-ฮ": "name",
      "เรียงชื่อ ฮ-ก": "-name",
    };
    
    // ใช้ sortKey จากตัวเลือก
    const sortKey = sortOptions[sort] || sortOptions["ใหม่ที่สุด"];
    console.log("🔍 Using sort key:", sortKey);
    
    // ดึงข้อมูลด้วย find และ sort ปกติ
    const missions = await Mission.find(queryObject)
      .sort(sortKey)
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: "submission",
        model: "submissions",
      });
    
    // Debug timestamp data more extensively
    if (missions.length > 0) {
      const firstMission = missions[0];
      console.log("🔍 First mission document structure:");
      console.log("  Document keys:", Object.keys(firstMission._doc || firstMission).join(', '));
      console.log("  createdAt exists:", firstMission.hasOwnProperty('createdAt'));
      console.log("  createdAt type:", firstMission.createdAt ? typeof firstMission.createdAt : 'undefined');
      console.log("  createdAt value:", firstMission.createdAt);
      console.log("  _id timestamp:", firstMission._id.getTimestamp());
      
      console.log("🔍 Mission results sample:");
      missions.slice(0, 5).forEach(mission => {
        const submissionCount = mission.submission ? mission.submission.length : 0;
        // Use explicit date conversion to ensure we're seeing the actual value
        const createdDate = mission.createdAt 
          ? new Date(mission.createdAt).toISOString() 
          : 'undefined';
        console.log(`  ID: ${mission._id}, No: ${mission.no}, Name: ${mission.name}, Type: ${mission.missionType}, Submissions: ${submissionCount}, CreatedAt: ${createdDate}`);
      });
    }
    
    const totalMissions = await Mission.countDocuments(queryObject);
    const numOfPages = Math.ceil(totalMissions / limitNum);
    
    console.log(`🔍 Found ${missions.length} missions out of ${totalMissions} total`);
    if (missions.length === 0 && missionType && missionType !== "ทั้งหมด") {
      console.log("⚠️ No missions found with this filter. Sample data without filter:");
      
      const anyMissions = await Mission.find({ isDeleted: { $ne: true } }).limit(5);
      if (anyMissions.length > 0) {
        anyMissions.forEach(m => {
          const submissionCount = m.submission ? m.submission.length : 0;
          console.log(`  ID: ${m._id}, No: ${m.no}, Name: ${m.name}, Type: ${m.missionType}, Submissions: ${submissionCount}, Created: ${m.createdAt}`);
        });
      } else {
        console.log("⚠️ No missions found in database at all");
      }
    }
    
    console.log("====================================\n");
    
    // ส่งผลลัพธ์กลับไปยัง client
    return res.status(StatusCodes.OK).json({
      totalMissions,
      numOfPages,
      currentPage: pageNum,
      missions,
    });
  } catch (error) {
    console.error("❌ Error in getAllMissions:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Failed to retrieve missions",
      error: error.message,
    });
  }
};

export const createMission = async (req, res) => {
  const { no, name, isEvaluate, missionType } = req.body;
  console.log("🔍 Creating mission with data:", req.body);
  
  if (!missionType) {
    console.log("⚠️ Warning: No missionType provided in request");
  }
  
  const newMission = new Mission({
    no: no,
    name,
    isEvaluate,
    missionType: missionType // Make sure missionType is included
  });

  try {
    await newMission.save();
    console.log("✅ Mission created successfully with data:", {
      id: newMission._id,
      no: newMission.no,
      name: newMission.name,
      missionType: newMission.missionType
    });
    
    res.status(StatusCodes.CREATED).json({
      msg: "Mission created successfully"
    });
  } catch (error) {
    console.error("❌ Error creating mission:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Error creating mission",
      error: error.message
    });
  }
};

export const getMission = async (req, res) => {
  const { id } = req.params;
  const mission = await Mission.findById(id).populate({
    path: 'submission',
    model: 'submissions'
  });
  if (!mission) throw new NotFoundError(`No mission with id: ${id}`);
  res.status(StatusCodes.OK).json({ mission });
};

export const updateMissionWithSubmissions = async (req, res) => {
  const { id } = req.params;
  const { submissionUpdates, ...missionData } = req.body;

  try {
    // Update mission data
    const mission = await Mission.findById(id);
    if (!mission) throw new NotFoundError(`No mission with id: ${id}`);

    // Update mission fields
    Object.assign(mission, missionData);
    await mission.save();

    // Update submissions if provided
    if (submissionUpdates && Array.isArray(submissionUpdates)) {
      const updatePromises = submissionUpdates.map(async (subUpdate) => {
        if (!subUpdate._id) return null;

        const submission = await Submission.findById(subUpdate._id);
        if (!submission) {
          console.warn(`Submission not found with id: ${subUpdate._id}`);
          return null;
        }

        Object.assign(submission, {
          name: subUpdate.name,
          imageUrl: subUpdate.imageUrl || submission.imageUrl,
          videoUrl: subUpdate.videoUrl || submission.videoUrl,
          evaluate: subUpdate.evaluate
        });

        return submission.save();
      });

      await Promise.all(updatePromises.filter(Boolean));
    }

    // Return updated mission with populated submissions
    const updatedMission = await Mission.findById(id).populate({
      path: 'submission',
      model: 'submissions'
    });

    res.status(StatusCodes.OK).json({ mission: updatedMission });
  } catch (error) {
    console.error('Error in updateMissionWithSubmissions:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Error updating mission and submissions',
      error: error.message
    });
  }
};

export const deleteMission = async (req, res) => {
  const { id } = req.params;
  const mission = await Mission.findById(id);

  for (let i = 0; i < mission.submission.length; i++) {
    const submission = await Submission.findOneAndDelete({ _id: mission.submission[i] });
  }

  if (!mission) throw new NotFoundError(`No mission with id: ${id}`);

  await Mission.findOneAndDelete({ _id: mission._id });

  res.status(StatusCodes.OK).json({ msg: "Mission and associated submissions soft deleted successfully", mission });
};

export const getAllSubmissions = async (req, res) => {
  const submissions = await Submission.find({});
  res.status(StatusCodes.OK).json({ submissions });
};

export const createSubmission = async (req, res) => {
  const submission = await Submission.create(req.body);
  res.status(StatusCodes.CREATED).json({ submission });
};

export const getSubmission = async (req, res) => {
  const { id } = req.params;
  const submission = await Submission.findById(id);
  if (!submission) throw new NotFoundError(`No submission with id: ${id}`);
  res.status(StatusCodes.OK).json({ submission });
};

export const updateSubmission = async (req, res) => {
  const { id } = req.params;
  const submission = await Submission.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  if (!submission) throw new NotFoundError(`No submission with id: ${id}`);
  res.status(StatusCodes.OK).json({ submission });
};

export const deleteSubmission = async (req, res) => {
  const { missionId, submissionId } = req.params;

  const submission = await Submission.findByIdAndDelete(submissionId);
  const mission = await MissionModel.updateOne(
    { _id: missionId },
    { $pull: { submission: submissionId } }
  );

  if (!submission) throw new NotFoundError(`No submission with id: ${mission}`);
  res.status(StatusCodes.OK).json({ msg: "Submission deleted successfully", submission });
};

export const createMissionWithSubmissions = async (req, res) => {
  const { id, submissionsData } = req.body;
  try {
    const submissionToCreate = {
      name: submissionsData.name,
      videoUrl: submissionsData.videoUrl || "",
      imageUrl: submissionsData.imageUrl || "",
      evaluate: submissionsData.evaluate
    };


    const submission = await Submission.create(submissionToCreate);
    const mission = await Mission.updateOne(
      { _id: id },
      { $push: { submission: submission._id } }
    );

    // const populatedMission = await Mission.findById(mission._id).populate({
    //   path: 'submission',
    //   model: 'submissions'
    // });

    res.status(StatusCodes.CREATED).json({ submission });
  } catch (error) {
    console.error('Error in createMissionWithSubmissions:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Error creating mission with submissions',
      error: error.message
    });
  }
};

// Add new function to get soft deleted missions
export const getSoftDeletedMissions = async (req, res) => {
  try {
    const missions = await Mission.find({ isDeleted: true })
      .populate({
        path: 'submission',
        model: 'submissions'
      });
    res.status(StatusCodes.OK).json({ missions });
  } catch (error) {
    console.error('Error in getSoftDeletedMissions:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Error getting soft deleted missions',
      error: error.message
    });
  }
};

// Add function to restore soft deleted missions
export const restoreMission = async (req, res) => {
  const { id } = req.params;
  try {
    const mission = await Mission.findById(id);
    if (!mission) throw new NotFoundError(`No mission with id: ${id}`);

    // Restore the mission
    mission.isDeleted = false;
    await mission.save();

    // Restore associated submissions
    if (mission.submission && mission.submission.length > 0) {
      await Submission.updateMany(
        { _id: { $in: mission.submission } },
        { isDeleted: false }
      );
    }

    res.status(StatusCodes.OK).json({
      msg: "Mission and associated submissions restored successfully",
      mission
    });
  } catch (error) {
    console.error('Error in restoreMission:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Error restoring mission',
      error: error.message
    });
  }
};

