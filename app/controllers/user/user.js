import User from '../../models/user/user.js';
import bcrypt from 'bcrypt';
import { handleResponse } from '../../utils/helper.js';
import { signAccessToken } from '../../middlewares/jwtAuth.js';


export const registerUser = async (req, res) => {
    const { name, email, mobile } = req.body;
    try {
        const existing = await User.findOne({ email });
        if (existing) return handleResponse(res, 400, "User already registered");

        const user = new User({ name, email, mobile });
        await user.save();
        handleResponse(res, 201, "Registered successfully, wait for admin approval");
    } catch (err) {
        handleResponse(res, 500, "Server error");
    }
};


export const loginUser = async (req, res) => {
    const { userId, password } = req.body;
    try {
      const user = await User.findOne({ userId });
  
      if (!user || !user.isApproved) {
        return handleResponse(res, 401, "Not approved yet or invalid ID");
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return handleResponse(res, 400, "Invalid password");
  
     
      const token = await signAccessToken(user._id.toString(), user.role); 
      handleResponse(res, 200, "Login successful", {
        token,
        role: user.role
      });
    } catch (err) {
      console.log("err=", err);
      handleResponse(res, 500, "Server error");
    }
  };


export const registerAdmin = async (req, res) => {
    const { name, email, mobile, password } = req.body;

    try {
        const existing = await User.findOne({ email });
        if (existing) return handleResponse(res, 400, "Admin already exists");

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            mobile,
            password: hashedPassword,
            role: 'admin',
            isApproved: true,
            userId: 'ADMIN_' + Math.floor(1000 + Math.random() * 9000)
        });

        await user.save();

        handleResponse(res, 201, "Admin registered successfully", {
            admin: {
                name: user.name,
                email: user.email,
                userId: user.userId
            }
        });
    } catch (err) {
        console.log("err===",err);
        
        handleResponse(res, 500, "Server error");
    }
};
