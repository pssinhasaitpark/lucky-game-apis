import express from "express";
const router = express.Router();
import {
  loginUser,
  registerUser,
  registerAdmin,
  changePassword,
  transferWalletBalance,
  getUserProfile,
} from "../../controllers/user/user.js";
import { verifyToken } from "../../middlewares/jwtAuth.js";

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/register", registerAdmin);
router.post("/change-password", verifyToken, changePassword);
router.post("/wallet/transfer", verifyToken, transferWalletBalance);

router.get("/profile", verifyToken, getUserProfile);

export default router;
