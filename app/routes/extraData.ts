import { Router } from 'express';
import barcodeController from '../systems/barcode-controller';

const router = Router();
// Пост запросы
//  /api/extra-data/get
/**
 * {    
 *      "barcodeTransfer": "barcode", 
 *      "barcodeAccepted": "barcode"
 * }
 */
router.post(
    '/get',
    barcodeController.getParametersExtraPack
    );

export default router;