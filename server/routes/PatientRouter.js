import { Router } from "express";
const router = Router();

import {
  getAllPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  showStats,
} from "../controllers/PatientController.js";
import {
  validatePatientInput,
  validateIdParam,
} from "../middleware/validationMiddleware.js";

// Middleware to handle URL encoding issues with Thai characters
const decodeQueryParameters = (req, res, next) => {
  try {
    console.log("Middleware: Full query params:", req.query);
    
    // Check for Thai characters in userStatus that need decoding
    if (req.query.userStatus) {
      // Log original value for debugging
      console.log("Original userStatus:", req.query.userStatus);
      
      // Check if already decoded (Thai characters will be present)
      if (!/[\u0E00-\u0E7F]/.test(req.query.userStatus) && req.query.userStatus.includes('%')) {
        try {
          req.query.userStatus = decodeURIComponent(req.query.userStatus);
          console.log("Decoded userStatus:", req.query.userStatus);
        } catch (e) {
          console.error("Error decoding userStatus:", e);
        }
      }
    }
    
    // Add logging for all request headers to debug potential issues
    console.log("Request headers:", JSON.stringify(req.headers, null, 2));
    
    next();
  } catch (error) {
    console.error("Error in decodeQueryParameters middleware:", error);
    next(); // Continue despite error
  }
};

// router.get('/', getAllPatients);
// router.post('/', createPatient);

router.route("/").get(decodeQueryParameters, getAllPatients).post(validatePatientInput, createPatient);

router.route("/stats").get(showStats);

router
  .route("/:_id")
  .get(validateIdParam, getPatient)
  .patch(validateIdParam, updatePatient)
  .delete(validateIdParam, deletePatient);

export default router;
