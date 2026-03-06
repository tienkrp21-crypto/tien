require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product'); 
const { OpenAIEmbeddings } = require("@langchain/openai");

// --- 1. CẤU HÌNH & HÀM BỔ TRỢ ---
const slugify = (text) => text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');

const removeAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small"
});

// --- 2. TỪ ĐIỂN ẢNH (Mapping Tên Hoa -> Từ khóa tìm ảnh) ---
const FLOWER_MAP = {
    "Hoa Hồng": "rose flower bouquet",
    "Tulip": "tulip flower",
    "Cẩm Chướng": "carnation flower",
    "Mẫu Đơn": "peony flower",
    "Hướng Dương": "sunflower bouquet",
    "Lan Hồ Điệp": "phalaenopsis orchid",
    "Phong Lan": "orchid flower",
    "Hoa Lan": "orchid flower",
    "Loa Kèn": "lily flower",
    "Hoa Ly": "lily flower",
    "Thủy Tiên": "alstroemeria flower",
    "Hoa Stock": "stock flower",
    "Cúc Dại": "daisy flower",
    "Hoa Cúc": "chrysanthemum flower",
    "Dạ Lan Hương": "hyacinth flower",
    "Diên Vĩ": "iris flower",
    "Phong Lữ": "geranium flower",
    "Mộc Lan": "magnolia flower",
    "Oải Hương": "lavender flower",
    "Anh Túc": "poppy flower",
    "Chuông Xanh": "bluebell flower",
    "Vạn Thọ": "marigold flower",
    "Huệ Tây": "amaryllis flower",
    "Trà Mi": "camellia flower",
    "Hải Đường": "begonia flower",
    "Thược Dược": "dahlia flower",
    "Cúc Ngũ Sắc": "zinnia flower",
    "Mõm Sói": "snapdragon flower",
    "Dã Yến Thảo": "petunia flower",
    "Păng Xê": "pansy flower",
    "Hoa Nhài": "jasmine flower",
    "Lê Đông": "hellebore flower",
    "Dành Dành": "gardenia flower",
    "Vân Anh": "fuchsia flower",
    "Ông Lão": "clematis flower",
    "Đỗ Quyên": "azalea flower",
    "Hải Quỳ": "anemone flower",
    "Nghệ Tây": "saffron flower",
    "Mao Lương": "ranunculus flower",
    "Lay Ơn": "gladiolus flower",
    "Mao Địa Hoàng": "foxglove flower",
    "Thạch Thảo": "purple aster flower",
    "Lưu Ly": "forget me not flower",
    "Linh Lan": "lily of the valley",
    "Dâm Bụt": "hibiscus flower",
    "Tiên Khách Lai": "cyclamen flower",
    "Lan Nam Phi": "freesia flower",
    "Đậu Ngọt": "sweet pea flower",
    "Cỏ Roi Ngựa": "verbena flower",
    "Anh Thảo": "primrose flower",
    "Thạch Nam": "heather flower",
    "Hoa Sen": "lotus flower",
    "Violet": "african violet",
    "Ngọc Thảo": "impatiens flower",
    "Kim Tiền": "calendula flower",
    "Cúc Mắt Đen": "black eyed susan",
    "Anh Đào": "cherry blossom",
    "Hoa Sứ": "plumeria flower",
    "Dứa Cảnh": "bromeliad flower",
    "Hoa Rum": "calla lily",
    "Thiên Điểu": "bird of paradise flower",
    "Dong Riềng": "canna lily",
    "Statice": "sea lavender",
    "Hoa Sáp": "wax flower",
    "Dương Cúc": "yarrow flower",
    "Hành Cảnh": "allium flower",
    "Trái Tim Rỉ Máu": "bleeding heart flower",
    "Cúc Dại Tía": "echinacea flower",
    "Hoa Chăn": "gaillardia flower",
    "Bìm Bìm": "morning glory flower",
    "Bồ Ngót": "nasturtium flower",
    "Phlox": "phlox flower",
    "Xô Thơm": "salvia flower",
    "Thuốc Bỏng": "sedum plant",
    "Cây Kế": "thistle flower",
    "Veronica": "veronica flower",
    "Tử Đằng": "wisteria flower",
    "Tử La Lan": "gloxinia flower",
    "Thanh Cúc": "cornflower",
    "Cẩm Tú Cầu": "hydrangea",
    "Hoa Giấy": "bougainvillea",
    "Đồng Tiền": "gerbera daisy",
    "Hoa Bướm": "butterfly bush",
    "Trâm Ổi": "lantana flower",
    "Protea": "king protea",
    "Mỏ Vẹt": "heliconia flower",
    "Hoa Huệ": "tuberose flower",
    "Hoa Dơi": "black bat flower",
    "Mào Gà": "celosia flower",
    "Cà Rốt Dại": "queen anne lace flower",
    "Astrantia": "astrantia flower",
    "Sweet William": "dianthus flower",
    "Lài Madagascar": "stephanotis",
    "Hồng Môn": "anthurium",
    "Kangaroo Paw": "kangaroo paw flower",
    "Cúc Nút Áo": "craspedia flower",
    "Cát Tường": "lisianthus flower",
    "Phi Yến": "delphinium flower",
    "Bỉ Ngạn": "red spider lily flower"
};

