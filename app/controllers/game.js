import User from "../models/user/user.js";
import Game from "../models/game/game.js";
import Transaction from "../models/transaction/transaction.js";
import { v4 as uuidv4 } from "uuid";
import cron from "node-cron";
import { handleResponse } from "../utils/helper.js";
const betAmounts = [1, 5, 10, 20, 50, 100, 200, 500, 1000, 5000];

/* export const playGame = async (req, res) => {
  const { bids } = req.body; // New structure
  const userId = req.user.id;

  if (!Array.isArray(bids) || bids.length === 0) {
    return handleResponse(res, 400, "'bids' must be a non-empty array.");
  }

  // Validate all bids
  for (const bid of bids) {
    if (
      typeof bid.number !== "number" ||
      bid.number < 0 ||
      bid.number > 9 ||
      typeof bid.amount !== "number" ||
      !betAmounts.includes(bid.amount)
    ) {
      return handleResponse(
        res,
        400,
        "Each bid must have a valid number (0–9) and amount from allowed betAmounts."
      );
    }
  }

  try {
    const activeGame = await Game.findOne({ gameStatus: "active" }).sort({
      timestamp: -1,
    });
    if (!activeGame) {
      return handleResponse(res, 400, "No active game found");
    }

    const user = await User.findById(userId);
    if (!user) return handleResponse(res, 404, "User not found");
    if (typeof user.wallet !== "number") user.wallet = 0;

    const totalBidAmount = bids.reduce((sum, bid) => sum + bid.amount, 0);

    if (user.wallet < totalBidAmount) {
      return handleResponse(res, 400, "Insufficient balance for total bid.");
    }

    // Deduct wallet
    user.wallet -= totalBidAmount;

    await Transaction.create({
      userId: user._id,
      transactionType: "deduction",
      amount: totalBidAmount,
      newBalance: user.wallet,
      description: `Placed ${bids.length} bids in game ${activeGame.gameId}`,
    });

    await user.save();

    // Save each bid in the game
    for (const bid of bids) {
      activeGame.users.push({
        userId: user._id,
        selectedNumber: bid.number,
        bidAmount: bid.amount,
        result: null,
      });
    }

    await activeGame.save();

    return handleResponse(res, 200, "Bids placed successfully", {
      balance: user.wallet,
      gameId: activeGame.gameId,
      totalBidAmount,
      bids,
    });
  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, "Server error");
  }
};
 */

export const playGame = async (req, res) => {
  const { bids } = req.body; // New structure
  const userId = req.user.id;

  if (!Array.isArray(bids) || bids.length === 0) {
    return handleResponse(res, 400, "'bids' must be a non-empty array.");
  }

  // Validate all bids
  for (const bid of bids) {
    if (
      typeof bid.number !== "number" ||
      bid.number < 0 ||
      bid.number > 9 ||
      typeof bid.amount !== "number" ||
      !betAmounts.includes(bid.amount)
    ) {
      return handleResponse(
        res,
        400,
        "Each bid must have a valid number (0–9) and amount from allowed betAmounts."
      );
    }
  }

  try {
    const activeGame = await Game.findOne({ gameStatus: "active" }).sort({
      timestamp: -1,
    });
    if (!activeGame) {
      return handleResponse(res, 400, "No active game found");
    }

    const user = await User.findById(userId);
    if (!user) return handleResponse(res, 404, "User not found");
    if (typeof user.wallet !== "number") user.wallet = 0;

    // Aggregate bids by number and amount to combine multiples
    const aggregatedBids = bids.reduce((acc, bid) => {
      const key = `${bid.number}-${bid.amount}`;
      if (!acc[key]) {
        acc[key] = { number: bid.number, amount: bid.amount, count: 1 };
      } else {
        acc[key].count += 1;
      }
      return acc;
    }, {});

    // Calculate total bid amount from aggregated bids
    const totalBidAmount = Object.values(aggregatedBids).reduce(
      (sum, bid) => sum + bid.amount * bid.count,
      0
    );

    if (user.wallet < totalBidAmount) {
      return handleResponse(res, 400, "Insufficient balance for total bid.");
    }

    // Deduct wallet
    user.wallet -= totalBidAmount;

    await Transaction.create({
      userId: user._id,
      transactionType: "deduction",
      amount: totalBidAmount,
      newBalance: user.wallet,
      description: `Placed ${bids.length} bids in game ${activeGame.gameId}`,
    });

    await user.save();

    // Save aggregated bids in the game
    for (const key in aggregatedBids) {
      const bid = aggregatedBids[key];
      activeGame.users.push({
        userId: user._id,
        selectedNumber: bid.number,
        bidAmount: bid.amount,
        count: bid.count,
        result: null,
      });
    }

    await activeGame.save();

    return handleResponse(res, 200, "Bids placed successfully", {
      balance: user.wallet,
      gameId: activeGame.gameId,
      totalBidAmount,
      bids,
    });
  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, "Server error");
  }
};

