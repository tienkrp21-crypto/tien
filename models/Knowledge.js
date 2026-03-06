const mongoose = require('mongoose');

const KnowledgeSchema = new mongoose.Schema({
  // Phân loại chủ đề để AI hiểu ngữ cảnh
  type: { 
    type: String, 
    // 🔥 CẬP NHẬT ENUM CHO KHỚP VỚI FILE SEED DATA 100 MỤC
    enum: ['policy', 'meaning', 'origin', 'care', 'info', 'general'], 
    required: true,
    default: 'general'
  }, 
  // policy: Chính sách shop (Ship, Đổi trả)
  // meaning: Ý nghĩa loài hoa
  // origin: Nguồn gốc khoa học
  // care: Mẹo chăm sóc
  // info: Thông tin shop (Địa chỉ, SĐT)

  topic: { type: String, required: true }, // VD: "Ý nghĩa hoa hồng đỏ"
  content: { type: String, required: true }, // Nội dung chi tiết

  // --- VECTOR SEARCH ---
  embedding: { type: [Number], index: true },

  is_active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Knowledge', KnowledgeSchema);