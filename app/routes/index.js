import userRoutes from "../routes/user/user.js";
import adminUserApprovalRoutes from "../routes/admin/userApproval.js";
import gameRoutes from "../routes/game/game.js";
import transactionRoutes from "../routes/game/transaction.js";
import walletRechargeRequestRoutes from "../routes/game/walletRecharge.js";
export default (app) => {
  app.use("/api/v1/user", userRoutes);

  app.use("/api/v1/admin", adminUserApprovalRoutes);

  app.use("/api/v1/game", gameRoutes);

  app.use("/api/v1/transactions", transactionRoutes);

  app.use("/api/v1", walletRechargeRequestRoutes);
};
