import { Router } from 'express';
import * as optionsController from '../controllers/options.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', optionsController.list);
router.post('/', optionsController.create);
router.get('/:id', optionsController.getOne);
router.put('/:id', optionsController.update);
router.delete('/:id', optionsController.remove);
router.post('/:id/close', optionsController.close);
router.patch('/:id/ignore-next-steps', optionsController.ignoreNextSteps);

export default router;
