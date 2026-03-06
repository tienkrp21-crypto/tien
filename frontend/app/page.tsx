"use client";
import { useState, useRef, useEffect } from "react";
import { Send, User, Sparkles, Plus, Image as ImageIcon, Mic, ShoppingBag } from "lucide-react";

// Định nghĩa kiểu dữ liệu cho chặt chẽ hơn
interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
}

interface Message {
  role: "user" | "bot";
  content: string;
  options?: string[];
  products?: Product[];
}

export default function Home() {
  // --- 1. QUẢN LÝ TRẠNG THÁI ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🔥 Hàm lấy Session ID từ LocalStorage (Giữ ký ức khi F5)
  const getSessionId = () => {
    if (typeof window !== "undefined") {
      let savedId = localStorage.getItem("chat_session_id");
      if (!savedId) {
        // Tạo ID ngẫu nhiên: user_TIMESTAMP_RANDOM
        savedId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem("chat_session_id", savedId);
      }
      return savedId;
    }
    return "";
  };

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // 🔥 [THÊM MỚI] Hàm xử lý hiển thị tin nhắn (Biến **text** thành chữ đậm màu hồng)
  const renderMessage = (content: string) => {
    // Tách chuỗi dựa trên dấu **
    const parts = content.split("**");
    return parts.map((part, index) => 
      // Vị trí lẻ (1, 3, 5...) là nội dung nằm giữa 2 dấu ** -> In đậm
      index % 2 === 1 ? (
        <strong key={index} className="text-pink-400 font-bold">
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    try {
      // Lấy Session ID để gửi xuống Backend
      const currentSessionId = getSessionId();
      // Gọi API Backend
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            message: text,
            sessionId: currentSessionId // Gửi kèm vé vào cửa
        }),
      });
      if (!res.ok) throw new Error("Lỗi kết nối Backend");
      const data = await res.json(); 
      // Cập nhật phản hồi từ AI
      setMessages((prev) => [
        ...prev, 
        { 
            role: "bot", 
            content: data.reply, 
            options: data.options,   
            products: data.products  
        }
      ]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", content: "⚠️ Mất kết nối server! Bạn hãy kiểm tra lại xem Backend (Port 8000) đã bật chưa nhé." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasStarted = messages.length > 0;
  
  const suggestions = [
    { text: "Shop hoa mình địa chỉ ở đâu vậy?", icon: "📍" },
    { text: "Có mẫu hoa hồng tặng sinh nhật không?", icon: "🌹" },
    { text: "Sản phẩm nào đắt nhất shop?", icon: "💎" }, 
    { text: "Mấy giờ shop đóng cửa nghỉ?", icon: "⏰" },
  ];

  return (
    <div className="bg-[#131314] text-[#e3e3e3] h-screen flex flex-col font-sans">
      
      {/* HEADER */}
      <div className="p-4 flex justify-between items-center sticky top-0 bg-[#131314]/90 backdrop-blur z-20 border-b border-gray-800">
        <div className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <span className="text-xl font-medium">T&T Flower AI</span>
          <span className="text-xs bg-[#1e1f20] px-2 py-0.5 rounded text-gray-400">RAG System</span>
        </div>
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-pink-500">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* BODY CHAT */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
            
            {/* Giao diện chào mừng */}
            {!hasStarted && (
                <div className="mt-10 md:mt-20 space-y-8 animate-in fade-in duration-700">
                    <div className="space-y-2">
                        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-transparent bg-clip-text inline-block">
                            Xin chào, Bạn
                        </h1>
                        <h2 className="text-4xl md:text-5xl font-bold text-[#444746]">
                            Hôm nay tôi có thể giúp gì?
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                        {suggestions.map((s, i) => (
                            <button key={i} onClick={() => handleSend(s.text)} className="p-4 bg-[#1e1f20] hover:bg-[#282a2c] rounded-xl text-left flex items-center justify-between group transition-all border border-transparent hover:border-gray-600">
                                <span className="text-gray-300 group-hover:text-white">{s.text}</span>
                                <span className="p-2 bg-black rounded-full text-lg">{s.icon}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Hiển thị tin nhắn */}
            {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                    <div key={idx} className={`flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isUser ? "bg-pink-600" : "bg-transparent"}`}>
                            {isUser ? <User size={18} /> : <Sparkles className="text-pink-400 animate-pulse" />}
                        </div>
                        
                        <div className={`max-w-[85%] leading-7 text-[16px] whitespace-pre-line ${isUser ? "bg-[#282a2c] px-5 py-3 rounded-2xl rounded-tr-sm" : "text-gray-100 px-0 py-2"}`}>
                            
                            {/* 🔥 SỬ DỤNG HÀM RENDER ĐỂ HIỂN THỊ CHỮ ĐẬM */}
                            {isUser ? msg.content : renderMessage(msg.content)}
                            
                            {/* Danh sách sản phẩm gợi ý */}
                            {!isUser && msg.products && msg.products.length > 0 && (
                                <div className="flex gap-3 overflow-x-auto pb-4 mt-4 no-scrollbar snap-x">
                                    {msg.products.map((p) => (
                                        <div key={p._id} className="snap-center shrink-0 w-[220px] bg-[#1e1f20] border border-gray-700 rounded-xl overflow-hidden hover:border-pink-500/50 transition-all group">
                                            <div className="h-32 w-full overflow-hidden relative bg-[#2c2d2e]">
                                                <img 
                                                    src={p.images && p.images.length > 0 ? p.images[0] : "https://placehold.co/300x200/1e1f20/e3e3e3?text=Flower"} 
                                                    alt={p.name} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                                    onError={(e: any) => { 
                                                        e.target.onerror = null; 
                                                        e.target.src = "https://placehold.co/300x200/1e1f20/e3e3e3?text=No+Image"; 
                                                    }}
                                                />
                                            </div>
                                            <div className="p-3">
                                                <h3 className="font-medium text-sm text-gray-200 truncate">{p.name}</h3>
                                                <p className="text-pink-400 text-xs font-bold mt-1">{p.price?.toLocaleString('vi-VN')} VNĐ</p>
                                                <button 
                                                    onClick={() => handleSend(`Tôi muốn đặt mẫu ${p.name}`)}
                                                    className="w-full mt-3 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-pink-50 hover:text-pink-600 transition flex items-center justify-center gap-1"
                                                >
                                                    <ShoppingBag size={14} /> MUA NGAY
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Nút gợi ý nhanh (Options) */}
                            {!isUser && msg.options && msg.options.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    {msg.options.map((opt, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => handleSend(opt)} 
                                            className="px-4 py-2 bg-[#1e1f20] border border-gray-700 hover:bg-[#2c2d2e] hover:border-pink-500 rounded-xl text-sm text-pink-400 transition-all shadow-sm"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            
            {isLoading && (
                <div className="flex gap-4">
                    <div className="w-8 h-8 flex items-center justify-center"><Sparkles className="text-pink-400 animate-spin" size={20}/></div>
                    <div className="text-gray-400 mt-1 animate-pulse">T&T Flower đang suy nghĩ...</div>
                </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* INPUT FORM */}
      <div className="p-4 bg-[#131314]">
        <div className="max-w-3xl mx-auto bg-[#1e1f20] rounded-full flex items-center p-2 pl-6 pr-2 border border-transparent focus-within:border-gray-600 transition-all shadow-lg">
            <button className="p-2 bg-[#2c2d2e] rounded-full text-gray-400 hover:text-white hover:bg-gray-600 transition mr-3"><Plus size={20} /></button>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                placeholder="Hỏi T&T Flower về các mẫu hoa..."
                className="flex-1 bg-transparent focus:outline-none text-white placeholder-gray-500"
                disabled={isLoading}
            />
            <div className="flex items-center gap-1">
                <button className="p-2 text-gray-400 hover:text-white transition"><ImageIcon size={20}/></button>
                <button className="p-2 text-gray-400 hover:text-white transition"><Mic size={20}/></button>
                {input.trim() && (
                    <button onClick={() => handleSend(input)} className="p-2 bg-white text-black rounded-full hover:bg-gray-200 transition ml-2">
                        <Send size={18} />
                    </button>
                )}
            </div>
        </div>
        <p className="text-center text-[10px] text-gray-600 mt-3 uppercase tracking-widest">
            AI-Powered System • Shop Hoa T&T 2026
        </p>
      </div>
    </div>
  );
}