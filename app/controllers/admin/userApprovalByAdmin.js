import User from '../../models/user/user.js';
import bcrypt from 'bcrypt';
import { sendEmail } from '../../utils/sendEmail.js';
import { handleResponse } from '../../utils/helper.js';
import Transaction from '../../models/transaction/transaction.js';

import mongoose from 'mongoose';

import Game from '../../models/game/game.js';
const generateUserId = () => {
    return "UID" + Math.floor(100000 + Math.random() * 900000);
};

// const generatePassword = () => {
//     return Math.random().toString(36).slice(-8);
// };

export const getAllPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ isApproved: false })
      .sort({ createdAt: -1 }); 

    handleResponse(res, 200, "Pending users fetched", users);
  } catch (err) {
    console.error("Error fetching pending users:", err);
    handleResponse(res, 500, "Server error");
  }
};


export const blockUser = async (req, res) => {
  const userId = req.params.id;
  const { block } = req.body;


  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return handleResponse(res, 400, "Invalid user ID format");
  }

  try {
    const user = await User.findById(userId);
    if (!user) return handleResponse(res, 404, "User not found");

    user.isBlocked = block;
    await user.save();

    const msg = block ? "User blocked successfully" : "User unblocked successfully";
    return handleResponse(res, 200, msg, { userId: user.userId, isBlocked: user.isBlocked });
  } catch (err) {
    console.error("Block user error:", err);
    return handleResponse(res, 500, "Server error");
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
    })
    .sort({ createdAt: -1 })  
    .select('-password -password_reset_jti');

    handleResponse(res, 200, "Approved users fetched", users);
  } catch (err) {
    console.error(err);
    handleResponse(res, 500, "Server error");
  }
};

export const deleteUser = async (req, res) => {
  const { id: userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return handleResponse(res, 404, "User not found");
    }



    await Transaction.deleteMany({ userId: user._id });

  
    await user.deleteOne();

    return handleResponse(res, 200, "User deleted successfully");
  } catch (err) {
    console.error("Error deleting user:", err);
    return handleResponse(res, 500, "Server error");
  }
};

export const getUserFullDetails = async (req, res) => {
  const { id: userId } = req.params;

  try {

    const user = await User.findById(userId).select('-password -password_reset_jti').lean();
    if (!user) return handleResponse(res, 404, "User not found");


    const games = await Game.find({ 'users.userId': userId, gameStatus: 'completed' })
      .sort({ timestamp: -1 })
      .lean();

    let totalWon = 0;
    let totalLost = 0;
    const gameHistory = [];

    for (const game of games) {

      const userBids = game.users.filter(u => u.userId.toString() === userId);

      for (const bid of userBids) {
        const isWin = bid.result === 'win';
        const winAmount = isWin ? bid.selectedNumber * bid.bidAmount : 0;

        if (isWin) totalWon += winAmount;
        else totalLost += bid.bidAmount;

        gameHistory.push({
          gameId: game.gameId,
          selectedNumber: bid.selectedNumber,
          bidAmount: bid.bidAmount,
          winningNumber: game.winningNumber,
          result: bid.result,
          winAmount,
          totalParticipants: game.users.length,
          timestamp: game.timestamp
        });
      }
    }


    const transactions = await Transaction.find({ userId })
      .sort({ timestamp: -1 })
      .lean();

    return handleResponse(res, 200, "User full details fetched successfully", {
      user,
      stats: {
        totalGames: gameHistory.length,
        totalWon,
        totalLost,
        net: totalWon - totalLost
      },
      gameHistory,
      transactions
    });

  } catch (err) {
    console.error("Error fetching user details:", err);
    return handleResponse(res, 500, "Server error");
  }
};
