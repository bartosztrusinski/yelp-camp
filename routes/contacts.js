import { Router } from 'express';
import { renderContactPage, sendContactMail } from '../controllers/contacts.js';
import { mailLimiter } from '../utils/rateLimit.js';

const router = Router();

router
  .route('/')
  .get(renderContactPage)
  .post(mailLimiter('send a contact email'), sendContactMail);

export default router;
