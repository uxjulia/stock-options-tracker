import { Router } from 'express';
import * as nextStepsController from '../controllers/nextsteps.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/', nextStepsController.list);

export default router;
