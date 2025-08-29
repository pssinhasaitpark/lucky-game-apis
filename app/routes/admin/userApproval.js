import express from 'express'
const router = express.Router();
import { approveUser,getAllPendingUsers,getAllApprovedUsers} from "../../controllers/admin/userApprovalByAdmin.js"
import { isAdmin, verifyToken } from '../../middlewares/jwtAuth.js';

router.post("/approve-user/:id",verifyToken,isAdmin,approveUser);

router.get("/pending-users",verifyToken,isAdmin,getAllPendingUsers);

router.get("/approved-users",verifyToken,isAdmin,getAllApprovedUsers);


export default router