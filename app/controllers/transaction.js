import Transaction from '../models/transaction/transaction.js';
import { handleResponse } from '../utils/helper.js';
export const getTransactionHistory = async (req, res) => {
    const userId = req.user.id;  
      
    try {
      const transactions = await Transaction.find({ userId }).sort({ timestamp: -1 });
      return handleResponse(res,200, "Transaction details fetched", transactions);
      
    } catch (err) {
      console.error(err);
      return handleResponse(res,500, "Server error");

    }
};
  

export const getFullTransactionHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const transactions = await Transaction.find({ userId })
      .sort({ timestamp: -1 })
      .populate("counterpartyId", "userId name email"); 

    const formatted = transactions.map(txn => ({
      type: txn.transactionType,
      amount: txn.amount,
      balanceAfter: txn.newBalance,
      timestamp: txn.timestamp,
      withUser: txn.counterpartyId
        ? {
            userId: txn.counterpartyId.userId,
            name: txn.counterpartyId.name,
            email: txn.counterpartyId.email,
          }
        : null
    }));

    return handleResponse(res, 200, "Transaction history fetched successfully",  formatted );

  } catch (err) {
    console.error("History fetch error:", err);
    return handleResponse(res, 500, "Server error");
  }
};

  
