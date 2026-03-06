const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    role: { type: String, required: true }, // 'user' hoặc 'assistant'
    content: { type: String, required: true },
    sessionId: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);