/* export const finalizeGameResults = async (game) => {
  try {
    if (game.winningNumber === null || game.winningNumber === undefined) {
      const randomWinningNumber = Math.floor(Math.random() * 10);
      game.winningNumber = randomWinningNumber;
      game.adminSet = false;
      await game.save();
    }

    for (let i = 0; i < game.users.length; i++) {
      const player = game.users[i];
      const user = await User.findById(player.userId);
      if (!user) {
        console.log(`User ${player.userId} not found`);
        continue;
      }

      let result;
      let winAmount = 0;

      if (player.selectedNumber === game.winningNumber) {
        result = "win";
        // winAmount = player.bidAmount * 2;
        winAmount = player.selectedNumber * player.bidAmount;
        user.wallet += winAmount;

        await Transaction.create({
          userId: user._id,
          transactionType: "deposit",
          amount: winAmount,
          newBalance: user.wallet,
          description: `Won game ${game.gameId} with number ${player.selectedNumber}`,
        });
      } else {
        result = "lose";
      }

      await user.save();

      game.users[i].result = result;
    }

    game.gameStatus = "completed";

    await game.save();

    console.log(`Game ${game.gameId} results finalized.`);
  } catch (error) {
    console.error("Error finalizing game results:", error);
  }
};
 */
export const finalizeGameResults = async (game) => {
  try {
    if (game.winningNumber === null || game.winningNumber === undefined) {
      const randomWinningNumber = Math.floor(Math.random() * 10);
      game.winningNumber = randomWinningNumber;
      game.adminSet = false;
      await game.save();
    }

    for (let i = 0; i < game.users.length; i++) {
      const player = game.users[i];
      const user = await User.findById(player.userId);
      if (!user) {
        console.log(`User ${player.userId} not found`);
        continue;
      }

      let result;
      let winAmount = 0;

      if (player.selectedNumber === game.winningNumber) {
        result = "win";

        // // Example: payout is bidAmount * 2
        // winAmount = player.bidAmount * 2;

        // Agar aapko number ke hisaab se multiplier chahiye:
        winAmount = player.selectedNumber * player.bidAmount;

        user.wallet += winAmount;

        await Transaction.create({
          userId: user._id,
          transactionType: "deposit",
          amount: winAmount,
          newBalance: user.wallet,
          description: `Won game ${game.gameId} with number ${player.selectedNumber}`,
        });
      } else {
        result = "lose";
      }

      await user.save();

      game.users[i].result = result;
    }

    game.gameStatus = "completed";

    await game.save();

    console.log(`Game ${game.gameId} results finalized.`);
  } catch (error) {
    console.error("Error finalizing game results:", error);
  }
};

const generateGameId = async () => {
  const dateStr = new Date().toISOString().split("T")[0];
  const count =
    (await Game.countDocuments({ gameId: new RegExp(`^GAME-${dateStr}`) })) + 1;
  return `GAME-${dateStr}-${String(count).padStart(3, "0")}`;
};

