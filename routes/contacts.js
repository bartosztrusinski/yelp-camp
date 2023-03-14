const express = require('express');
const router = express.Router();
const contactsController = require('../controllers/contacts');
const catchAsync = require('../utils/catchAsync');

router
  .route('/')
  .get(contactsController.renderContactPage)
  .post(catchAsync(contactsController.sendContactMail));

module.exports = router;
