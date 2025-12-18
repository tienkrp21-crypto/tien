const mongoose = require('mongoose');

// Định nghĩa khuôn mẫu cho 1 tin nhắn
const chatSchema = new mongoose.Schema({
  role: { type: String, required: true }, // 'user' (bạn) hoặc 'assistant' (AI)
  content: { type: String, required: true }, // Nội dung tin nhắn
  createdAt: { type: Date, default: Date.now } // Thời gian (tự động lấy giờ hiện tại)
});

module.exports = mongoose.model('Chat', chatSchema);