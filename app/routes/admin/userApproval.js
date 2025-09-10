import express from "express";
const router = express.Router();
import {
  approveUser,
  blockUser,
  getAllPendingUsers,
  getAllApprovedUsers,
  getUserFullDetails,
  deleteUser,
} from "../../controllers/admin/userApprovalByAdmin.js";
import { isAdmin, verifyToken } from "../../middlewares/jwtAuth.js";

router.post("/approve-user/:id", verifyToken, isAdmin, approveUser);

router.patch("/block-user/:id", verifyToken, isAdmin, blockUser);

router.get("/user/:id/details", verifyToken, isAdmin, getUserFullDetails);

router.get("/pending-users", verifyToken, isAdmin, getAllPendingUsers);

router.get("/approved-users", verifyToken, isAdmin, getAllApprovedUsers);

router.delete("/user/:id", verifyToken, isAdmin, deleteUser);

export default router;
