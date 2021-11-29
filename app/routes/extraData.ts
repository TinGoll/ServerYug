import { Router } from 'express';
import extraDataController from '../controllers/extra-data-controller';
import { authMiddleware } from '../middlewares/auth-middleware';

const router = Router();
// Пост запросы
//  /api/extra-data/get
/**
 * {    
 *      "barcodeTransfer": "barcode", 
 *      "barcodeAccepted": "barcode"
 * }
 */
// /api/extra-data/get
router.post('/get', extraDataController.getParametersExtraPack);
// /api/extra-data/add
router.post('/add', authMiddleware, extraDataController.addData);
// /api/extra-data/delete
router.delete('/delete', authMiddleware, extraDataController.deleteData);

export default router;