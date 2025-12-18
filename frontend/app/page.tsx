"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";

export default function Home() {
  // --- 1. LOGIC (Giữ nguyên logic cũ) ---
  const [messages, setMessages] = useState([
    { role: "bot", content: "Xin chào! Mình là AI của T&T Studio. Bạn cần giúp gì?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("https://tien-596a.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      if (!res.ok) throw new Error("Lỗi Server");
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", content: "⚠️ Mất kết nối server!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. STYLE CONFIG (Tách class ra đây cho gọn code) ---
  const styles = {
    // Khung bao ngoài cùng
    container: "flex flex-col h-screen bg-[#f8f9fa] font-sans text-gray-800",
    
    // Header
    header: "bg-white/90 backdrop-blur shadow-sm p-4 sticky top-0 z-20 border-b flex justify-center",
    brand: "flex items-center gap-2 text-lg font-bold text-blue-600",
    
    // Khu vực chat (Giới hạn chiều rộng max-w-2xl để nhìn chuyên nghiệp hơn)
    chatArea: "flex-1 overflow-y-auto p-4 space-y-6 max-w-2xl mx-auto w-full scroll-smooth",
    
    // Tin nhắn
    msgRow: "flex w-full",
    userMsg: "justify-end",
    botMsg: "justify-start",
    
    // Bong bóng chat
    bubble: "max-w-[85%] px-5 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap",
    userBubble: "bg-blue-600 text-white rounded-br-none",
    botBubble: "bg-white border border-gray-200 text-gray-800 rounded-bl-none",
    
    // Ô nhập liệu
    inputWrapper: "p-4 bg-white border-t sticky bottom-0",
    inputBox: "max-w-2xl mx-auto relative flex items-center",
    inputField: "w-full p-4 pr-14 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all",
    sendBtn: "absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all disabled:opacity-50",
  };

  // --- 3. GIAO DIỆN (Giờ nhìn rất ngắn gọn) ---
  return (
    <div className={styles.container}>
      
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.brand}>
          <Sparkles className="w-6 h-6" />
          <span>Trần Tiến</span>
        </div>
      </div>

      {/* CHAT LIST */}
      <div className={styles.chatArea}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles.msgRow} ${msg.role === "user" ? styles.userMsg : styles.botMsg}`}>
            
            {/* Avatar Bot (Chỉ hiện cho Bot) */}
            {msg.role === "bot" && (
              <div className="w-8 h-8 mr-2 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            )}

            {/* Nội dung tin nhắn */}
            <div className={`${styles.bubble} ${msg.role === "user" ? styles.userBubble : styles.botBubble}`}>
              {msg.content}
            </div>

            {/* Avatar User (Chỉ hiện cho User) */}
            {msg.role === "user" && (
              <div className="w-8 h-8 ml-2 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm ml-10">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className={styles.inputWrapper}>
        <div className={styles.inputBox}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Nhập câu hỏi..."
            className={styles.inputField}
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={!input.trim()} className={styles.sendBtn}>
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          AI hỗ trợ trả lời tự động cho T&T Studio
        </p>
      </div>

    </div>
  );
}