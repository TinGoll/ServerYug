import { Router } from 'express';
import authController from '../controllers/auth-controller';
import validateRequestSchema from '../middlewares/validate-request-schema';
import { loginSchema, registerSchema } from '../validators/auth-schema';

const router = Router();
/**----------------------------- */
const prefix: string = '/auth';
// Гет запросы
// router.get('/test');
// router.get('/test');
// router.get('/test');
// router.get('/test');
// router.get('/test');
// router.get('/test');
// router.get('/test');
// router.get('/test');
// router.get('/test');
// router.get('/test');
// Пост запросы
router.post(prefix + '/register', registerSchema, validateRequestSchema, authController.register); // Регистрация пользователя
router.post(prefix + '/login', authController.login); // Вход в систему
router.post(prefix + '/login', authController.logout); //Выход из системы (не реализовано)
// router.post('/refresh'); // Обновление токена (не реализовано)
// router.post('/test');
// router.post('/test');
// router.post('/test');


// Делит запросы
// router.delete('/test');
// router.delete('/test');
// router.delete('/test');
// router.delete('/test');
// router.delete('/test');

/**----------------------------- */
export default router;
