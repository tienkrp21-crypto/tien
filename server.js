require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const cors = require('@fastify/cors');

// Imports
// ❌ Đã xóa aiService và Chat ở đây vì logic đã chuyển sang Controller
const Knowledge = require('./models/Knowledge');

// ✅ Import Controller mới
const chatController = require('./controllers/chatController');

// 🔥 CẤU HÌNH CORS (Cho phép Frontend port 3000 gọi vào)
fastify.register(cors, { 
    origin: '*', // Cho phép tất cả (An toàn cho Dev)
    methods: ['GET', 'POST', 'PUT', 'DELETE']
});

// Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected!");
    } catch (err) {
        console.error("❌ DB Error:", err);
        process.exit(1);
    }
};

// --- API ROUTES ---

// 1. API Chatbot (ĐÃ REFACTOR THEO MVC)
// Bây giờ server.js chỉ gọi hàm từ controller, không viết code logic ở đây nữa
fastify.post('/api/chat', chatController.chat);

// 2. API Admin Knowledge (CRUD - Giữ nguyên như cũ)
fastify.get('/api/admin/knowledge', async () => await Knowledge.find().sort({ createdAt: -1 }));
fastify.post('/api/admin/knowledge', async (req) => await Knowledge.create(req.body));
fastify.put('/api/admin/knowledge/:id', async (req) => await Knowledge.findByIdAndUpdate(req.params.id, req.body, { new: true }));
fastify.delete('/api/admin/knowledge/:id', async (req) => await Knowledge.findByIdAndDelete(req.params.id));

// --- START ---
const start = async () => {
    await connectDB();
    try {
        await fastify.listen({ port: 8000, host: '0.0.0.0' });
        console.log("🚀 Server running at http://localhost:8000");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();