import { Router } from 'express';
import atOrderController from '../controllers/at-order-controller';
import { authMiddleware } from '../middlewares/auth-middleware';

const router = Router();
/**----------------------------- */
const prefix: string = '/at-order';
// Гет запросы
router.get(prefix + '/data', atOrderController.getBarcodes);
router.get(prefix + '/journal-names', atOrderController.getJournalNames);
router.get(prefix + '/salary-transactions/:idJournal', authMiddleware, atOrderController.getSalaryTransactionToIdJournal); // Требует токен
router.get(prefix + '/salary-report/:idtransaction', authMiddleware, atOrderController.getSalaryReportToId); // требует токен
router.get(prefix + '/preliminary-calculation/:idJournal', authMiddleware, atOrderController.getPreliminaryCalculationToIdJournal); // требует токен
//router.get('/test');
//router.get('/test');
//router.get('/test');
//router.get('/test');
//router.get('/test');
//router.get('/test');
//router.get('/test');
//router.get('/test');

// Пост запросы
router.post(prefix + '/add', authMiddleware); // требует токен
//router.post('/test');
//router.post('/test');
//router.post('/test');
//router.post('/test');
//router.post('/test');
//router.post('/test');
//router.post('/test');
//router.post('/test');

// Патчь запросы
router.patch(prefix + '/close-billing-period', authMiddleware) // требует токен

// Делит запросы
//router.delete('/test');
//router.delete('/test');
//router.delete('/test');
//router.delete('/test');
//router.delete('/test');

/**----------------------------- */
export default router;
