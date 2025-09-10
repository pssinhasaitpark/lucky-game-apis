import mongoose from 'mongoose';

const walletRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected"], 
    default: "pending" 
  },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who approved/rejected
  requestedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date }
});

const WalletRequest = mongoose.model("WalletRequest", walletRequestSchema);

export default WalletRequest;
