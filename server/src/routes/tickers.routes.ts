import { Router } from "express";
import * as tickersController from "../controllers/tickers.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/prices", tickersController.getPrices);
router.get("/active", tickersController.getActiveTickerPrices);
router.post("/:symbol/override", tickersController.setOverride);
router.delete("/:symbol/override", tickersController.clearOverride);
router.patch("/:symbol/acknowledged-delta", tickersController.setAcknowledgedDelta);
router.delete("/:symbol/acknowledged-delta", tickersController.clearAcknowledgedDelta);
router.post("/:symbol/reset-delta", tickersController.resetDeltaBasis);

export default router;
