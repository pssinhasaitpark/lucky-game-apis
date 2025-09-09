import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
    gameId: { type: String, required: true, unique: true },  
    gameStatus: { type: String, enum: ['active', 'completed'], default: 'active' },  
    winningNumber: { type: Number },
    adminSet: { type: Boolean, default: false }, 
    timestamp: { type: Date, default: Date.now },  
    users: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        selectedNumber: { type: Number, required: true },
        bidAmount: { type: Number, required: true },
        count: { type: Number, default: 1 }, 
        result: { type: String, enum: ['win', 'lose'] },
    }]
});

const Game = mongoose.model('Game', gameSchema);

export default Game;
