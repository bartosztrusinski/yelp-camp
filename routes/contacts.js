import { Router } from 'express';
import { renderContactPage, sendContactMail } from '../controllers/contacts.js';

const router = Router();

router.route('/').get(renderContactPage).post(sendContactMail);

export default router;
