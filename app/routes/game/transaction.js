import express from "express";
import { getTransactionHistory,getFullTransactionHistory} from "../../controllers/transaction.js";
import { verifyToken } from "../../middlewares/jwtAuth.js";

const router = express.Router();

router.get('/full-history', verifyToken, getFullTransactionHistory);

router.get("/", verifyToken, getTransactionHistory);


export default router;
