import WalletRequest from '../models/transaction/walletRecharge.js';
import { handleResponse } from '../utils/helper.js';

import User from '../models/user/user.js';
import Transaction from '../models/transaction/transaction.js';



export const createWalletRequest = async (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return handleResponse(res, 400, "Invalid amount");
  }

  try {
    const walletRequest = new WalletRequest({
      userId,
      amount,
    });

    await walletRequest.save();
    return handleResponse(res, 201, "Wallet top-up request created", walletRequest);
  } catch (err) {
    console.error("Create wallet request error:", err);
    return handleResponse(res, 500, "Server error");
  }
};



export const getWalletRequests = async (req, res) => {
  try {
    const { status, user, page = 1, limit = 10, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (user) filter.userId = new mongoose.Types.ObjectId(user);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const searchFilter = search
      ? {
          $or: [
            { 'userId.name': { $regex: search, $options: 'i' } },
            { 'userId.email': { $regex: search, $options: 'i' } },
            { 'userId.userId': { $regex: search, $options: 'i' } },
          ],
        }
      : {};


    const aggregatePipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId',
        },
      },
      { $unwind: '$userId' },
      { $match: { ...filter } },
    ];

    if (search) {
      aggregatePipeline.push({ $match: searchFilter });
    }

    
    const countPipeline = [...aggregatePipeline, { $count: 'count' }];
    const countResult = await WalletRequest.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].count : 0;

   
    aggregatePipeline.push({
      $project: {
        amount: 1,
        status: 1,
        requestedAt: 1,
        respondedAt: 1,
        responseNote: 1,
        userId: {
          _id: 1,
          name: 1,
          email: 1,
          userId: 1,
          mobile: 1,
        },
      },
    });

    aggregatePipeline.push({ $sort: { requestedAt: -1 } });
    aggregatePipeline.push({ $skip: skip });
    aggregatePipeline.push({ $limit: limitNum });

    const requests = await WalletRequest.aggregate(aggregatePipeline);

    return handleResponse(res, 200, "Wallet requests fetched successfully", {
      total,
      page: pageNum,
      limit: limitNum,
      requests,
    });
  } catch (err) {
    console.error("Fetch wallet requests error:", err);
    return handleResponse(res, 500, "Server error");
  }
};



export const respondToWalletRequest = async (req, res) => {
  const adminId = req.user.id; 
  const requestId = req.params.id;
  const { action } = req.body; 

  if (!['approve', 'reject'].includes(action)) {
    return handleResponse(res, 400, "Invalid action");
  }

  try {
    const request = await WalletRequest.findById(requestId);
    if (!request) return handleResponse(res, 404, "Wallet request not found");
    if (request.status !== 'pending') return handleResponse(res, 400, "Request already processed");

    if (action === 'approve') {
      const user = await User.findById(request.userId);
      if (!user) return handleResponse(res, 404, "User not found");

      user.wallet += request.amount;
      await user.save();

      const transaction = new Transaction({
        userId: user._id,
        transactionType: 'deposit',
        amount: request.amount,
        newBalance: user.wallet,
        description: "Wallet top-up approved by admin"
      });
      await transaction.save();

      request.status = 'approved';
    } else if (action === 'reject') {
      request.status = 'rejected';
    }

    request.adminId = adminId;
    request.respondedAt = new Date();
    await request.save();

    return handleResponse(res, 200, `Request ${action}d successfully`, request);
  } catch (err) {
    console.error("Respond wallet request error:", err);
    return handleResponse(res, 500, "Server error");
  }
};

export const getMyWalletRequests = async (req, res) => {
  const userId = req.user.id;

  try {
    const requests = await WalletRequest.find({ userId }, { adminId: 0, __v: 0 })
      .sort({ requestedAt: -1 });
    return handleResponse(res, 200, "Your wallet requests fetched successfully", requests);
  } catch (err) {
    console.error("Get my wallet requests error:", err);
    return handleResponse(res, 500, "Server error");
  }
};

