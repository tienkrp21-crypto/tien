// 1. Nạp cái key từ file .env vào
require('dotenv').config();

// 2. Gọi thư viện LangChain OpenAI
const { ChatOpenAI } = require("@langchain/openai");

async function testConnection() {
  console.log("⏳ Đang gọi OpenAI...");

  // 3. Khởi tạo mô hình (model)
  // Dùng gpt-3.5-turbo cho rẻ và nhanh (gpt-4o thì thông minh hơn nhưng đắt hơn)
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo", 
    temperature: 0.7, // Độ sáng tạo
  });

  try {
    // 4. Gửi thử 1 câu
    const response = await model.invoke("Chào bạn, hãy giới thiệu ngắn gọn về bản thân.");
    
    // 5. In kết quả
    console.log("✅ KẾT QUẢ:", response.content);
    console.log("🎉 Chúc mừng! Kết nối thành công.");
  } catch (error) {
    console.error("❌ LỖI RỒI:", error.message);
    console.log("👉 Kiểm tra lại: Đã nạp 5$ chưa? Key có đúng không?");
  }
}

testConnection();