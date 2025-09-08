import User from "../../models/user/user.js";
import bcrypt from "bcrypt";
import { handleResponse } from "../../utils/helper.js";
import { signAccessToken } from "../../middlewares/jwtAuth.js";
import Transaction from "../../models/transaction/transaction.js";
export const registerUser = async (req, res) => {
  const { name, email, mobile } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return handleResponse(res, 400, "User already registered");

    const user = new User({ name, email, mobile });
    await user.save();
    handleResponse(
      res,
      201,
      "Registered successfully, wait for admin approval"
    );
  } catch (err) {
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
      role: "admin",
      isApproved: true,
      userId: "ADMIN_" + Math.floor(1000 + Math.random() * 9000),
    });

    await user.save();

    handleResponse(res, 201, "Admin registered successfully", {
      admin: {
        name: user.name,
        email: user.email,
        userId: user.userId,
      },
    });
  } catch (err) {
    console.log("err===", err);

    handleResponse(res, 500, "Server error");
  }
};

export const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return handleResponse(res, 400, "All fields are required");
  }

  if (newPassword !== confirmPassword) {
    return handleResponse(
      res,
      400,
      "New password and confirm password do not match"
    );
  }

  try {
    const user = await User.findById(userId);
    if (!user) return handleResponse(res, 404, "User not found");

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return handleResponse(res, 400, "Old password is incorrect");

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    return handleResponse(res, 200, "Password changed successfully");
  } catch (err) {
    console.error("Change password error:", err);
    return handleResponse(res, 500, "Server error");
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
      role: user.role,
    });
  } catch (err) {
    console.log("err=", err);
    handleResponse(res, 500, "Server error");
  }
};


export const transferWalletBalance = async (req, res) => {
  const senderId = req.user.id;
  const { recipientUserId, amount } = req.body;

  if (!recipientUserId || !amount || isNaN(amount) || amount <= 0) {
    return handleResponse(res, 400, "Invalid recipient or amount");
  }

  try {
    const sender = await User.findById(senderId);
    if (!sender) return handleResponse(res, 404, "Sender not found");

    if (sender.userId === recipientUserId) {
      return handleResponse(res, 400, "Cannot transfer to yourself");
    }

    const recipient = await User.findOne({ userId: recipientUserId });
    if (!recipient) return handleResponse(res, 404, "Recipient not found");

    if (sender.wallet < amount) {
      return handleResponse(res, 400, "Insufficient balance");
    }



    sender.wallet -= amount;
    recipient.wallet += amount;

    await sender.save();
    await recipient.save();

    const senderTransaction = new Transaction({
      userId: sender._id,
      counterpartyId: recipient._id,
      transactionType: 'deduction',
      amount,
      newBalance: sender.wallet,
    });
    
    const recipientTransaction = new Transaction({
      userId: recipient._id,
      counterpartyId: sender._id, 
      transactionType: 'deposit',
      amount,
      newBalance: recipient.wallet,
    });
    

    await senderTransaction.save();
    await recipientTransaction.save();

    return handleResponse(res, 200, "Transfer successful", {
      from: {
        userId: sender.userId,
        name: sender.name,
        email: sender.email,
        balance: sender.wallet
      },
      to: {
        userId: recipient.userId,
        name: recipient.name,
        email: recipient.email,
        balance: recipient.wallet
      },
      amountTransferred: amount
    });
    
  } catch (err) {
    console.error("Transfer error:", err);
    return handleResponse(res, 500, "Server error");
  }
};


export const getUserProfile = async (req, res) => {
  const userId = req.user.id; 

  try {
    const user = await User.findById(userId).select("-password -password_reset_jti"); 

    if (!user) {
      return handleResponse(res, 404, "User not found");
    }

    return handleResponse(res, 200, "User profile fetched successfully", { user });
  } catch (error) {
    console.error("Get profile error:", error);
    return handleResponse(res, 500, "Server error");
  }
};
