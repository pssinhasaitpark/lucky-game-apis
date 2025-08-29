import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
    gameId: { type: String, required: true, unique: true },  // Unique game ID
    gameStatus: { type: String, enum: ['active', 'completed'], default: 'active' },  // Track if game is active or completed
    winningNumber: { type: Number },  // The number generated (admin or automatic)
    adminSet: { type: Boolean, default: false },  // Whether the winning number is manually set by admin
    timestamp: { type: Date, default: Date.now },  // Timestamp for when the game was created
    users: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        selectedNumber: { type: Number, required: true },
        bidAmount: { type: Number, required: true },
        result: { type: String, enum: ['win', 'lose'] },
    }]
});

const Game = mongoose.model('Game', gameSchema);

export default Game;
