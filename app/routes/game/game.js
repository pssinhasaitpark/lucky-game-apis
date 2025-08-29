import express from 'express';
import {
  playGame,
 getMyLastGameResult ,
 setWinningNumberManually
} from '../../controllers/game.js';  
import { verifyToken } from '../../middlewares/jwtAuth.js';

const router = express.Router();

router.post('/play',verifyToken, playGame);

router.post('/admin/set-winning-number', verifyToken, setWinningNumberManually);

router.get('/my-last-result', verifyToken, getMyLastGameResult);

export default router;
