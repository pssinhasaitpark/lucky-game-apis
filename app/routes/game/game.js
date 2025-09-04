import express from "express";
import {
  playGame,
  getMyLastGameResult,
  setWinningNumberManually,
  getLatestWinningNumbers,
  getAllGameStatsForAdmin,
  getGameDetailsById,
} from "../../controllers/game.js";
import { isAdmin, verifyToken } from "../../middlewares/jwtAuth.js";

const router = express.Router();

// USER ROUTES
router.post("/play", verifyToken, playGame);
router.get("/my-last-result", verifyToken, getMyLastGameResult);
router.get("/latest-winners", verifyToken, getLatestWinningNumbers);

// ADMIN ROUTES
router.post(
  "/admin/set-winning-number",
  verifyToken,
  isAdmin,
  setWinningNumberManually
);
router.get("/admin/game-stats", verifyToken, isAdmin, getAllGameStatsForAdmin); 

router.get("/admin/:gameId", verifyToken, isAdmin, getGameDetailsById);

export default router;
