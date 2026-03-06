require('dotenv').config();
const mongoose = require('mongoose');
const Knowledge = require('./models/Knowledge'); // Đảm bảo đúng đường dẫn Model
const { OpenAIEmbeddings } = require("@langchain/openai");

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small"
});

// DỮ LIỆU KIẾN THỨC: 100 MỤC (Phân loại: Ý nghĩa, Nguồn gốc, Chăm sóc, Chính sách)
const knowledgeData = [
    // --- 1. Ý NGHĨA CÁC LOÀI HOA (Nguồn: Vy's Farm) ---
    { 
        topic: "Địa chỉ cửa hàng", 
        content: "Shop nằm tại Hẻm 769/44/45 Phạm Thế Hiển, Phường 4, Quận 8, TP.HCM.", 
        type: "info" 
    },
    { 
        topic: "Hotline và Zalo", 
        content: "Số điện thoại và Zalo chính thức: 0384737634. Hỗ trợ tư vấn 24/7.", 
        type: "info" 
    },
    { 
        topic: "Giới thiệu shop", 
        content: "T&T Flower (hoặc tên shop bạn muốn) chuyên cung cấp hoa tươi, hoa sáp, hoa lan hồ điệp tại Quận 8. Nhận ship hỏa tốc nội thành.", 
        type: "info" 
    },
    { topic: "Ý nghĩa Hoa Hồng Đỏ", content: "Biểu tượng của tình yêu nồng cháy, mãnh liệt và lãng mạn. Thường dùng để tỏ tình hoặc cầu hôn.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Hồng Trắng", content: "Tượng trưng cho sự ngây thơ, duyên dáng và sự cảm thông. Đại diện cho tình yêu thuần khiết.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Hồng Vàng", content: "Đại diện cho tình bạn chân thành, sự tin tưởng và niềm vui. Đôi khi cũng mang ý nghĩa xin lỗi.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Hồng Tím", content: "Biểu tượng của sự si mê, yêu từ cái nhìn đầu tiên và lòng thủy chung son sắc.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Hồng Cam", content: "Thể hiện sự nhiệt tình, năng lượng và đam mê cháy bỏng.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Hồng Đen", content: "Màu của sự bí ẩn, hoặc sự kết thúc của một mối quan hệ (chia tay).", type: "meaning" },
    { topic: "Ý nghĩa Hoa Hồng Xanh", content: "Tượng trưng cho những điều không thể thành hiện thực, hoặc một tình yêu vĩnh cửu bất diệt.", type: "meaning" },
    { topic: "Ý nghĩa Lan Hồ Điệp", content: "Biểu tượng của sự sang trọng, sung túc và may mắn. Rất hợp tặng khai trương hoặc Tết.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Cẩm Chướng", content: "Sự ái mộ, sắc đẹp và tình yêu của phụ nữ. Cẩm chướng đỏ là lòng biết ơn mẹ.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Ly (Bách Hợp)", content: "Sự thanh cao, quý phái và sắc đẹp đức hạnh. Ly trắng là sự trinh trắng.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Cẩm Tú Cầu", content: "Lời cảm ơn hoặc xin lỗi chân thành. Tượng trưng cho những cảm xúc chân thành nhất.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Hướng Dương", content: "Luôn hướng về phía mặt trời, biểu tượng của lòng trung thành, sự kiên định và hy vọng.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Thiên Điểu", content: "Sự chế ngự, tự do và lộng lẫy. Tượng trưng cho người đàn ông mạnh mẽ.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Bỉ Ngạn", content: "Hồi ức đau thương, vẻ đẹp của cái chết và sự chia ly (Mạn Châu Sa Hoa).", type: "meaning" },
    { topic: "Ý nghĩa Hoa Mẫu Đơn", content: "Vua của các loài hoa. Biểu tượng của sự giàu có, phồn vinh và sắc đẹp vương giả.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Tử Đằng", content: "Tình yêu vĩnh cửu và sự chờ đợi kiên trì. Ở Nhật Bản, nó tượng trưng cho tình yêu bất diệt.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Linh Lan", content: "Sự trở về của hạnh phúc (Return of Happiness). Loài hoa mang lại may mắn.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Tigon", content: "Biểu tượng của 'Tim vỡ', sự chia ly đẹp đẽ và nỗi buồn man mác.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Sen", content: "Quốc hoa Việt Nam. Sự thanh cao, nghị lực vươn lên từ bùn nhơ.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Huệ", content: "Sự tôn kính, uy nghiêm. Thường dùng trong các nghi lễ thờ cúng trang trọng.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Lay Ơn", content: "Sự hẹn hò, sức mạnh của tính cách và lòng trung thành.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Nhài", content: "Sự đáng yêu, ngọt ngào và tình bạn. Ở một số nước là biểu tượng của người mẹ.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Tường Vi", content: "Lời hứa tình yêu. Tường vi hồng là 'Anh sẽ mãi yêu em'.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Đồng Tiền", content: "Mang lại tiền tài, may mắn và sự thịnh vượng cho gia chủ.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Mười Giờ", content: "Tình yêu trong sáng, ngây thơ của tuổi học trò.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Dâm Bụt", content: "Vẻ đẹp rực rỡ nhưng ngắn ngủi. Ở phương Tây là biểu tượng của danh vọng.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Mai Vàng", content: "Sự phú quý, giàu sang và hy vọng vào năm mới (đặc trưng miền Nam).", type: "meaning" },
    { topic: "Ý nghĩa Hoa Đào", content: "Sự sinh sôi nảy nở, xua đuổi tà ma (đặc trưng miền Bắc).", type: "meaning" },
    { topic: "Ý nghĩa Hoa Thược Dược", content: "Sự chung thủy và sự biết ơn. 'Nghĩ về em'.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Cát Tường", content: "Sự may mắn, 'như ý cát tường', cuộc sống viên mãn.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Diên Vỹ (Iris)", content: "Thông điệp của hy vọng, niềm tin và sự khôn ngoan.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Tulip", content: "Tình yêu hoàn hảo. Tulip đỏ là lời tỏ tình, Tulip vàng là nụ cười rạng rỡ.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Baby", content: "Tình yêu tinh khiết, ngây thơ. Sự kết nối tâm hồn.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Oải Hương", content: "Sự thảo hiền, chờ đợi tình yêu và sự thư giãn chữa lành.", type: "meaning" },
    { topic: "Ý nghĩa Hoa Hải Đường", content: "Sự phú quý, anh em hòa thuận, tình bạn thân thiết.", type: "meaning" },

    // --- 2. NGUỒN GỐC & KHOA HỌC (Nguồn: Vy's Farm) ---
    { topic: "Nguồn gốc Hoa Cẩm Tú Cầu", content: "Tên khoa học Hydrangea, nguồn gốc Đông Nam Á, Nhật Bản. Cây ưa bóng râm.", type: "origin" },
    { topic: "Nguồn gốc Hoa Linh Lan", content: "Tên khoa học Convallaria majalis, nguồn gốc ôn đới Bắc Mỹ và Á Âu.", type: "origin" },
    { topic: "Nguồn gốc Hoa Anh Đào", content: "Tên Prunus cerasoides, thuộc họ Hoa Hồng. Biểu tượng văn hóa Nhật Bản.", type: "origin" },
    { topic: "Nguồn gốc Hoa Tigon", content: "Cây dây leo thân gỗ, nguồn gốc Mexico. Tên khoa học Antigonon leptopus.", type: "origin" },
    { topic: "Nguồn gốc Hoa Hồng", content: "Chi Rosa, nguồn gốc từ Trung Á và Bắc Mỹ. Có hơn 100 loài khác nhau.", type: "origin" },
    { topic: "Nguồn gốc Hoa Tulip", content: "Tên Tulipa, thuộc họ Loa Kèn. Nguồn gốc từ Trung Đông, nổi tiếng ở Hà Lan.", type: "origin" },
    { topic: "Nguồn gốc Hoa Thiên Điểu", content: "Tên Strelitzia reginae, nguồn gốc Nam Phi. Hình dáng giống loài chim.", type: "origin" },
    { topic: "Nguồn gốc Hoa Bỉ Ngạn", content: "Tên Lycoris radiata, nguồn gốc Trung Quốc. Củ có độc.", type: "origin" },
    { topic: "Nguồn gốc Hoa Mẫu Đơn", content: "Tên Paeoniaceae, nguồn gốc Trung Quốc và Tây Bắc Mỹ. Cây thân gỗ hoặc thảo.", type: "origin" },
    { topic: "Nguồn gốc Hoa Tử Đằng", content: "Chi Wisteria, họ Đậu. Nguồn gốc Trung Quốc, Nhật Bản. Dây leo thân gỗ.", type: "origin" },
    { topic: "Nguồn gốc Lan Hồ Điệp", content: "Chi Phalaenopsis, nguồn gốc Đông Nam Á và Australia. Cây phụ sinh.", type: "origin" },
    { topic: "Nguồn gốc Lan Phi Điệp", content: "Chi Dendrobium, phân bố rộng ở Đông Nam Á. Thân thòng, rụng lá khi ra hoa.", type: "origin" },
    { topic: "Nguồn gốc Hoa Sen", content: "Tên Nelumbo nucifera, nguồn gốc Châu Á. Là loài thực vật thủy sinh.", type: "origin" },
    { topic: "Nguồn gốc Hoa Hướng Dương", content: "Tên Helianthus annuus, nguồn gốc Bắc Mỹ. Thuộc họ Cúc.", type: "origin" },
    { topic: "Nguồn gốc Hoa Cúc", content: "Họ Asteraceae, là họ thực vật lớn nhất thế giới. Phân bố toàn cầu.", type: "origin" },
    { topic: "Nguồn gốc Hoa Huệ", content: "Tên Polianthes tuberosa, họ Thùa (Agave). Nguồn gốc Mexico.", type: "origin" },
    { topic: "Nguồn gốc Hoa Lay Ơn", content: "Tên Gladiolus, nguồn gốc Châu Phi và Địa Trung Hải. Thân giả.", type: "origin" },
    { topic: "Nguồn gốc Hoa Ly", content: "Chi Lilium, phân bố ở vùng ôn đới Bắc Bán Cầu. Cây thân vảy.", type: "origin" },
    { topic: "Nguồn gốc Hoa Nhài", content: "Chi Jasminum, nguồn gốc Ấn Độ. Cây bụi, hoa thơm.", type: "origin" },
    { topic: "Nguồn gốc Hoa Tường Vi", content: "Tên Rosa multiflora, nguồn gốc Đông Á. Cây bụi leo.", type: "origin" },
    { topic: "Nguồn gốc Hoa Thược Dược", content: "Tên Dahlia, quốc hoa của Mexico. Cây thân củ.", type: "origin" },
    { topic: "Nguồn gốc Hoa Mai", content: "Tên Ochna integerrima, phân bố chủ yếu ở Việt Nam và Trung Quốc.", type: "origin" },

    // --- 3. MẸO CHĂM SÓC HOA (Tư vấn chuyên gia) ---
    { topic: "Cách giữ hoa hồng tươi lâu", content: "Cắt gốc xéo 45 độ dưới vòi nước, thay nước hàng ngày, thêm đường hoặc Aspirin vào nước.", type: "care" },
    { topic: "Chăm sóc Lan Hồ Điệp", content: "Tưới nước 1 tuần/lần vào gốc, không tưới lên lá và hoa. Tránh nắng gắt trực tiếp.", type: "care" },
    { topic: "Chăm sóc Hoa Sen", content: "Cắm trong bình cao, nhiều nước. Thả vài viên đá lạnh vào bình để hoa tươi lâu.", type: "care" },
    { topic: "Chăm sóc Hoa Tulip", content: "Dùng nước lạnh, ít nước (khoảng 5cm). Thêm đá lạnh và để nơi mát mẻ.", type: "care" },
    { topic: "Chăm sóc Hoa Cẩm Tú Cầu", content: "Ngâm cả bông hoa vào nước lạnh nếu hoa bị héo. Cắt gốc và phun sương thường xuyên.", type: "care" },
    { topic: "Chăm sóc Hoa Hướng Dương", content: "Thân xốp nên hút nước mạnh, cần nước đầy bình và thay nước mỗi ngày.", type: "care" },
    { topic: "Chăm sóc Hoa Baby khô", content: "Tuyệt đối tránh nước và độ ẩm. Dùng máy sấy tóc chế độ mát để làm sạch bụi.", type: "care" },
    { topic: "Cách xử lý hoa bị héo", content: "Cắt lại gốc, ngâm vào nước ấm (40 độ) khoảng 15 phút rồi chuyển sang nước lạnh.", type: "care" },
    { topic: "Chăm sóc Sen Đá", content: "Tưới ít nước, chỉ tưới khi đất khô hẳn. Cần nhiều ánh sáng mặt trời.", type: "care" },
    { topic: "Chăm sóc Hoa Ly", content: "Tuốt bỏ nhụy phấn để hoa bền hơn và không bị lem phấn vàng ra cánh.", type: "care" },
    { topic: "Vị trí đặt hoa tốt nhất", content: "Tránh gió quạt, tránh điều hòa phả trực tiếp, tránh ánh nắng gắt buổi trưa.", type: "care" },
    { topic: "Chăm sóc Cúc Tana", content: "Thay nước mỗi ngày, cắt tỉa lá gốc để tránh thối nước.", type: "care" },
    { topic: "Chăm sóc Lan Phi Điệp", content: "Tưới phun sương vào sáng sớm và chiều mát. Bón phân tan chậm.", type: "care" },
    { topic: "Chăm sóc Hoa Sáp", content: "Tránh nước, tránh ánh nắng mạnh làm bay màu. Để nơi khô ráo.", type: "care" },
    { topic: "Làm sao để nụ hoa nở nhanh", content: "Cắm hoa bằng nước ấm, thêm B1 hoặc chất dưỡng hoa, để nơi ấm áp.", type: "care" },

    // --- 4. CHÍNH SÁCH CỬA HÀNG (Potico Style - Trả lời khách hàng) ---
    { topic: "Phí vận chuyển", content: "Miễn phí ship nội thành cho đơn từ 500k. Phí ship thường từ 30k-50k tùy quận.", type: "policy" },
    { topic: "Thời gian giao hàng", content: "Giao hỏa tốc trong 2 giờ tại nội thành. Giao hẹn giờ theo yêu cầu.", type: "policy" },
    { topic: "Chính sách đổi trả", content: "Đổi trả hoặc hoàn tiền 100% trong vòng 3 giờ nếu hoa héo, gãy, không đúng mẫu.", type: "policy" },
    { topic: "Cam kết chất lượng", content: "Cam kết hoa tươi nhập mới mỗi ngày. Giống mẫu 90-95% (do hoa tươi mỗi đợt khác nhau).", type: "policy" },
    { topic: "Phương thức thanh toán", content: "Chuyển khoản ngân hàng, Ví Momo/ZaloPay, Visa/Mastercard, Tiền mặt khi nhận hàng (COD).", type: "policy" },
    { topic: "Dịch vụ tặng kèm", content: "Tặng miễn phí thiệp chúc mừng, banner trị giá 20k. Tặng thuốc dưỡng hoa.", type: "policy" },
    { topic: "Xuất hóa đơn VAT", content: "Có hỗ trợ xuất hóa đơn đỏ (VAT) cho doanh nghiệp (giá chưa bao gồm 8% VAT).", type: "policy" },
    { topic: "Đặt hoa ẩn danh", content: "Shop hỗ trợ giao hoa giấu tên, bảo mật thông tin người gửi tuyệt đối.", type: "policy" },
    { topic: "Gửi ảnh xác nhận", content: "Shop sẽ gửi ảnh hoa thực tế trước khi giao và ảnh tại nơi giao hàng để bạn yên tâm.", type: "policy" },
    { topic: "Giờ làm việc", content: "Shop mở cửa từ 7:00 sáng đến 21:00 tối tất cả các ngày trong tuần (kể cả Lễ/Tết).", type: "policy" },
    { topic: "Đặt hoa tỉnh", content: "Hiện tại shop chỉ giao hoa tươi tại HCM và Hà Nội. Hoa sáp/khô giao toàn quốc.", type: "policy" },
    { topic: "Bảo hành Lan Hồ Điệp", content: "Bảo hành rụng nụ trong 3 ngày đầu. Hỗ trợ tư vấn chăm sóc trọn đời.", type: "policy" },
    { topic: "Dịch vụ thiết kế riêng", content: "Nhận thiết kế hoa theo ngân sách và yêu cầu riêng của khách hàng.", type: "policy" },
    { topic: "Ưu đãi thành viên", content: "Giảm 5% cho khách hàng thân thiết đặt từ đơn thứ 2 trở đi.", type: "policy" },
    { topic: "Thời gian đặt trước", content: "Nên đặt trước 3-4 tiếng để hoa được chuẩn bị chu đáo nhất. Lễ tết nên đặt trước 1-2 ngày.", type: "policy" },
    { topic: "Xử lý khiếu nại", content: "Hotline xử lý khiếu nại hoạt động 24/7. Giải quyết thỏa đáng trong vòng 24h.", type: "policy" },
    { topic: "Thông điệp thiệp", content: "Hỗ trợ viết lời chúc hay, ý nghĩa nếu bạn chưa nghĩ ra nội dung.", type: "policy" },
    { topic: "Trang trí tiệc", content: "Nhận trang trí hoa tươi cho tiệc cưới, sinh nhật, sự kiện công ty.", type: "policy" },
    { topic: "Cung cấp sỉ", content: "Có chính sách giá sỉ cho đại lý hoặc đơn hàng số lượng lớn.", type: "policy" }
];

const seed = async () => {
    try {
        console.log("🔌 Đang kết nối MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        
        // Xóa dữ liệu cũ để tránh trùng lặp
        await Knowledge.deleteMany({});
        console.log("🗑️  Đã xóa dữ liệu Kiến thức cũ.");
        
        const itemsToInsert = [];
        console.log(`⏳ Đang tạo vector embedding cho ${knowledgeData.length} mục kiến thức...`);

        for (const k of knowledgeData) {
            // Tạo chuỗi ngữ nghĩa để AI học
            const textToEmbed = `Chủ đề: ${k.topic}. Nội dung: ${k.content}. Phân loại: ${k.type}`;
            
            const vector = await embeddings.embedQuery(textToEmbed);
            
            itemsToInsert.push({
                ...k,
                embedding: vector
            });
        }

        await Knowledge.insertMany(itemsToInsert);
        console.log(`🎉 Đã nạp thành công ${itemsToInsert.length} mục kiến thức chuyên gia!`);
        process.exit();
    } catch (e) {
        console.error("❌ Lỗi Seed Knowledge:", e);
        process.exit(1);
    }
};

seed();