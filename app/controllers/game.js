import User from '../models/user/user.js';
import Game from '../models/game/game.js';
import Transaction from '../models/transaction/transaction.js';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import { handleResponse } from '../utils/helper.js';
const betAmounts = [1, 5, 10, 20, 50, 100, 200, 500, 1000, 5000];

export const playGame = async (req, res) => {
    const { selectedNumber, bidAmount } = req.body;
    const userId = req.user.id;
  
    if (!betAmounts.includes(bidAmount)) {
      return handleResponse(res, 400, "Invalid bet amount");
    }
  
    if (selectedNumber < 0 || selectedNumber > 9) {
      return handleResponse(res, 400, "Selected number must be between 0 and 9");
    }
  
    try {
      const activeGame = await Game.findOne({ gameStatus: 'active' }).sort({ timestamp: -1 });
  
      if (!activeGame) {
        return handleResponse(res, 400, "No active game found");
      }
  
      const user = await User.findOne({ _id: userId });
      if (!user) return handleResponse(res, 404, "User not found");
  
      if (typeof user.wallet !== 'number') user.wallet = 0;
  
      if (user.wallet < bidAmount) {
        return handleResponse(res, 400, "Insufficient balance");
      }
  
      user.wallet -= bidAmount;
  
      await Transaction.create({
        userId: user._id,
        transactionType: 'deduction',
        amount: bidAmount,
        newBalance: user.wallet,
        description: `Bid placed on game ${activeGame.gameId}`
      });
  
      await user.save();
  
      activeGame.users.push({
        userId: user._id,
        selectedNumber,
        bidAmount,
        result: null,
      });
  
      await activeGame.save();
  
      return handleResponse(res, 200, "Bid placed successfully. Wait for game results.", {
        balance: user.wallet,
        selectedNumber,
        bidAmount,
        gameId: activeGame.gameId,
      });
  
    } catch (err) {
      console.error(err);
      return handleResponse(res, 500, "Server error");
    }
};
  

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
        result = 'win';
        // winAmount = player.bidAmount * 2;
        winAmount = player.selectedNumber * player.bidAmount;  
        user.wallet += winAmount;

        await Transaction.create({
          userId: user._id,
          transactionType: 'deposit',
          amount: winAmount,
          newBalance: user.wallet,
          description: `Won game ${game.gameId} with number ${player.selectedNumber}`
        });
      } else {
        result = 'lose';
      }

      await user.save();

      game.users[i].result = result;
    }

  
    game.gameStatus = 'completed';

    await game.save();

    console.log(`Game ${game.gameId} results finalized.`);
  } catch (error) {
    console.error('Error finalizing game results:', error);
  }
};


cron.schedule('* * * * *', async () => {
  try {
 
    const activeGames = await Game.find({ gameStatus: 'active' });
    for (const game of activeGames) {
      console.log(`Auto completing game ${game.gameId}`);
      await finalizeGameResults(game);
    }

    const gameId = uuidv4();
    const newGame = new Game({
      gameId,
      gameStatus: 'active',
      winningNumber: null,
      adminSet: false,
      timestamp: Date.now(),
      users: []
    });

    await newGame.save();
    console.log(`New game created with ID: ${gameId}`);

  } catch (err) {
    console.error("Error running cron job:", err);
  }
});


export const getMyLastGameResult = async (req, res) => {
    const userId = req.user.id;
  
    try {
      const game = await Game.findOne({
        gameStatus: 'completed',
        'users.userId': userId
      }).sort({ timestamp: -1 });
  
      if (!game) {
        return handleResponse(res, 404, "No completed game found for this user");
      }
  
      const playerResult = game.users.find(u => u.userId.toString() === userId);
  
      if (!playerResult) {
        return handleResponse(res, 404, "User did not participate in the last game");
      }
  
      return handleResponse(res, 200, "Game result fetched successfully", {
        gameId: game.gameId,
        winningNumber: game.winningNumber,
        selectedNumber: playerResult.selectedNumber,
        result: playerResult.result,
        bidAmount: playerResult.bidAmount,
        timestamp: game.timestamp,
      });
  
    } catch (err) {
      console.error(err);
      return handleResponse(res, 500, "Server error");
    }
};
  

export const setWinningNumberManually = async (req, res) => {
    const { winningNumber } = req.body;
   

    if (typeof winningNumber !== 'number' || winningNumber < 0 || winningNumber > 9) {
      return handleResponse(res, 400, "Winning number must be between 0 and 9.");
    }
  
    try {
      const activeGame = await Game.findOne({ gameStatus: 'active' }).sort({ timestamp: -1 });
  
      if (!activeGame) {
        return handleResponse(res, 404, "No active game found.");
      }
  
      const currentTime = Date.now();
      const gameStartTime = new Date(activeGame.timestamp).getTime();
      const gameAgeInSeconds = (currentTime - gameStartTime) / 1000;
  
     
      if (gameAgeInSeconds < 50) {
        return handleResponse(res, 403, `You can only set the winning number in the last 10 seconds of the game. Current game age: ${Math.floor(gameAgeInSeconds)}s`);
      }
  
      activeGame.winningNumber = winningNumber;
      activeGame.adminSet = true;
      await activeGame.save();
  
      return handleResponse(res, 200, "Winning number set successfully by admin.", {
        gameId: activeGame.gameId,
        winningNumber,
        gameAgeInSeconds: Math.floor(gameAgeInSeconds)
      });
  
    } catch (error) {
      console.error("Error setting winning number:", error);
      return handleResponse(res, 500, "Server error");
    }
};
  