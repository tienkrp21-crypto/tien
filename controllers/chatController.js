const aiService = require('../services/ai.service');
const Chat = require('../models/Chat');

exports.chat = async (req, reply) => {
    try {
        // 🔥 Lấy message và sessionId từ Frontend
        const { message, sessionId } = req.body; 

        if (!message) {
            return reply.status(400).send({ error: "Vui lòng nhập tin nhắn" });
        }

        // --- 1. LOGIC SESSION ID (Chuyển từ server.js sang) ---
        // Nếu Frontend quên gửi ID, tạm thời tạo ID ngẫu nhiên để không lỗi
        const userSessionId = sessionId || `guest_${Date.now()}`;

        // --- 2. LƯU TIN NHẮN USER (Chuyển từ server.js sang) ---
        await Chat.create({ 
            role: 'user', 
            content: message, 
            sessionId: userSessionId 
        });

        // --- 3. GỌI AI XỬ LÝ (Chuyển từ server.js sang) ---
        const { reply: botReply, products } = await aiService.generateResponse(message, userSessionId);

        // --- 4. LƯU CÂU TRẢ LỜI BOT (Chuyển từ server.js sang) ---
        await Chat.create({ 
            role: 'assistant', 
            content: botReply, 
            sessionId: userSessionId 
        });

        // --- 5. TẠO GỢI Ý (Logic cũ của bạn giữ nguyên, chuyển vào đây) ---
        let suggestions = [];
        if (products && products.length > 0) {
            // Lấy tên 3 sản phẩm đầu tiên làm gợi ý
            const rawOptions = products.map(p => `Xem ${p.name}`);
            suggestions = [...new Set(rawOptions)].slice(0, 3); 
        } else {
            // Nếu không có sản phẩm, gợi ý mặc định
            suggestions = ["Địa chỉ shop", "Giờ mở cửa", "Liên hệ tư vấn"];
        }

        // --- 6. TRẢ VỀ KẾT QUẢ (Format đúng của Fastify) ---
        return {
            reply: botReply,
            options: suggestions,
            products: products
        };

    } catch (error) {
        console.error("❌ Chat Controller Error:", error);
        return reply.status(500).send({ error: "Lỗi hệ thống", details: error.message });
    }
};