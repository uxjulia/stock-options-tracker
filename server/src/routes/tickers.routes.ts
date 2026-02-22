import { Router } from 'express';
import * as tickersController from '../controllers/tickers.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/prices', tickersController.getPrices);
router.get('/active', tickersController.getActiveTickerPrices);
router.post('/:symbol/override', tickersController.setOverride);
router.delete('/:symbol/override', tickersController.clearOverride);

export default router;
