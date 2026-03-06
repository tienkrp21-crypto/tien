'use client';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 🔥 SỬA 1: Dùng đúng tên trường của Backend (topic, content, type)
  const [formData, setFormData] = useState({
    topic: '',      // Thay cho subject
    content: '',    // Thay cho answer
    type: 'What'    // Thay cho category
  });

  const fetchKnowledge = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/knowledge');
      const data = await res.json();
      console.log("Data loaded:", data); // Debug xem dữ liệu về chưa
      setKnowledgeList(data);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    }
  };

  useEffect(() => { fetchKnowledge(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId 
      ? `http://localhost:8000/api/admin/knowledge/${editingId}` 
      : 'http://localhost:8000/api/admin/knowledge';
    
    const method = editingId ? 'PUT' : 'POST';

    // 🔥 SỬA 2: Gửi đúng cấu trúc JSON mà Backend (Mongoose) hiểu
    const payload = {
      topic: formData.topic,     // Map Chủ thể -> topic
      content: formData.content, // Map Câu trả lời -> content
      type: formData.type        // Map Ngữ cảnh -> type
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(editingId ? "Cập nhật thành công!" : "Thêm mới thành công!");
        setFormData({ topic: '', content: '', type: 'What' });
        setEditingId(null);
        fetchKnowledge();
      } else {
        alert("Lỗi khi lưu dữ liệu!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item._id);
    // 🔥 SỬA 3: Map dữ liệu từ DB vào Form khi bấm Sửa
    setFormData({
      topic: item.topic,
      content: item.content,
      type: item.type
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa không?")) {
      const res = await fetch(`http://localhost:8000/api/admin/knowledge/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert("Đã xóa thành công!");
        fetchKnowledge();
      }
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Hệ thống Quản trị Tri thức</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg mb-10 border border-blue-100">
        <h2 className="text-lg font-semibold mb-4 text-blue-600">
          {editingId ? " đang chỉnh sửa kiến thức" : " thêm kiến thức mới"}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {/* 🔥 SỬA 4: Tạm thời bỏ ô "Câu hỏi mẫu" vì DB chưa có trường này, dồn vào Topic */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Chủ thể / Câu hỏi (Topic)</label>
            <input 
              type="text" 
              placeholder="VD: Ý nghĩa hoa hồng đỏ..."
              className="w-full border p-2 rounded mt-1" 
              value={formData.topic} 
              onChange={(e) => setFormData({...formData, topic: e.target.value})} 
              required 
            />
          </div>
          
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Ngữ cảnh (Type/Category)</label>
            <select 
              className="w-full border p-2 rounded mt-1" 
              value={formData.type} 
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="policy">Chính sách (Policy)</option>
              <option value="meaning">Ý nghĩa (Meaning)</option>
              <option value="care">Chăm sóc (Care)</option>
              <option value="origin">Nguồn gốc (Origin)</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Câu trả lời chuẩn (Content)</label>
            <textarea 
              className="w-full border p-2 rounded mt-1" 
              rows={3} 
              value={formData.content} 
              onChange={(e) => setFormData({...formData, content: e.target.value})} 
              required 
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            {editingId ? "Lưu thay đổi" : "Lưu kiến thức"}
          </button>
          {editingId && (
            <button type="button" onClick={() => {setEditingId(null); setFormData({topic:'', content:'', type:'policy'})}} className="bg-gray-400 text-white px-6 py-2 rounded-lg">Hủy</button>
          )}
        </div>
      </form>

      <div className="bg-white shadow-xl rounded-xl overflow-hidden border">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-4">Chủ thể (Topic)</th>
              <th className="p-4">Ngữ cảnh (Type)</th>
              <th className="p-4">Nội dung trả lời (Content)</th>
              <th className="p-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {knowledgeList.map((item: any) => (
              <tr key={item._id} className="border-b hover:bg-gray-50 transition">
                {/* 🔥 SỬA 5: Hiển thị đúng trường dữ liệu topic, type, content */}
                <td className="p-4 font-bold text-blue-600">{item.topic}</td>
                <td className="p-4">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold uppercase">
                    {item.type}
                  </span>
                </td>
                <td className="p-4 text-gray-600 text-sm max-w-xs truncate">{item.content}</td>
                <td className="p-4">
                  <div className="flex justify-center gap-3">
                    <button onClick={() => handleEdit(item)} className="text-yellow-600 hover:text-yellow-800 font-medium">Sửa</button>
                    <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-800 font-medium">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}