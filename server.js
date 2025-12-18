require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const Chat = require('./models/Chat'); 

// --- CÁC THƯ VIỆN RAG MỚI ---
const { MongoClient } = require('mongodb');
const { OpenAIEmbeddings } = require("@langchain/openai");
const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");
const { ChatOpenAI } = require("@langchain/openai");
const { HumanMessage, AIMessage, SystemMessage } = require("@langchain/core/messages");

// Cấu hình CORS
fastify.register(require('@fastify/cors'), { origin: '*' });

// --- 1. KẾT NỐI MONGODB (Mongoose để lưu chat) ---
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Đã kết nối Mongoose thành công!");
    } catch (err) {
        console.error("Lỗi Mongoose:", err.message);
        process.exit(1);
    }
};

// --- 2. CẤU HÌNH VECTOR STORE (Để tìm kiếm) ---
const client = new MongoClient(process.env.MONGO_URI);
const dbName = "chatbot_db";
const collectionName = "vectors";
const vectorStore = new MongoDBAtlasVectorSearch(
    new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }),
    {
        collection: client.db(dbName).collection(collectionName),
        indexName: "vector_index", 
        textKey: "text", 
        embeddingKey: "embedding",
    }
);

// --- 3. CẤU HÌNH AI ---
const model = new ChatOpenAI({ 
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-3.5-turbo", 
    temperature: 0.7 
});

// --- ROUTES ---

fastify.get('/', async (request, reply) => {
    return { status: 'Server RAG Full Option đang chạy!' };
});

fastify.delete('/api/chat', async (request, reply) => {
    await Chat.deleteMany({});
    return { message: "Đã xóa sạch bộ nhớ!" };
});

fastify.post('/api/chat', async (request, reply) => {
    try {
        const { message } = request.body;
        if (!message) return reply.status(400).send({ error: "Thiếu tin nhắn" });

        // A. TÌM KIẾM DỮ LIỆU RIÊNG (RAG STEP)
        console.log("Đang tìm thông tin liên quan...");
        // Tìm 1 đoạn văn bản giống nhất với câu hỏi
        const contextDocs = await vectorStore.similaritySearch(message, 1);
        const context = contextDocs.map(doc => doc.pageContent).join("\n");
        
        console.log("Tìm thấy thông tin:", context || "Không có gì");

        // B. LẤY LỊCH SỬ CHAT
        const oldMessages = await Chat.find().sort({ createdAt: -1 }).limit(10);
        const history = oldMessages.reverse().map(msg => {
            if (msg.role === 'user') return new HumanMessage(msg.content);
            return new AIMessage(msg.content);
        });

        // C. TẠO PROMPT (Kèm dữ liệu tìm được)
        const systemPrompt = `Bạn là trợ lý ảo của T&T Studio. 
                        Dựa vào thông tin này: ... (code cũ) ...
                        YÊU CẦU TRÌNH BÀY:
                        - Trả lời ngắn gọn, súc tích.
                        - Sử dụng gạch đầu dòng (-) hoặc số thứ tự (1., 2.) để liệt kê ý.
                        - Tự động xuống dòng giữa các đoạn để dễ đọc.`;
        const messages = [
            new SystemMessage(systemPrompt),
            ...history, 
            new HumanMessage(message)
        ];

        // D. GỌI AI
        const response = await model.invoke(messages);

        // E. LƯU LẠI
        await Chat.create({ role: 'user', content: message });
        await Chat.create({ role: 'assistant', content: response.content });

        return { reply: response.content };

    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: error.message });
    }
});

// --- KHỞI ĐỘNG (ĐÃ SỬA CHO RENDER) ---
const start = async () => {
    try {
        await connectDB();
        await client.connect(); // Kết nối client Vector Search
        
        // QUAN TRỌNG: Phải có host: '0.0.0.0' thì Render mới nhận
        await fastify.listen({ 
            port: process.env.PORT || 8000, 
            host: '0.0.0.0' 
        });
        
        console.log(`Server RAG đang chạy tại port: ${process.env.PORT || 8000}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

start();