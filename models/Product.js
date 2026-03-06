const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  // --- THÔNG TIN CƠ BẢN ---
  name: { type: String, required: true, index: true }, 
  slug: { type: String, unique: true }, 
  price: { type: Number, required: true, index: true }, 
  original_price: { type: Number }, 
  description: { type: String }, 
  images: [{ type: String }], 

  // --- METADATA TƯ VẤN ---
  category: { type: String, index: true }, 
  
  // Danh sách Kiểu dáng
  type: { 
    type: String, 
    enum: ['Bó', 'Giỏ', 'Lẵng', 'Kệ', 'Hộp', 'Chậu', 'Bình', 'Cành', 'Vòng', 'Gói', 'Cây'] 
  }, 

  occasions: [{ type: String, index: true }], 
  style_tags: [{ type: String }], 
  colors: [{ type: String }], 

  // --- CÁC TRƯỜNG CHUYÊN SÂU ---
  durability: { type: String, default: "3-5 ngày" }, 
  
  // 🔥 DANH SÁCH MÙI ĐẦY ĐỦ (Đã fix lỗi)
  fragrance_level: { 
    type: String, 
    enum: [
        'Không mùi', 'Nhẹ', 'Vừa', 'Đậm', 
        'Thơm', 'Rất thơm', 'Thơm nhẹ', 'Thơm mát', 'Thơm dịu', 'Thơm nồng', 
        'Thơm ngọt', 'Thơm chanh', 'Thơm lá', 'Thơm cỏ', 'Thơm trà', 'Thơm kẹo', 'Thơm quả', 'Thơm thông', 
        'Hắc', 'Hắc nhẹ', 'Mùi tiền'
    ], 
    default: 'Nhẹ' 
  }, 
  
  blooming_time: { type: String, default: "Đang nở đẹp" }, 

  // --- VECTOR SEARCH ---
  embedding: { type: [Number], index: true }, 

  // --- QUẢN TRỊ ---
  is_active: { type: Boolean, default: true },
  inventory_status: { type: String, enum: ['in_stock', 'out_of_stock'], default: 'in_stock' }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);