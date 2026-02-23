import { Router } from "express";
import * as pnlController from "../controllers/pnl.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/summary", pnlController.summary);
router.get("/by-account", pnlController.byAccount);
router.get("/by-ticker", pnlController.byTicker);

export default router;
