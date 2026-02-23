import { Router } from "express";
import authRoutes from "./auth.routes";
import accountsRoutes from "./accounts.routes";
import optionsRoutes from "./options.routes";
import tickersRoutes from "./tickers.routes";
import pnlRoutes from "./pnl.routes";
import nextStepsRoutes from "./nextsteps.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/accounts", accountsRoutes);
router.use("/options", optionsRoutes);
router.use("/tickers", tickersRoutes);
router.use("/pnl", pnlRoutes);
router.use("/next-steps", nextStepsRoutes);

export default router;
