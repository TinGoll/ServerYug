import { Router } from 'express';
import serviceController from '../controllers/service-controller';


const router = Router();
/**----------------------------- */
const prefix: string = '/service';
// /api/service/restart
router.get(prefix + '/restart', serviceController.restartSystems)

export default router;