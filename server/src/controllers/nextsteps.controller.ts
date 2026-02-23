import { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { getNextSteps } from "../services/nextsteps.service";

export async function list(req: AuthRequest, res: Response): Promise<void> {
  const steps = await getNextSteps(req.userId!);
  res.json(steps);
}
