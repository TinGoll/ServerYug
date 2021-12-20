import { Router } from 'express';
import timeController from '../controllers/time-controller';

const router = Router();
/**----------------------------- */
const prefix: string = '/time';

router.get(prefix + '/', timeController.getCurrentTime)

export default router;