// Hàm sinh ảnh tự động thông minh
const getAutoImage = (category, index) => {
    let keyword = "beautiful flowers bouquet"; // Mặc định
    for (const key in FLOWER_MAP) {
        if (category.includes(key)) {
            keyword = FLOWER_MAP[key];
            break;
        }
    }
    // lock=index để ảnh cố định cho từng sản phẩm
    return `https://loremflickr.com/600/600/${keyword.replace(/\s+/g, ',')}?lock=${index}`;
};

// --- 3. DỮ LIỆU GỐC (Đã bỏ cột link ảnh cũ, code sẽ tự điền) ---
const rawData = [
    ["Bó Hoa Hồng Đỏ (Rose)", 550000, "Hoa Hồng", "Bó", ["Tỏ tình", "Valentine"], ["Lãng mạn"], ["Đỏ"], "Nữ hoàng của các loài hoa, biểu tượng tình yêu nồng cháy.", "5-7 ngày", "Thơm nhẹ", "Nở rộ"],
    ["Bó Tulip Hà Lan", 1200000, "Tulip", "Bó", ["Hẹn hò", "Quốc tế Phụ nữ"], ["Thanh lịch"], ["Đa sắc"], "Vẻ đẹp hoàn hảo và sự thanh lịch đến từ Hà Lan.", "5-7 ngày", "Nhẹ", "Nở bung"],
    ["Bó Cẩm Chướng (Carnation)", 400000, "Cẩm Chướng", "Bó", ["Tặng mẹ"], ["Biết ơn"], ["Hồng"], "Sức sống mạnh mẽ, biểu tượng tình mẹ bao la.", "7-10 ngày", "Thơm nhẹ", "Nở bền"],
    ["Bó Mẫu Đơn (Peony)", 1800000, "Mẫu Đơn", "Bó", ["Cưới", "VIP"], ["Vương giả"], ["Hồng"], "Nữ hoàng hoa Trung Quốc, biểu tượng sự giàu sang.", "4-6 ngày", "Thơm nồng", "Nở đại"],
    ["Bó Hướng Dương (Sunflower)", 450000, "Hướng Dương", "Bó", ["Tốt nghiệp"], ["Năng lượng"], ["Vàng"], "Luôn hướng về mặt trời, biểu tượng lòng trung thành.", "5-7 ngày", "Nhẹ", "Nở sẵn"],
    ["Chậu Phong Lan Hồ Điệp", 2500000, "Phong Lan", "Chậu", ["Khai trương"], ["Sang trọng"], ["Trắng"], "Vẻ đẹp kỳ lạ và sự hoàn hảo, rất lâu tàn.", "30-45 ngày", "Không mùi", "Nở bền"],
    ["Bó Hoa Loa Kèn (Lily)", 350000, "Loa Kèn", "Bó", ["Tháng 4"], ["Tinh khôi"], ["Trắng"], "Vẻ đẹp thanh lịch, báo hiệu mùa hè.", "4-5 ngày", "Thơm nhẹ", "Nở loa"],
    ["Bó Thủy Tiên Peru (Alstroemeria)", 400000, "Thủy Tiên Peru", "Bó", ["Tặng bạn"], ["Bền bỉ"], ["Cam"], "Biểu tượng mạnh mẽ của tình bạn lâu dài.", "10-14 ngày", "Nhẹ", "Nở chùm"],
    ["Bó Hoa Stock (Mattiola)", 450000, "Hoa Stock", "Bó", ["Trang trí"], ["Thơm"], ["Tím"], "Hương thơm ngọt ngào, vẻ đẹp dày đặc.", "5-7 ngày", "Thơm nồng", "Nở chùm"],
    ["Chậu Thủy Tiên Vàng", 500000, "Thủy Tiên", "Chậu", ["Tết"], ["Tái sinh"], ["Vàng"], "Báo hiệu mùa xuân và khởi đầu mới.", "7-10 ngày", "Thơm mát", "Nở đẹp"],
    ["Bó Cúc Dại (Daisy)", 300000, "Cúc Dại", "Bó", ["Chụp ảnh"], ["Ngây thơ"], ["Trắng"], "Vẻ đẹp tinh khôi và tự do của đồng nội.", "5-7 ngày", "Thơm cỏ", "Nở đều"],
    ["Chậu Dạ Lan Hương", 250000, "Dạ Lan Hương", "Chậu", ["Tết"], ["Nồng nàn"], ["Tím"], "Hương thơm ngào ngạt nở vào ban đêm.", "7-10 ngày", "Rất thơm", "Nở chùm"],
    ["Bó Hoa Diên Vĩ (Iris)", 700000, "Diên Vĩ", "Bó", ["Quà tặng"], ["Thông thái"], ["Xanh tím"], "Biểu tượng hoàng gia, sự khôn ngoan.", "4-5 ngày", "Nhẹ", "Nở đẹp"],
    ["Bó Hoa Cúc Vàng", 200000, "Hoa Cúc", "Bó", ["Thờ cúng"], ["Trường thọ"], ["Vàng"], "Biểu tượng của sự thịnh vượng và viên mãn.", "10-14 ngày", "Hắc nhẹ", "Nở lâu"],
    ["Chậu Phong Lữ (Geranium)", 150000, "Phong Lữ", "Chậu", ["Ban công"], ["Vui vẻ"], ["Đỏ"], "Mang lại sự vui vẻ cho khu vườn.", "Vĩnh cửu", "Hắc", "Nở chùm"],
    ["Cành Mộc Lan (Magnolia)", 800000, "Mộc Lan", "Cành", ["Trang trí"], ["Cao quý"], ["Trắng"], "Vẻ đẹp cổ điển và lãng mạn.", "5-7 ngày", "Thơm", "Nở to"],
    ["Bó Oải Hương (Lavender)", 450000, "Oải Hương", "Bó", ["Thư giãn"], ["Bình yên"], ["Tím"], "Hương thơm thư giãn, thanh thản.", "1 năm", "Rất thơm", "Khô"],
    ["Bó Hoa Anh Túc (Poppy)", 500000, "Anh Túc", "Bó", ["Nghệ thuật"], ["Quyến rũ"], ["Đỏ cam"], "Vẻ đẹp rực rỡ nhưng mong manh.", "3-4 ngày", "Hắc", "Nở bung"],
    ["Bó Chuông Xanh (Bluebell)", 600000, "Chuông Xanh", "Bó", ["Biết ơn"], ["Khiêm tốn"], ["Xanh"], "Hình dáng như những chiếc chuông nhỏ.", "5-7 ngày", "Nhẹ", "Nở rũ"],
    ["Chậu Cúc Vạn Thọ", 100000, "Vạn Thọ", "Chậu", ["Tết"], ["Sức khỏe"], ["Vàng"], "Cầu mong sức khỏe và sự trường thọ.", "1 tháng", "Hắc", "Nở tròn"],
    ["Chậu Huệ Tây (Amaryllis)", 350000, "Huệ Tây", "Chậu", ["Tết"], ["Kiêu hãnh"], ["Đỏ"], "Bông hoa loa kèn khổng lồ rực rỡ chơi Tết.", "10-15 ngày", "Nhẹ", "Nở to"],
    ["Chậu Hoa Trà Mi (Camellia)", 400000, "Trà Mi", "Chậu", ["Sưu tầm"], ["Ái mộ"], ["Hồng"], "Vẻ đẹp hoàn hảo không tì vết, cánh xếp tầng.", "10-15 ngày", "Không mùi", "Nở đẹp"],
    ["Chậu Thu Hải Đường", 200000, "Thu Hải Đường", "Chậu", ["Treo giàn"], ["Hài hòa"], ["Cam"], "Hoa treo rủ đẹp mắt, màu sắc rực rỡ.", "Vĩnh cửu", "Nhẹ", "Nở liên tục"],
    ["Bó Thược Dược (Dahlia)", 350000, "Thược Dược", "Bó", ["Tết"], ["Chung thủy"], ["Đa sắc"], "Hoa Tết truyền thống, cánh hoa cầu kỳ.", "5-7 ngày", "Hắc nhẹ", "Nở to"],
    ["Chậu Cúc Ngũ Sắc (Zinnia)", 80000, "Cúc Ngũ Sắc", "Chậu", ["Sân vườn"], ["Nhớ nhung"], ["Đa sắc"], "Màu sắc vui mắt, dễ trồng, cánh cứng cáp.", "1-2 tháng", "Không mùi", "Nở rộ"],
    ["Bó Hoa Mõm Sói", 300000, "Mõm Sói", "Bó", ["Trang trí"], ["Tương lai"], ["Hồng"], "Hình dáng hoa vươn cao như hàm rồng/thú.", "7-10 ngày", "Nhẹ", "Nở dọc"],
    ["Chậu Dã Yến Thảo", 120000, "Dã Yến Thảo", "Chậu", ["Ban công"], ["Bình yên"], ["Tím"], "Hoa rủ ban công cực đẹp, tím mộng mơ.", "Vĩnh cửu", "Hắc nhẹ", "Nở liên tục"],
    ["Chậu Hoa Păng Xê (Pansy)", 100000, "Păng Xê", "Chậu", ["Mùa đông"], ["Suy tư"], ["Tím vàng"], "Cánh hoa có hình khuôn mặt mèo/thiên thần.", "2-3 tháng", "Nhẹ", "Nở đẹp"],
    ["Gói Hoa Nhài (Jasmine)", 50000, "Hoa Nhài", "Gói", ["Trà đạo"], ["Thanh khiết"], ["Trắng"], "Dùng để ướp trà thơm ngát, trắng tinh khôi.", "1 ngày", "Thơm mát", "Nở xòe"],
    ["Chậu Hoa Lê Đông (Hellebore)", 500000, "Hoa Lê Đông", "Chậu", ["Mùa đông"], ["Bền bỉ"], ["Xanh nhạt"], "Loài hoa nở trong tuyết, vẻ đẹp lạ mắt.", "1 tháng", "Không mùi", "Nở bền"],
    ["Bó Hoa Dành Dành", 200000, "Dành Dành", "Bó", ["Tặng mẹ"], ["Thầm kín"], ["Trắng"], "Hương thơm nồng nàn quyến rũ.", "3-4 ngày", "Rất thơm", "Nở xòe"],
    ["Chậu Hoa Vân Anh (Fuchsia)", 250000, "Vân Anh", "Chậu", ["Treo giàn"], ["Khiêm tốn"], ["Hồng tím"], "Hoa lồng đèn rủ xuống đẹp mắt.", "Vĩnh cửu", "Không mùi", "Nở rủ"],
    ["Giàn Hoa Ông Lão (Clematis)", 300000, "Ông Lão", "Cây", ["Leo tường"], ["Thông minh"], ["Tím"], "Leo tường rực rỡ.", "Vĩnh cửu", "Nhẹ", "Nở to"],
    ["Chậu Đỗ Quyên", 350000, "Đỗ Quyên", "Chậu", ["Tết"], ["Ôn hòa"], ["Hồng"], "Biểu tượng của sự dịu dàng.", "15-20 ngày", "Không mùi", "Nở rộ"],
    ["Bó Hoa Hải Quỳ (Anemone)", 400000, "Hải Quỳ", "Bó", ["Tình yêu"], ["Hy vọng"], ["Đỏ tím"], "Vẻ đẹp rực rỡ và mong manh.", "4-5 ngày", "Không mùi", "Nở bung"],
    ["Hộp Nhụy Nghệ Tây (Saffron)", 2000000, "Nghệ Tây", "Hộp", ["Sức khỏe"], ["Đắt đỏ"], ["Tím"], "Gia vị đắt nhất thế giới.", "Vĩnh cửu", "Thơm", "Khô"],
    ["Bó Mao Lương (Ranunculus)", 800000, "Mao Lương", "Bó", ["Cưới"], ["Quyến rũ"], ["Vàng"], "Nhiều lớp cánh cuộn tròn tuyệt đẹp.", "5-7 ngày", "Nhẹ", "Nở tròn"],
    ["Bó Lay Ơn (Gladiolus)", 300000, "Lay Ơn", "Bó", ["Tết"], ["Sức mạnh"], ["Đỏ"], "Hoa dơn đỏ truyền thống.", "7-10 ngày", "Không mùi", "Nở dần"],
    ["Bó Mao Địa Hoàng", 400000, "Mao Địa Hoàng", "Bó", ["Cảnh quan"], ["Giả dối"], ["Hồng"], "Hình chuông cao ấn tượng nhưng có độc.", "5-7 ngày", "Không mùi", "Nở dọc"],
    ["Bó Thạch Thảo Tím", 300000, "Thạch Thảo", "Bó", ["Kỷ niệm"], ["Kiên nhẫn"], ["Tím"], "Hoa mùa thu tím biếc.", "5-6 ngày", "Nhẹ", "Nở li ti"],
    ["Bó Hoa Lưu Ly (Forget Me Not)", 500000, "Lưu Ly", "Bó", ["Chia tay"], ["Nhớ nhung"], ["Xanh"], "Xin đừng quên tôi.", "4-5 ngày", "Nhẹ", "Nở li ti"],
    ["Bó Linh Lan (Lily of Valley)", 3000000, "Linh Lan", "Bó", ["Cưới"], ["Hạnh phúc"], ["Trắng"], "Chuông trắng mang lại may mắn.", "3 ngày", "Thơm dịu", "Nở rũ"],
    ["Chậu Dâm Bụt", 150000, "Dâm Bụt", "Chậu", ["Hàng rào"], ["Ngắn ngủi"], ["Đỏ"], "Vẻ đẹp rực rỡ thoáng qua.", "1 ngày", "Không mùi", "Nở xòe"],
    ["Chậu Tiên Khách Lai", 300000, "Tiên Khách Lai", "Chậu", ["Tết"], ["Duyên dáng"], ["Hồng"], "Cánh hoa hếch lên độc đáo.", "1-2 tháng", "Nhẹ", "Nở bền"],
    ["Bó Lan Nam Phi (Freesia)", 600000, "Lan Nam Phi", "Bó", ["Tặng bạn"], ["Niềm tin"], ["Vàng"], "Hương thơm tươi mát.", "7-10 ngày", "Thơm mát", "Nở chùm"],
    ["Chậu Cúc Vạn Thọ Tây", 120000, "Vạn Thọ Tây", "Chậu", ["Sân vườn"], ["Hòa bình"], ["Cam"], "Vẻ ngoài vui vẻ, hồn nhiên.", "1 tháng", "Hắc", "Nở rộ"],
    ["Giàn Đậu Ngọt", 200000, "Đậu Ngọt", "Cây", ["Leo giàn"], ["Biết ơn"], ["Hồng"], "Hoa leo mềm mại thơm ngát.", "Vĩnh cửu", "Thơm ngọt", "Nở chùm"],
    ["Chậu Cỏ Roi Ngựa", 100000, "Cỏ Roi Ngựa", "Chậu", ["Thu hút bướm"], ["Chữa lành"], ["Tím"], "Cụm hoa nhỏ tím biếc.", "Vĩnh cửu", "Nhẹ", "Nở li ti"],
    ["Chậu Hoa Anh Thảo", 250000, "Anh Thảo", "Chậu", ["Mùa xuân"], ["Tình yêu"], ["Đa sắc"], "Báo hiệu mùa xuân về.", "1 tháng", "Nhẹ", "Nở đẹp"],
    ["Chậu Thạch Nam (Heather)", 450000, "Thạch Nam", "Chậu", ["May mắn"], ["Độc lập"], ["Hồng tím"], "Cây bụi nhỏ hoa tím.", "Vĩnh cửu", "Không mùi", "Nở chùm"],
    ["Chậu Đỗ Quyên Rừng", 500000, "Đỗ Quyên", "Chậu", ["Tết"], ["Sung túc"], ["Đỏ"], "Hoa nở kín cây ngày Tết.", "15 ngày", "Không mùi", "Nở rộ"],
    ["Bó Hoa Sen Hồng", 350000, "Hoa Sen", "Bó", ["Dâng hương"], ["Thanh cao"], ["Hồng"], "Quốc hoa Việt Nam.", "2-3 ngày", "Thơm dịu", "Nở ngày khép đêm"],
    ["Chậu Hoa Violet", 150000, "Violet", "Chậu", ["Mùa xuân"], ["Khiêm tốn"], ["Tím"], "Màu tím chung thủy.", "2-3 tháng", "Nhẹ", "Nở nhỏ"],
    ["Chậu Ngọc Thảo", 80000, "Ngọc Thảo", "Chậu", ["Ban công"], ["Vui vẻ"], ["Đa sắc"], "Dễ trồng, hoa rực rỡ.", "Vĩnh cửu", "Không mùi", "Nở nhiều"],
    ["Chậu Cúc Kim Tiền", 100000, "Kim Tiền", "Chậu", ["Tài lộc"], ["Chữa lành"], ["Cam"], "Mang lại tiền tài.", "1 tháng", "Hắc", "Nở tròn"],
    ["Chậu Cúc Mắt Đen", 120000, "Cúc Mắt Đen", "Chậu", ["Sân vườn"], ["Công bằng"], ["Vàng đen"], "Nhụy đen nổi bật trên cánh vàng.", "1 tháng", "Không mùi", "Nở xòe"],
    ["Bó Hoa Anh Đào", 800000, "Anh Đào", "Bó", ["Mùa xuân"], ["Phù du"], ["Hồng"], "Vẻ đẹp ngắn ngủi nhưng rực rỡ.", "5-7 ngày", "Thơm nhẹ", "Nở chùm"],
    ["Chậu Hoa Sứ", 300000, "Hoa Sứ", "Chậu", ["Sân vườn"], ["Quyến rũ"], ["Hồng trắng"], "Hương thơm ngọt ngào.", "Vĩnh cửu", "Thơm ngọt", "Nở chùm"],
    ["Chậu Dứa Cảnh", 250000, "Dứa Cảnh", "Chậu", ["Văn phòng"], ["Hiếu khách"], ["Đỏ"], "Hoa đỏ rực ở trung tâm.", "1-2 tháng", "Không mùi", "Nở bền"],
    ["Bó Hoa Rum (Calla Lily)", 500000, "Hoa Rum", "Bó", ["Cưới"], ["Thanh lịch"], ["Trắng"], "Vẻ đẹp lộng lẫy và sang trọng.", "5-7 ngày", "Nhẹ", "Nở sẵn"],
    ["Cây Dong Riềng", 150000, "Dong Riềng", "Cây", ["Cảnh quan"], ["Lộng lẫy"], ["Đỏ"], "Lá to, hoa đỏ rực.", "Vĩnh cửu", "Không mùi", "Nở chùm"],
    ["Bó Oải Hương Biển (Statice)", 300000, "Statice", "Bó", ["Hoa phụ"], ["Ký ức"], ["Tím"], "Hoa giấy khô tự nhiên.", "1 năm", "Không mùi", "Khô"],
    ["Bó Hoa Sáp (Waxflower)", 600000, "Hoa Sáp", "Bó", ["Chúc mừng"], ["Bền lâu"], ["Hồng"], "Cánh hoa như sáp, rất bền.", "10-15 ngày", "Thơm chanh", "Nở li ti"],
    ["Bó Dương Cúc (Yarrow)", 250000, "Dương Cúc", "Bó", ["Thuốc"], ["Chữa lành"], ["Vàng"], "Thảo dược chữa lành.", "5-7 ngày", "Hắc", "Nở chùm"],
    ["Chậu Hành Cảnh (Allium)", 300000, "Hành Cảnh", "Chậu", ["Độc lạ"], ["Kiên nhẫn"], ["Tím"], "Hoa tròn như quả cầu tím.", "10-14 ngày", "Hắc", "Nở cầu"],
    ["Cành Trái Tim Rỉ Máu", 400000, "Trái Tim Rỉ Máu", "Cành", ["Sưu tầm"], ["Cảm xúc"], ["Hồng đỏ"], "Hình trái tim có giọt nước.", "5-7 ngày", "Không mùi", "Nở rũ"],
    ["Chậu Cúc Dại Tía", 150000, "Cúc Dại Tía", "Chậu", ["Thuốc"], ["Sức mạnh"], ["Tím"], "Tăng cường miễn dịch.", "1 tháng", "Không mùi", "Nở to"],
    ["Chậu Hoa Chăn (Gaillardia)", 100000, "Hoa Chăn", "Chậu", ["Nắng nóng"], ["Quyến rũ"], ["Đỏ vàng"], "Chịu hạn tốt, màu rực rỡ.", "Vĩnh cửu", "Không mùi", "Nở xòe"],
    ["Giàn Bìm Bìm", 50000, "Bìm Bìm", "Cây", ["Leo rào"], ["Giản dị"], ["Tím"], "Hoa leo dân dã.", "Vĩnh cửu", "Không mùi", "Nở sáng"],
    ["Chậu Bồ Ngót (Nasturtium)", 80000, "Bồ Ngót", "Chậu", ["Ăn được"], ["Yêu nước"], ["Cam"], "Hoa ăn được, vị cay.", "1 tháng", "Hắc", "Nở nhiều"],
    ["Chậu Phlox", 120000, "Phlox", "Chậu", ["Sân vườn"], ["Hòa hợp"], ["Hồng"], "Nở thành thảm hoa đẹp.", "1 tháng", "Thơm nhẹ", "Nở chùm"],
    ["Chậu Xô Thơm (Salvia)", 150000, "Xô Thơm", "Chậu", ["Gia vị"], ["Khôn ngoan"], ["Tím"], "Gia vị và hoa đẹp.", "Vĩnh cửu", "Thơm nồng", "Nở dọc"],
    ["Chậu Thuốc Bỏng (Sedum)", 60000, "Thuốc Bỏng", "Chậu", ["Chữa bệnh"], ["Yên bình"], ["Hồng"], "Lá dày mọng nước.", "Vĩnh cửu", "Không mùi", "Nở chùm"],
    ["Bó Cây Kế (Thistle)", 200000, "Cây Kế", "Bó", ["Độc lạ"], ["Bảo vệ"], ["Tím gai"], "Vẻ đẹp gai góc.", "7-10 ngày", "Không mùi", "Nở cầu"],
    ["Chậu Veronica", 180000, "Veronica", "Chậu", ["Sân vườn"], ["Trung thành"], ["Xanh tím"], "Hoa đuôi chồn xanh biếc.", "1 tháng", "Không mùi", "Nở dọc"],
    ["Chậu Violet Tường", 120000, "Violet Tường", "Chậu", ["Tường rào"], ["Bền bỉ"], ["Vàng nâu"], "Mọc trên tường cũ.", "1 tháng", "Thơm", "Nở chùm"],
    ["Giàn Tử Đằng (Wisteria)", 800000, "Tử Đằng", "Cây", ["Cổng nhà"], ["Vĩnh cửu"], ["Tím"], "Leo cổng tuyệt đẹp.", "Vĩnh cửu", "Thơm", "Nở chùm"],
    ["Chậu Gloxinia (Tử La Lan)", 200000, "Tử La Lan", "Chậu", ["Trong nhà"], ["Kiêu sa"], ["Tím nhung"], "Hoa chuông nhung sang trọng.", "1 tháng", "Không mùi", "Nở to"],
    ["Bó Thanh Cúc (Cornflower)", 250000, "Thanh Cúc", "Bó", ["Đồng nội"], ["Tinh tế"], ["Xanh dương"], "Màu xanh dương hiếm có.", "5-7 ngày", "Nhẹ", "Nở xòe"],
    ["Bó Cẩm Tú Cầu", 500000, "Cẩm Tú Cầu", "Bó", ["Xin lỗi"], ["Vô cảm"], ["Xanh"], "Cầu hoa to tròn thay đổi màu.", "3-4 ngày", "Không mùi", "Nở sẵn"],
    ["Giàn Hoa Giấy", 300000, "Hoa Giấy", "Cây", ["Cổng nhà"], ["Nhiệt huyết"], ["Hồng"], "Rực rỡ quanh năm.", "Vĩnh cửu", "Không mùi", "Nở chùm"],
    ["Bó Đồng Tiền (Gerbera)", 350000, "Đồng Tiền", "Bó", ["Khai trương"], ["Vui vẻ"], ["Đỏ"], "Mang lại tiền tài.", "5-7 ngày", "Không mùi", "Nở xòe"],
    ["Cây Hoa Bướm (Buddleja)", 150000, "Hoa Bướm", "Cây", ["Thu hút bướm"], ["Tái sinh"], ["Tím"], "Thu hút bướm đến vườn.", "Vĩnh cửu", "Thơm", "Nở chùm"],
    ["Chậu Trâm Ổi (Lantana)", 80000, "Trâm Ổi", "Chậu", ["Hàng rào"], ["Nghiêm khắc"], ["Đa sắc"], "Hoa ngũ sắc dại ven đường.", "Vĩnh cửu", "Hắc", "Nở cầu"],
    ["Bó Thiên Điểu", 400000, "Thiên Điểu", "Bó", ["Mạnh mẽ"], ["Tự do"], ["Cam"], "Như chim phượng hoàng.", "10-14 ngày", "Không mùi", "Nở sẵn"],
    ["Bó Protea (King Protea)", 1200000, "Protea", "Bó", ["Sang trọng"], ["Sức mạnh"], ["Hồng"], "Quốc hoa Nam Phi khổng lồ.", "14-20 ngày", "Không mùi", "Nở to"],
    ["Chậu Heliconia (Mỏ Vẹt)", 300000, "Mỏ Vẹt", "Chậu", ["Nhiệt đới"], ["Cảm hứng"], ["Đỏ vàng"], "Đậm chất nhiệt đới.", "Vĩnh cửu", "Không mùi", "Nở bền"],
    ["Bó Huệ Trắng (Tuberose)", 250000, "Hoa Huệ", "Bó", ["Dâng hương"], ["Nguy hiểm"], ["Trắng"], "Thơm nồng nàn về đêm.", "5-7 ngày", "Thơm nồng", "Nở dần"],
    ["Chậu Hoa Dơi Đen", 500000, "Hoa Dơi", "Chậu", ["Sưu tầm"], ["Bí ẩn"], ["Đen"], "Hình dáng như con dơi đen.", "10-15 ngày", "Không mùi", "Nở lạ"],
    ["Chậu Mào Gà", 100000, "Mào Gà", "Chậu", ["Tết"], ["Hài hước"], ["Đỏ"], "Hình dáng như mào gà.", "1-2 tháng", "Không mùi", "Nở nhung"],
    ["Bó Cà Rốt Dại", 200000, "Cà Rốt Dại", "Bó", ["Hoa phụ"], ["Thánh địa"], ["Trắng"], "Hoa ren trắng tinh tế.", "5-7 ngày", "Hắc nhẹ", "Nở xòe"],
    ["Bó Astrantia", 350000, "Astrantia", "Bó", ["Hoa phụ"], ["Sức mạnh"], ["Hồng"], "Ngôi sao nhỏ xinh.", "7-10 ngày", "Nhẹ", "Nở sao"],
    ["Bó Cẩm Chướng Râu", 300000, "Sweet William", "Bó", ["Nam tính"], ["Hào hiệp"], ["Đỏ trắng"], "Cẩm chướng chùm thơm.", "7-10 ngày", "Thơm", "Nở chùm"],
    ["Chậu Hoa Lài Madagascar", 250000, "Lài Madagascar", "Chậu", ["Cưới"], ["Hạnh phúc"], ["Trắng"], "Hoa sáp trắng thơm ngát.", "Vĩnh cửu", "Thơm", "Nở chùm"],
    ["Chậu Hồng Môn (Anthurium)", 350000, "Hồng Môn", "Chậu", ["Văn phòng"], ["Hiếu khách"], ["Đỏ"], "Bền bỉ, thanh lọc không khí.", "30 ngày", "Không mùi", "Bền"],
    ["Bó Chân Chuột Túi", 400000, "Kangaroo Paw", "Bó", ["Độc lạ"], ["Độc đáo"], ["Đỏ xanh"], "Hình dáng như bàn chân chuột túi.", "10-14 ngày", "Không mùi", "Lông nhung"],
    ["Bó Cúc Nút Áo (Billy Buttons)", 300000, "Cúc Nút Áo", "Bó", ["Decor"], ["Vui vẻ"], ["Vàng"], "Tròn như nút áo vàng.", "Khô vĩnh viễn", "Không mùi", "Khô"],
    ["Bó Cát Tường (Lisianthus)", 450000, "Cát Tường", "Bó", ["Chúc sức khỏe"], ["Trân trọng"], ["Xanh bơ"], "Giống hoa hồng nhưng không gai.", "7-10 ngày", "Nhẹ", "Nở dần"],
    ["Bó Phi Yến (Delphinium)", 600000, "Phi Yến", "Bó", ["Tháng 7"], ["Cởi mở"], ["Xanh dương"], "Cành hoa cao vút màu xanh.", "5-7 ngày", "Nhẹ", "Nở dọc"],
    ["Bó Hoa Bỉ Ngạn", 600000, "Bỉ Ngạn", "Bó", ["Huyền bí"], ["Buồn"], ["Đỏ"], "Ký ức đau thương.", "5-7 ngày", "Không mùi", "Nở xòe"]
];

