const {Router}                  = require('express');
const barcodeController         = require('../systems/barcode-controller');

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


module.exports = router;