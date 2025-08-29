import express from 'express'
const router = express.Router();
import { loginUser, registerUser,registerAdmin } from "../../controllers/user/user.js"

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/register",registerAdmin)

export default router