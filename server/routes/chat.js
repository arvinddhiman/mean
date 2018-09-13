const express = require('express');
const Chat = require('../models/chat');
const config = require('../config/database');
const router = express.Router();

router.post('/', function (req, res, next) {
    let msg = new Chat({
        from: req.body.from,
        to: req.body.to,
        email: req.body.email,
        message: req.body.message,
        time: req.body.time
    });

    Chat.newMessage(msg, function (err, user) {
        if(err){
            res.json({success: false, msg:'Failed to send msg.', err: err});
        } else {
            res.json({success: true, msg:'Send msg.'});
        }
    });
});

router.post('/contact_chat', function (req, res, next) {

    Chat.contactChat(req.body, function (err, ar) {
        res.json(ar);
    })
});

module.exports = router;
