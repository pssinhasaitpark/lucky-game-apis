import express from 'express';
import {
    getTransactionHistory
} from '../../controllers/transaction.js';  
import { verifyToken } from '../../middlewares/jwtAuth.js';

const router = express.Router();

router.get("/",verifyToken,getTransactionHistory)

export default router;
