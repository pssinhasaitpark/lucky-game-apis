import express from "express";
import {
  createWalletRequest,
  getWalletRequests,
  respondToWalletRequest,
  getMyWalletRequests,
} from "../../controllers/walletRecharge.js";
import { isAdmin, verifyToken } from "../../middlewares/jwtAuth.js";

const router = express.Router();

router.post("/user/wallet-requests", verifyToken, createWalletRequest);

router.get("/user/wallet-requests", verifyToken, getMyWalletRequests);

router.get(
  "/admin/wallet-requests/pending",
  verifyToken,
  isAdmin,
  getWalletRequests
);

router.patch(
  "/admin/wallet-requests/:id/respond",
  verifyToken,
  isAdmin,
  respondToWalletRequest
);

export default router;
