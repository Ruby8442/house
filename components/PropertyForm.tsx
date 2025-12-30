
import React, { useState, useRef } from 'react';
import { Property } from '../types';
import { extractPropertyFromImage } from '../services/geminiService';

interface PropertyFormProps {
  onAdd: (property: Omit<Property, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onAdd, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    type: '2房2廳',
    price: '',
    households: '',
    floor: '',
    deed: '',
    indoor: '',
    balcony: '',
    car: '平面' as '無' | '平面' | '機械',
    bike: '室內' as '無' | '戶外' | '室內'
  });

  const [isCapturing, setIsCapturing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("無法開啟相機，請檢查權限設定。");
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsCapturing(false);
  };

  const captureAndExtract = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    stopCamera();
    
    setIsExtracting(true);
    try {
      const extracted = await extractPropertyFromImage(base64Data);
      if (extracted) {
        setFormData(prev => ({
          ...prev,
          name: extracted.name || prev.name,
          area: extracted.area || prev.area,
          type: extracted.type || prev.type,
          price: extracted.price?.toString() || prev.price,
          households: extracted.households?.toString() || prev.households,
          floor: extracted.floor || prev.floor,
          deed: extracted.deed?.toString() || prev.deed,
          indoor: extracted.indoor?.toString() || prev.indoor,
          balcony: extracted.balcony?.toString() || prev.balcony,
          car: extracted.car || prev.car,
          bike: extracted.bike || prev.bike,
        }));
      }
    } catch (err) {
      alert("AI 辨識失敗，請手動輸入。");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.deed) {
      alert("請至少填寫名稱、總價與坪數");
      return;
    }
    onAdd({
      name: formData.name,
      area: formData.area,
      type: formData.type,
      price: Number(formData.price),
      households: Number(formData.households),
      floor: formData.floor,
      deed: Number(formData.deed),
      indoor: Number(formData.indoor),
      balcony: Number(formData.balcony),
      car: formData.car,
      bike: formData.bike
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-4 pb-20">
      {/* AI Extraction UI */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <i className="fas fa-magic"></i> AI 拍照快速輸入
          </h2>
          <p className="text-blue-100 text-sm mb-4">拍攝格局圖或宣傳單，AI 自動為您填寫資料。</p>
          <button 
            type="button"
            onClick={startCamera}
            className="bg-white text-blue-600 px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors"
          >
            <i className="fas fa-camera"></i> 開始拍照辨識
          </button>
        </div>
        <div className="absolute top-[-20px] right-[-20px] text-white/10 text-8xl rotate-12">
          <i className="fas fa-file-invoice"></i>
        </div>
      </div>

      {isCapturing && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
          <div className="p-8 flex justify-between items-center bg-black/50 backdrop-blur-md">
            <button onClick={stopCamera} className="text-white text-lg">取消</button>
            <button 
              onClick={captureAndExtract} 
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black text-2xl shadow-xl"
            >
              <i className="fas fa-camera"></i>
            </button>
            <div className="w-8"></div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {isExtracting && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-blue-600 font-bold">AI 正在辨識圖片內容...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-800 border-l-4 border-blue-500 pl-3">基本資訊</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">建案名稱</label>
              <input name="name" value={formData.name} onChange={handleChange} placeholder="例如：晴天名邸" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">區域</label>
              <input name="area" value={formData.area} onChange={handleChange} placeholder="例如：竹北市" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">格局 (型態)</label>
              <input name="type" value={formData.type} onChange={handleChange} placeholder="例如：3房2廳2衛" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">總價 (萬)</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="例如：1500" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-800 border-l-4 border-blue-500 pl-3">空間與細節</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">權狀坪數</label>
              <input type="number" step="0.01" name="deed" value={formData.deed} onChange={handleChange} placeholder="坪" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">室內實坪</label>
              <input type="number" step="0.01" name="indoor" value={formData.indoor} onChange={handleChange} placeholder="坪" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">陽台坪數</label>
              <input type="number" step="0.01" name="balcony" value={formData.balcony} onChange={handleChange} placeholder="坪" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">總戶數</label>
              <input type="number" name="households" value={formData.households} onChange={handleChange} placeholder="戶" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">所在樓層</label>
              <input name="floor" value={formData.floor} onChange={handleChange} placeholder="例如：8F/15F" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-800 border-l-4 border-blue-500 pl-3">設施與其他</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">汽車位</label>
              <select name="car" value={formData.car} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                <option value="無">無</option>
                <option value="平面">平面</option>
                <option value="機械">機械</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">機車位</label>
              <select name="bike" value={formData.bike} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                <option value="無">無</option>
                <option value="戶外">戶外</option>
                <option value="室內">室內</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-4 sticky bottom-20 p-4 bg-gray-50 rounded-xl">
          <button type="button" onClick={onCancel} className="flex-1 bg-white border border-gray-300 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors shadow-sm">
            取消
          </button>
          <button type="submit" className="flex-1 bg-blue-600 py-3 rounded-xl font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors">
            儲存建案
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;
