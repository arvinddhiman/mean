const mongoose = require('mongoose');
const config = require('../config/database');

// Chat Schema

const ChatSchema = mongoose.Schema({
    from: {
        type: Number,
        required: true
    },
    to: {
        type: Number,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    }
});

const Chat = module.exports = mongoose.model('Chat', ChatSchema, 'doctor_chat');

module.exports.contactChat = function(users, callback){
    const query = {
        $and: [
        { $or: [{to: users.user}, {from: users.user}] },
        { $or: [{to: users.contact}, {from: users.contact}] }
    ]};
    Chat.find(query, callback);
}


module.exports.newMessage = function (msg, callback) {
    msg.save(callback);
}