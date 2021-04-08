const express = require('express')
    , router = express.Router()
    , contacts = require('../controllers/contacts')
    , catchAsync = require('../utils/catchAsync');


router.route('/')
    .get(contacts.renderContactPage)
    .post(catchAsync(contacts.sendContactMail))

module.exports = router;