cron.schedule(
  "* * * * *",
  async () => {
    try {
      const activeGames = await Game.find({ gameStatus: "active" });

      for (const game of activeGames) {
        if (game.users.length === 0) {
          await Game.deleteOne({ _id: game._id });
          console.log(
            `Game ${game.gameId} deleted because no users placed a bid.`
          );
        } else {
          console.log(`Auto completing game ${game.gameId}`);
          await finalizeGameResults(game);
        }
      }

      const gameId = await generateGameId();
      const newGame = new Game({
        gameId,
        gameStatus: "active",
        winningNumber: null,
        adminSet: false,
        timestamp: new Date().toISOString(),
        users: [],
      });

      await newGame.save();
      console.log(`New game created with ID: ${gameId}`);
    } catch (err) {
      console.error("Error running cron job:", err);
    }
  },
  {
    scheduled: true,
    timezone: "UTC",
  }
);

export const getMyLastGameResult = async (req, res) => {
  const userId = req.user.id;

  try {
    const game = await Game.findOne({
      gameStatus: "completed",
      "users.userId": userId,
    }).sort({ timestamp: -1 });

    if (!game) {
      return handleResponse(res, 404, "No completed game found for this user");
    }

    const userBids = game.users.filter((u) => u.userId.toString() === userId);

    if (userBids.length === 0) {
      return handleResponse(
        res,
        404,
        "User did not participate in the last game"
      );
    }

    const winningBids = userBids.filter((bid) => bid.result === "win");

    const totalBidAmount = userBids.reduce(
      (sum, bid) => sum + bid.bidAmount,
      0
    );
    const totalWinAmount = winningBids.reduce(
      (sum, bid) => sum + bid.selectedNumber * bid.bidAmount,
      0
    );

    const userGameResult = winningBids.length > 0 ? "win" : "lose";

    return handleResponse(res, 200, "Game result fetched successfully", {
      gameId: game.gameId,
      winningNumber: game.winningNumber,
      result: userGameResult,
      totalBidAmount,
      totalWinAmount,
      bids: userBids.map((bid) => ({
        selectedNumber: bid.selectedNumber,
        bidAmount: bid.bidAmount,
        result: bid.result,
      })),
      winningBids: winningBids.map((bid) => ({
        selectedNumber: bid.selectedNumber,
        bidAmount: bid.bidAmount,
        result: bid.result,
        winAmount: bid.selectedNumber * bid.bidAmount, // ✅ Added here
      })),
      timestamp: game.timestamp,
    });
  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, "Server error");
  }
};

export const setWinningNumberManually = async (req, res) => {
  const { winningNumber } = req.body;

  if (
    typeof winningNumber !== "number" ||
    winningNumber < 0 ||
    winningNumber > 9
  ) {
    return handleResponse(res, 400, "Winning number must be between 0 and 9.");
  }

  try {
    const activeGame = await Game.findOne({ gameStatus: "active" }).sort({
      timestamp: -1,
    });

    if (!activeGame) {
      return handleResponse(res, 404, "No active game found.");
    }

    const currentTime = Date.now();
    const gameStartTime = new Date(activeGame.timestamp).getTime();
    const gameAgeInSeconds = (currentTime - gameStartTime) / 1000;

    if (gameAgeInSeconds < 50) {
      return handleResponse(
        res,
        403,
        `You can only set the winning number in the last 10 seconds of the game. Current game age: ${Math.floor(
          gameAgeInSeconds
        )}s`
      );
    }

    activeGame.winningNumber = winningNumber;
    activeGame.adminSet = true;
    await activeGame.save();

    return handleResponse(
      res,
      200,
      "Winning number set successfully by admin.",
      {
        gameId: activeGame.gameId,
        winningNumber,
        gameAgeInSeconds: Math.floor(gameAgeInSeconds),
      }
    );
  } catch (error) {
    console.error("Error setting winning number:", error);
    return handleResponse(res, 500, "Server error");
  }
};

