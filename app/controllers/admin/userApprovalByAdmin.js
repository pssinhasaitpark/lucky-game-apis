import User from '../../models/user/user.js';
import bcrypt from 'bcrypt';
import { sendEmail } from '../../utils/sendEmail.js';
import { handleResponse } from '../../utils/helper.js';
import Transaction from '../../models/transaction/transaction.js';

const generateUserId = () => {
    return "UID" + Math.floor(100000 + Math.random() * 900000);
};

// const generatePassword = () => {
//     return Math.random().toString(36).slice(-8);
// };

export const getAllPendingUsers = async (req, res) => {
    try {
        const users = await User.find({ isApproved: false });
        handleResponse(res, 200, "Pending users fetched", users);
    } catch (err) {
        handleResponse(res, 500, "Server error");
    }
};


export const approveUser = async (req, res) => {
  const userId = req.params.id;
  const { isApproved } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return handleResponse(res, 404, "User not found");

   
    if (isApproved === true && user.isApproved === true) {
      return handleResponse(res, 400, "User is already approved");
    }

   
    if (isApproved === true && user.isApproved === false) {
      if (user.role === 'ADMIN') {
        return handleResponse(res, 400, "Admin users cannot be approved by other admins.");
      }

      const uid = generateUserId();
      const password = "12345678";
      const hashedPassword = await bcrypt.hash(password, 10);

      user.userId = uid;
      user.password = hashedPassword;
      user.wallet = 1000; 
      user.isApproved = true;
      await user.save();

     
      await Transaction.create({
        userId: user._id,
        transactionType: 'deposit',
        amount: 1000,
        newBalance: user.wallet,
        description: `Initial wallet credit on approval`
      });

      await sendEmail(user.email, {
        type: "approval",
        userId: uid,
        password: password,
      });

      return handleResponse(res, 200, "User approved and email sent", {
        userId: uid,
        email: user.email,
        wallet: user.wallet,
      });
    }

 
    if (isApproved === false && user.isApproved === false) {
      return handleResponse(res, 400, "User is already not approved");
    }

    
    if (isApproved === false && user.isApproved === true) {
      if (user.role === 'ADMIN') {
        return handleResponse(res, 400, "Admin approval cannot be revoked.");
      }

      user.isApproved = false;
      await user.save();

      await sendEmail(user.email, {
        type: "revoked",
      });

      return handleResponse(res, 200, "User approval revoked and email sent", {
        userId: user.userId,
        email: user.email,
      });
    }

    return handleResponse(res, 400, "Invalid approval status");
  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, "Server error");
  }
};


export const getAllApprovedUsers = async (req, res) => {
  try {
    const users = await User.find({ 
      isApproved: true, 
      role: { $ne: 'admin' } 
    }).select('-password -password_reset_jti');

    handleResponse(res, 200, "Approved users fetched", users);
  } catch (err) {
    console.error(err);
    handleResponse(res, 500, "Server error");
  }
};
