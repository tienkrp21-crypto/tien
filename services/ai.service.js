require('dotenv').config();
const { OpenAIEmbeddings, ChatOpenAI } = require("@langchain/openai");
const { HumanMessage, AIMessage, SystemMessage } = require("@langchain/core/messages");
const dbService = require('./db.service'); 
const Chat = require('../models/Chat');

const embeddings = new OpenAIEmbeddings({ 
    openAIApiKey: process.env.OPENAI_API_KEY, 
    modelName: "text-embedding-3-small" 
});

// Tăng nhiệt độ (temperature) lên một chút (0.7) để AI văn vở, bay bổng hơn
const chatModel = new ChatOpenAI({ 
    openAIApiKey: process.env.OPENAI_API_KEY, 
    modelName: "gpt-4o-mini", 
    temperature: 0.7, 
});

const aiService = {
    // 1. Lấy lịch sử (Giữ nguyên logic cũ)
    async getChatHistory(sessionId) {
        if (!sessionId) return [];
        try {
            const chats = await Chat.find({ sessionId: sessionId }) 
                .sort({ createdAt: -1 })
                .limit(10); 
            return chats.reverse().map(chat => 
                chat.role === 'user' ? new HumanMessage(chat.content) : new AIMessage(chat.content)
            );
        } catch (error) {
            console.error("❌ Lỗi lấy lịch sử chat:", error);
            return [];
        }
    },

    // 2. Logic "Khóa ngữ cảnh" (Giữ nguyên để không bị lỗi "ông nói gà bà nói vịt")
    async rephraseQuestion(history, userMsg) {
        if (!history || history.length === 0) return userMsg;

        const lastTwoMessages = history.slice(-2).map(m => 
            `${m._getType() === 'human' ? 'Khách' : 'Bot'}: "${m.content}"`
        ).join("\n");

        const prompt = `
            NHIỆM VỤ: Xác định "CHỦ NGỮ" chính xác mà khách đang nói tới dựa trên bối cảnh.
            
            BỐI CẢNH VỪA XẢY RA:
            ${lastTwoMessages}
            
            CÂU HỎI HIỆN TẠI: "${userMsg}"
            
            QUY TẮC:
            1. Nếu câu hỏi thiếu chủ ngữ (VD: "nó đẹp không", "giá sao"), hãy ghép tên sản phẩm Bot vừa nhắc đến vào.
            2. Nếu câu hỏi có tên hoa mới, hãy dùng tên hoa mới.
            3. Chỉ trả về câu hỏi đã được viết lại đầy đủ chủ ngữ.
        `;
        
        try {
            const res = await chatModel.invoke([new HumanMessage(prompt)]);
            let keyword = res.content.replace(/Output:|Keyword:/gi, '').trim().replace(/[".]/g, '');
            console.log(`🧠 [Smart Query] "${userMsg}" -> Dịch thành: "${keyword}"`); 
            return keyword;
        } catch (error) {
            return userMsg; 
        }
    },

    // 3. Hàm xử lý chính (THAY ĐỔI LỚN Ở PHẦN PROMPT)
    async generateResponse(originalMessage, sessionId) {
        try {
            const history = await this.getChatHistory(sessionId);
            const smartQuery = await this.rephraseQuestion(history, originalMessage);
            const queryVector = await embeddings.embedQuery(smartQuery);
            
            const [productsRaw, knowledges] = await Promise.all([
                dbService.searchProducts(smartQuery, queryVector),
                dbService.getKnowledge(queryVector)
            ]);

            // Lọc trùng lặp
            const uniqueProducts = [];
            const seenNames = new Set();
            if (productsRaw && productsRaw.length > 0) {
                for (const p of productsRaw) {
                    if (!seenNames.has(p.name)) {
                        seenNames.add(p.name);
                        uniqueProducts.push(p);
                    }
                }
            }

            // Tạo ngữ cảnh sản phẩm chi tiết hơn
            let productContextStr = "Hiện không tìm thấy sản phẩm cụ thể nào khớp yêu cầu.";
            if (uniqueProducts.length > 0) {
                productContextStr = uniqueProducts.map((p, index) => 
                `📦 SẢN PHẨM ${index + 1}:
                 - Tên: ${p.name}
                 - Giá: ${p.price?.toLocaleString('vi-VN')} VNĐ
                 - Màu sắc: ${p.colors ? p.colors.join(', ') : 'Đa sắc'} 
                 - Mùi hương đặc trưng: ${p.fragrance_level || 'Không rõ'}
                 - Ý nghĩa/Mô tả: ${p.description}
                 - Loại: ${p.category}
                 - Dịp tặng: ${p.occasions ? p.occasions.join(', ') : 'Mọi dịp'}`
                ).join("\n\n");
            }

            let knowledgeContextStr = knowledges?.map(k => `- Kiến thức: ${k.content}`).join("\n") || "";

            // 🔥 SYSTEM PROMPT: NGHỆ NHÂN CẮM HOA (Artisan Mode)
            const systemPromptContent = `
                # VAI TRÒ CỦA BẠN:
                Bạn là một "Nghệ nhân hoa" (Senior Florist) tại T&T Flower với 10 năm kinh nghiệm.
                Bạn không chỉ bán hoa, bạn bán "Cảm Xúc" và "Sự Tinh Tế".

                # DỮ LIỆU ĐANG CÓ (Chỉ tư vấn trong danh sách này):
                ${productContextStr}
                ${knowledgeContextStr}

                # PHONG CÁCH TƯ VẤN (BẮT BUỘC):
                1. **MỞ ĐẦU CUỐN HÚT:** - Đừng nói "Chào bạn". Hãy dùng: "Chào bạn, T&T Flower rất vui được đón tiếp...", "Một lựa chọn thật tinh tế ạ..."
                   - Nếu khách hỏi về một loài hoa, hãy khen ngợi gu thẩm mỹ của họ trước.

                2. **MÔ TẢ NHƯ MỘT BỨC TRANH:**
                   - Đừng chỉ nói "Hoa hồng màu đỏ". 
                   - Hãy nói: "Những đóa hồng nhung đỏ thắm, kiêu sa như một lời khẳng định tình yêu nồng cháy..."
                   - Nhấn mạnh vào: Mùi hương, Ý nghĩa loài hoa, Cảm giác khi cầm bó hoa trên tay.
                   - Nếu sản phẩm có mùi "Mùi tiền" hoặc "Mạ vàng", hãy mô tả sự đẳng cấp, thượng lưu.

                3. **KHÉO LÉO CHỐT ĐƠN (Upsell/Closing):**
                   - Luôn lồng ghép lời khuyên: "Mẫu này mà tặng dịp sinh nhật/kỷ niệm thì người nhận sẽ rất cảm động..."
                   - Kết thúc bằng một câu hỏi quan tâm: 
                     + "Bạn muốn mình viết kèm một tấm thiệp nhỏ xinh để gửi gắm lời chúc không ạ?"
                     + "Mình có thể giao hoa này cho bạn vào khung giờ nào để bất ngờ nhất?"
                
                4. **XỬ LÝ TÌNH HUỐNG:**
                   - Nếu không có đúng màu khách thích: Hãy xin lỗi thật chân thành và gợi ý một màu khác với lý do thuyết phục (VD: "Tuy màu Vàng tạm hết, nhưng màu Cam pastel này cũng đang là 'hot trend' rất ngọt ngào, bạn ngắm thử xem sao nhé?").

                # TRẢ LỜI CÂU HỎI CỦA KHÁCH: "${originalMessage}"
                (Hãy trả lời một đoạn văn vừa phải, tách dòng dễ đọc, dùng emoji 🌿🌸✨ tinh tế)
            `;

            const response = await chatModel.invoke([
                new SystemMessage(systemPromptContent),
                ...history, 
                new HumanMessage(originalMessage)
            ]);

            return {
                reply: response.content,
                products: uniqueProducts
            };

        } catch (error) {
            console.error("❌ AI Error:", error);
            return { reply: "Hệ thống đang được bảo trì để cắm hoa đẹp hơn, bạn chờ chút xíu nhé! 🌸", products: [] };
        }
    }
};

module.exports = aiService;