export const getLatestWinningNumbers = async (req, res) => {
  try {
    const latestGames = await Game.find({
      gameStatus: "completed",
      winningNumber: { $ne: null },
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .select("gameId winningNumber timestamp");

    return handleResponse(
      res,
      200,
      "Latest winning numbers fetched successfully",
      latestGames
    );
  } catch (error) {
    console.error("Error fetching latest winning numbers:", error);
    return handleResponse(res, 500, "Server error");
  }
};

/* export const getAllGameStatsForAdmin = async (req, res) => {
  try {
    const completedGames = await Game.find({ gameStatus: "completed" }).sort({
      timestamp: -1,
    });

    const gameStats = await Promise.all(
      completedGames.map(async (game) => {
        const uniqueUserObjectIds = [
          ...new Set(game.users.map((user) => user.userId.toString())),
        ];

        // Fetch user details in batch
        const usersData = await User.find({
          _id: { $in: uniqueUserObjectIds },
        }).select("name userId");

        // Map _id to user details
        const userIdToDetails = {};
        usersData.forEach((u) => {
          userIdToDetails[u._id.toString()] = {
            name: u.name,
            userId: u.userId, // UID format
          };
        });

        let totalBidAmount = 0;
        let totalPayout = 0;

        // Combine bids per user
        const userMap = {};

        game.users.forEach((entry) => {
          const userIdStr = entry.userId.toString();
          const userDetails = userIdToDetails[userIdStr] || {
            name: "Unknown",
            userId: "Unknown",
          };

          if (!userMap[userIdStr]) {
            userMap[userIdStr] = {
              userId: userDetails.userId,
              userName: userDetails.name,
              totalBidAmount: 0,
              totalPayout: 0,
              digitBids: Array(10).fill(0), // index 0 to 9
            };
          }

          userMap[userIdStr].totalBidAmount += entry.bidAmount;

          if (entry.result === "win") {
            userMap[userIdStr].totalPayout +=
              entry.selectedNumber * entry.bidAmount;
          }

          if (entry.selectedNumber >= 0 && entry.selectedNumber <= 9) {
            userMap[userIdStr].digitBids[entry.selectedNumber] +=
              entry.bidAmount;
          }
        });

        // Create final user list
        const users = Object.values(userMap).map((u) => {
          const finalResult =
            u.totalPayout === 0
              ? "lose"
              : u.totalPayout >= u.totalBidAmount
              ? "win"
              : "partial-win";

          return {
            userId: u.userId,
            userName: u.userName,
            totalBidAmount: u.totalBidAmount,
            result: finalResult,
            digitBids: Object.fromEntries(
              u.digitBids.map((val, idx) => [idx, val])
            ),
          };
        });

        // Total bid and payout for this game
        totalBidAmount = users.reduce(
          (sum, user) => sum + user.totalBidAmount,
          0
        );
        totalPayout = users.reduce((sum, user) => sum + user.totalPayout, 0);

        return {
          gameId: game.gameId,
          timestamp: game.timestamp,
          totalPlayers: uniqueUserObjectIds.length,
          totalBidAmount,
          totalPayout,
          adminProfit: totalBidAmount - totalPayout,
          users,
        };
      })
    );

    return handleResponse(
      res,
      200,
      "Game stats fetched successfully",
      gameStats
    );
  } catch (error) {
    console.error("Error fetching admin game stats:", error);
    return handleResponse(res, 500, "Server error");
  }
};
 */
/* 
 export const getAllGameStatsForAdmin = async (req, res) => {
  try {
    const completedGames = await Game.find({ gameStatus: "completed" }).sort({
      timestamp: -1,
    });

    const gameStats = await Promise.all(
      completedGames.map(async (game) => {
        const uniqueUserObjectIds = [
          ...new Set(game.users.map((user) => user.userId.toString())),
        ];

        // Fetch user details in batch
        const usersData = await User.find({
          _id: { $in: uniqueUserObjectIds },
        }).select("name userId");

        // Map _id to user details
        const userIdToDetails = {};
        usersData.forEach((u) => {
          userIdToDetails[u._id.toString()] = {
            name: u.name,
            userId: u.userId,
          };
        });

        // Combine all bids per user
        const userMap = {};

        game.users.forEach((entry) => {
          const userIdStr = entry.userId.toString();
          const userDetails = userIdToDetails[userIdStr] || {
            name: "Unknown",
            userId: "Unknown",
          };

          if (!userMap[userIdStr]) {
            userMap[userIdStr] = {
              userId: userDetails.userId,
              userName: userDetails.name,
              totalBidAmount: 0,
              totalPayout: 0,
              digitBids: Array(10)
                .fill(null)
                .map(() => ({ amount: 0, count: 0 })),
            };
          }

          userMap[userIdStr].totalBidAmount += entry.bidAmount;

          if (entry.result === "win") {
            userMap[userIdStr].totalPayout +=
              entry.selectedNumber * entry.bidAmount;
          }

          const digit = entry.selectedNumber;
          if (digit >= 0 && digit <= 9) {
            userMap[userIdStr].digitBids[digit].amount += entry.bidAmount;
            userMap[userIdStr].digitBids[digit].count += 1;
          }
        });

        // Create final user list
        const users = Object.values(userMap).map((u) => {
          const finalResult =
            u.totalPayout === 0
              ? "lose"
              : u.totalPayout >= u.totalBidAmount
              ? "win"
              : "partial-win";

          return {
            userId: u.userId,
            userName: u.userName,
            totalBidAmount: u.totalBidAmount,
            totalPayout: u.totalPayout, // ✅ FIXED LINE
            result: finalResult,
            digitBids: Object.fromEntries(
              u.digitBids.map((val, idx) => [idx, val])
            ),
          };
        });

        // ✅ Now this will work correctly
        const totalBidAmount = users.reduce(
          (sum, user) => sum + user.totalBidAmount,
          0
        );
        const totalPayout = users.reduce(
          (sum, user) => sum + user.totalPayout,
          0
        );

        return {
          gameId: game.gameId,
          timestamp: game.timestamp,
          totalPlayers: uniqueUserObjectIds.length,
          totalBidAmount,
          totalPayout,
          adminProfit: totalBidAmount - totalPayout,
          users,
        };
      })
    );

    return handleResponse(
      res,
      200,
      "Game stats fetched successfully",
      gameStats
    );
  } catch (error) {
    console.error("Error fetching admin game stats:", error);
    return handleResponse(res, 500, "Server error");
  }
}; 
 */

export const getAllGameStatsForAdmin = async (req, res) => {
  try {
    const completedGames = await Game.find({ gameStatus: "completed" }).sort({
      timestamp: -1,
    });

    const gameStats = await Promise.all(
      completedGames.map(async (game) => {
        const uniqueUserObjectIds = [
          ...new Set(game.users.map((user) => user.userId.toString())),
        ];

        // Fetch user details in batch
        const usersData = await User.find({
          _id: { $in: uniqueUserObjectIds },
        }).select("name userId");

        // Map _id to user details
        const userIdToDetails = {};
        usersData.forEach((u) => {
          userIdToDetails[u._id.toString()] = {
            name: u.name,
            userId: u.userId,
          };
        });

        // Combine all bids per user
        const userMap = {};

        game.users.forEach((entry) => {
          const userIdStr = entry.userId.toString();
          const userDetails = userIdToDetails[userIdStr] || {
            name: "Unknown",
            userId: "Unknown",
          };

          if (!userMap[userIdStr]) {
            userMap[userIdStr] = {
              userId: userDetails.userId,
              userName: userDetails.name,
              totalBidAmount: 0,
              totalPayout: 0,
              // digitBids now maps digit -> array of { amount, count }
              digitBids: {},
            };
          }

          const bidCount = entry.count || 1;
          const totalBidForEntry = entry.bidAmount * bidCount;

          // Sum total bid amount per user from all entries
          userMap[userIdStr].totalBidAmount += totalBidForEntry;

          // Sum total payout per user (only if win)
          if (entry.result === "win") {
            userMap[userIdStr].totalPayout +=
              entry.selectedNumber * totalBidForEntry;
          }

          const digit = entry.selectedNumber;
          const bidAmount = entry.bidAmount;

          if (digit >= 0 && digit <= 9) {
            if (!userMap[userIdStr].digitBids[digit]) {
              userMap[userIdStr].digitBids[digit] = [];
            }

            // Find if this bidAmount already exists for this digit
            const existingBid = userMap[userIdStr].digitBids[digit].find(
              (b) => b.amount === bidAmount
            );

            if (existingBid) {
              existingBid.count += bidCount;
            } else {
              userMap[userIdStr].digitBids[digit].push({
                amount: bidAmount,
                count: bidCount,
              });
            }
          }
        });

        // Create final user list using totalBidAmount summed from entries
        const users = Object.values(userMap).map((u) => {
          // Calculate total digit bid amount by summing all amounts * counts
          let sumDigitBidsAmount = 0;
          for (const digit in u.digitBids) {
            u.digitBids[digit].forEach((bid) => {
              sumDigitBidsAmount += bid.amount * bid.count;
            });
          }

          if (sumDigitBidsAmount !== u.totalBidAmount) {
            console.warn(
              `Warning: For user ${u.userName}, sum of digitBids.amount (${sumDigitBidsAmount}) != totalBidAmount (${u.totalBidAmount})`
            );
          }

          const finalResult =
            u.totalPayout === 0
              ? "lose"
              : u.totalPayout >= u.totalBidAmount
              ? "win"
              : "partial-win";

          return {
            userId: u.userId,
            userName: u.userName,
            totalBidAmount: u.totalBidAmount,
            totalPayout: u.totalPayout,
            result: finalResult,
            digitBids: u.digitBids, // digit -> array of {amount, count}
          };
        });

        // Calculate totals for the game based on users' data
        const totalBidAmount = users.reduce(
          (sum, user) => sum + user.totalBidAmount,
          0
        );
        const totalPayout = users.reduce(
          (sum, user) => sum + user.totalPayout,
          0
        );

        return {
          gameId: game.gameId,
          timestamp: game.timestamp,
          totalPlayers: uniqueUserObjectIds.length,
          totalBidAmount,
          totalPayout,
          adminProfit: totalBidAmount - totalPayout,
          users,
        };
      })
    );

    return handleResponse(
      res,
      200,
      "Game stats fetched successfully",
      gameStats
    );
  } catch (error) {
    console.error("Error fetching admin game stats:", error);
    return handleResponse(res, 500, "Server error");
  }
};





export const getGameDetailsById = async (req, res) => {
  const { gameId } = req.params;

  try {
    const game = await Game.findOne({ gameId });

    if (!game) {
      return handleResponse(res, 404, "Game not found with this ID");
    }

    let totalBidAmount = 0;
    let totalPayout = 0;

    const usersDetails = game.users.map((user) => {
      totalBidAmount += user.bidAmount;

      let payout = 0;
      if (user.result === "win") {
        payout = user.selectedNumber * user.bidAmount;
        totalPayout += payout;
      }

      return {
        userId: user.userId,
        selectedNumber: user.selectedNumber,
        bidAmount: user.bidAmount,
        result: user.result,
        payout,
      };
    });

    return handleResponse(res, 200, "Game details fetched successfully", {
      gameId: game.gameId,
      timestamp: game.timestamp,
      gameStatus: game.gameStatus,
      winningNumber: game.winningNumber,
      adminSet: game.adminSet,
      totalPlayers: game.users.length,
      totalBidAmount,
      totalPayout,
      adminProfit: totalBidAmount - totalPayout,
      users: usersDetails,
    });
  } catch (err) {
    console.error("Error fetching game details by ID:", err);
    return handleResponse(res, 500, "Server error");
  }
};
