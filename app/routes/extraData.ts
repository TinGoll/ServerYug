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
router.patch('');
// /api/extra-data/delete
router.delete('/delete', authMiddleware, extraDataController.deleteData);


// /extra-data/comments/order/:id
// /extra-data/comments/add
// /extra-data/comments/edit
// /extra-data/comments/delete/:id
// /extra-data/comments/connect

router.get('/comments/order/:id', extraDataController.getCommentToOrderId);
router.post('/comments/add', extraDataController.addComment);
router.patch('/comments/edit', extraDataController.editComment);
router.delete('/comments/delete/:id', extraDataController.deleteComment);
router.post('/comments/connect', extraDataController.connect);


export default router;