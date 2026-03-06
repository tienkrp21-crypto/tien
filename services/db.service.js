const Product = require('../models/Product');
const Knowledge = require('../models/Knowledge');

const toNonAccentCode = (str) => {
    return str.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
};

// 🔥 [HÀM MỚI] Xử lý ký tự đặc biệt để tránh lỗi Regex crash server
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// 🔥 [DANH SÁCH CÁC LOẠI HOA ĐỂ LỌC NHIỄU]
const FLOWER_TYPES = ['lan', 'cúc', 'hồng', 'tulip', 'ly', 'sen', 'hướng dương', 'cẩm chướng', 'baby', 'đồng tiền'];

async function searchProducts(queryText, queryVector) {
    try {
        // 🔥 [THÊM MỚI] BẮT LỆNH SẮP XẾP ĐẶC BIỆT TỪ AI (Logic này chạy trước tiên)
        if (queryText === "CMD:SORT_DESC") {
            console.log("⚡ [DB] Phát hiện lệnh tìm ĐẮT NHẤT -> Đang sort DB...");
            return await Product.find({})
                .sort({ price: -1 }) // Sắp xếp giá GIẢM DẦN
                .limit(1) // Lấy 1 cái đắt nhất
                .select('name price description images colors category fragrance_level type occasions') 
                .lean();
        }

        if (queryText === "CMD:SORT_ASC") {
            console.log("⚡ [DB] Phát hiện lệnh tìm RẺ NHẤT -> Đang sort DB...");
            return await Product.find({})
                .sort({ price: 1 }) // Sắp xếp giá TĂNG DẦN
                .limit(3) // Lấy 3 cái rẻ nhất
                .select('name price description images colors category fragrance_level type occasions')
                .lean();
        }
        // 🔥 [KẾT THÚC PHẦN THÊM MỚI]

        let finalResults = [];

        // --- BƯỚC 1: TEXT SEARCH (Đã sửa lỗi Regex) ---
        if (queryText) {
            const cleanText = queryText.trim();
            
            // ✅ SỬA LỖI: Escape ký tự đặc biệt (như **, ++, ?) trước khi đưa vào Regex
            const safeRegex = escapeRegex(cleanText);

            const lowerQuery = cleanText.toLowerCase();
            const slugSearch = toNonAccentCode(cleanText);

            let textResults = await Product.find({
                $or: [
                    { name: { $regex: safeRegex, $options: 'i' } },     // Dùng safeRegex thay vì cleanText
                    { slug: { $regex: slugSearch, $options: 'i' } },
                    { category: { $regex: safeRegex, $options: 'i' } }  // Dùng safeRegex thay vì cleanText
                ]
            })
            .select('name price description images durability fragrance_level colors category slug')
            .limit(15)
            .lean();

            // 🔥 [BỘ LỌC CHỐNG NHIỄU - ANTI NOISE]
            const targetFlower = FLOWER_TYPES.find(f => lowerQuery.includes(f));
            
            if (targetFlower && textResults.length > 0) {
                // Chỉ giữ lại sản phẩm có tên hoặc category chứa từ khóa (VD: 'lan')
                textResults = textResults.filter(p => 
                    (p.name && p.name.toLowerCase().includes(targetFlower)) || 
                    (p.category && p.category.toLowerCase().includes(targetFlower))
                );
                console.log(`🎯 [Text Filter] Đã lọc theo '${targetFlower}', còn lại ${textResults.length} sp.`);
            }

            if (textResults.length > 0) {
                return textResults; // Ưu tiên trả về Text Search nếu tìm thấy
            }
        }

        // --- BƯỚC 2: VECTOR SEARCH (Code cũ giữ nguyên) ---
        if (!queryVector || queryVector.length === 0) return [];
        
        let vectorResults = await Product.aggregate([
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": queryVector,
                    "numCandidates": 100,
                    "limit": 15
                }
            },
            { "$project": { "name": 1, "price": 1, "description": 1, "images": 1, "colors": 1, "category": 1, "slug": 1, "fragrance_level": 1 } }
        ]);

        // 🔥 [LỌC LẦN 2 CHO VECTOR]
        if (queryText) {
            const lowerQuery = queryText.toLowerCase();
            const targetFlower = FLOWER_TYPES.find(f => lowerQuery.includes(f));

            if (targetFlower) {
                vectorResults = vectorResults.filter(p => 
                    (p.name && p.name.toLowerCase().includes(targetFlower)) || 
                    (p.category && p.category.toLowerCase().includes(targetFlower))
                );
                console.log(`⚡ [Vector Filter] Đã lọc theo '${targetFlower}', còn lại ${vectorResults.length} sp.`);
            }
        }

        return vectorResults;

    } catch (error) {
        console.error("❌ DB Error Products:", error);
        return [];
    }
}

async function getKnowledge(queryVector) {
    try {
        if (!queryVector || queryVector.length === 0) return [];
        return await Knowledge.aggregate([
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": queryVector,
                    "numCandidates": 50,
                    "limit": 5
                }
            },
            { "$project": { "topic": 1, "content": 1, "type": 1 } }
        ]);
    } catch (error) {
        console.error("❌ DB Error Knowledge:", error);
        return [];
    }
}

module.exports = { searchProducts, getKnowledge };