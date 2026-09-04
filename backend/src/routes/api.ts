import { Router } from 'express';
import multer from 'multer';
import { AuthController } from '../controllers/auth.controller';
import { EmailController } from '../controllers/email.controller';
import { SearchController } from '../controllers/search.controller';
import { SlackController } from '../controllers/slack.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
export const apiRouter = Router();

apiRouter.post('/auth/google', AuthController.googleLogin);
apiRouter.get('/auth/me', authMiddleware as any, AuthController.getMe as any);

apiRouter.post('/emails/schedule', authMiddleware as any, EmailController.schedule as any);
apiRouter.post('/emails/upload-csv', authMiddleware as any, upload.single('file'), EmailController.uploadCsv as any);
apiRouter.get('/emails/scheduled', authMiddleware as any, EmailController.getScheduled as any);
apiRouter.get('/emails/sent', authMiddleware as any, EmailController.getSent as any);
apiRouter.delete('/emails/:id', authMiddleware as any, EmailController.cancel as any);
apiRouter.get('/emails/senders', authMiddleware as any, EmailController.getSenders as any);
apiRouter.get('/emails/stats', authMiddleware as any, EmailController.getStats as any);

apiRouter.get('/search', SearchController.search);

apiRouter.post('/slack/connect', authMiddleware as any, SlackController.connect as any);
apiRouter.post('/slack/test', authMiddleware as any, SlackController.testNotification as any);
apiRouter.get('/slack/status', authMiddleware as any, SlackController.getStatus as any);
