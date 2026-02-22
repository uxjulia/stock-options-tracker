import { Router } from 'express';
import * as accountsController from '../controllers/accounts.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', accountsController.list);
router.post('/', accountsController.create);
router.put('/:id', accountsController.update);
router.delete('/:id', accountsController.remove);

export default router;