// --- 4. LOGIC SEEDING (ĐÃ TỐI ƯU HÓA) ---
const seed = async () => {
    try {
        console.log("🔌 Đang kết nối MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected!");

        // Xóa sạch dữ liệu cũ
        await Product.deleteMany({});
        console.log("🗑️  Đã xóa dữ liệu Product cũ.");

        const itemsToInsert = [];
        console.log(`⏳ Đang xử lý ${rawData.length} sản phẩm và tạo ảnh tự động...`);

        // Vòng lặp xử lý từng sản phẩm
        for (let i = 0; i < rawData.length; i++) {
            const item = rawData[i];
            
            // 🔥 TỰ ĐỘNG SINH ẢNH (Không cần quan tâm link cũ)
            const autoImage = getAutoImage(item[2], i);

            // Tạo Object sản phẩm
            const p = {
                name: item[0],
                price: item[1],
                category: item[2],
                type: item[3],
                occasions: item[4],
                style_tags: item[5],
                colors: item[6],
                description: item[7],
                durability: item[8],
                fragrance_level: item[9],
                blooming_time: item[10],
                images: [autoImage] // Link ảnh xịn
            };

            const slug = slugify(p.name);
            const searchAlias = removeAccents(p.name);

            // Tạo Vector Embedding cho AI đọc
            const textToEmbed = `
                Sản phẩm: ${p.name}. Tên không dấu: ${searchAlias}. 
                Loại: ${p.category} (${p.type}). Giá: ${p.price}. 
                Mô tả: ${p.description}
            `.replace(/\s+/g, ' ').trim();

            const vector = await embeddings.embedQuery(textToEmbed);

            itemsToInsert.push({ ...p, slug, embedding: vector });
        }

        // Lưu vào DB một lần
        await Product.insertMany(itemsToInsert);
        console.log(`🎉 Đã seed thành công ${itemsToInsert.length} sản phẩm. 100% ẢNH ĐẸP KHÔNG LỖI!`);
        process.exit();
    } catch (e) {
        console.error("❌ Lỗi Seed Product:", e);
        process.exit(1);
    }
};

seed();