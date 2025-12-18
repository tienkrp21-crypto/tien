require('dotenv').config();
const fs = require('fs');
const { MongoClient } = require('mongodb');
const { OpenAIEmbeddings } = require("@langchain/openai");
const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");

// THAY ĐỔI Ở ĐÂY: Dùng thư viện mới cài
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

async function run() {
  console.log("Đang kết nối MongoDB...");
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  
  const db = client.db("chatbot_db"); 
  const collection = db.collection("vectors");

  // 1. Đọc file data.txt
  console.log("Đang đọc file data.txt...");
  // Kiểm tra xem file có tồn tại không trước khi đọc
  if (!fs.existsSync('data.txt')) {
      console.error("LỖI: Không tìm thấy file data.txt. Hãy tạo file này trước!");
      process.exit(1);
  }
  const text = fs.readFileSync('data.txt', 'utf8');

  // 2. Cắt nhỏ văn bản
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const docs = await splitter.createDocuments([text]);

  // 3. Tạo Embedding & Lưu vào MongoDB
  console.log("Đang vector hóa và lưu lên Cloud...");
  
  await MongoDBAtlasVectorSearch.fromDocuments(
    docs,
    new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }),
    {
      collection,
      indexName: "vector_index", 
      textKey: "text", 
      embeddingKey: "embedding",
    }
  );

  console.log("XONG! Dữ liệu đã được nạp. AI giờ đã khôn ra rồi!");
  await client.close();
}

run().catch(console.error);