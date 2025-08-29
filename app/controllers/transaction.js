import Transaction from '../models/transaction/transaction.js';

export const getTransactionHistory = async (req, res) => {
    const userId = req.user.id;  
      
    try {
      const transactions = await Transaction.find({ userId }).sort({ timestamp: -1 });
      res.status(200).json({ transactions });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  };
  
