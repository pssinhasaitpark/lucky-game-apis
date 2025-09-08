import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
  counterpartyId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
  transactionType: {
    type: String,
    enum: ["deposit", "deduction"],
    required: true,
  },
  amount: { type: Number, required: true },
  newBalance: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
