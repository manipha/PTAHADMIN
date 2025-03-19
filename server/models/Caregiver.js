import mongoose from "mongoose";
import { RELATIONS, HAVECAREGIVER } from "../utils/constants.js";

const CaregiverScehma = new mongoose.Schema(
  {
    caregiverID_card_number: String,
    caregiverName: String,
    caregiverSurname: String,
    // Relationship: String,
    caregiverTel: String,
    caregiverRelationship: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        relationship: String,
      },
    ],
    // user: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // เปลี่ยนเป็น array
    // user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    collection: "Caregiver",
    timestamps: true,
    strictPopulate: false, // เพิ่มบรรทัดนี้
  }
);

export default mongoose.model("Caregiver", CaregiverScehma);
