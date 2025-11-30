
import React, { useState, useRef } from 'react';
import { X, Loader2, ArrowRight, Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { FoodItem } from '../types';
import { analyzeManualEntry } from '../services/geminiService';

interface ManualRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFoods: (foods: FoodItem[]) => void;
  mealName: string;
}

export const ManualRecordModal: React.FC<ManualRecordModalProps> = ({ isOpen, onClose, onAddFoods, mealName }) => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() && !selectedImage) return;
    setLoading(true);
    try {
      // Strip the data:image/jpeg;base64, part for the API if an image exists
      const base64Data = selectedImage ? selectedImage.split(',')[1] : undefined;
      
      const foods = await analyzeManualEntry(input, base64Data);
      onAddFoods(foods);
      setInput('');
      setSelectedImage(null);
      onClose();
    } catch (error) {
      alert("分析失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-gray-800">记录{mealName}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-500" /></button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {/* Image Upload Area */}
          <div className="mb-4">
             <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
             />
             
             {!selectedImage ? (
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50 transition-all gap-2"
                 >
                    <Camera size={32} />
                    <span className="text-xs font-medium">拍照或上传食物图片</span>
                 </button>
             ) : (
                 <div className="relative rounded-xl overflow-hidden border border-gray-200">
                    <img src={selectedImage} alt="Food preview" className="w-full h-48 object-cover" />
                    <button 
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <span className="text-white text-xs flex items-center gap-1">
                            <ImageIcon size={12}/> 已选择图片
                        </span>
                    </div>
                 </div>
             )}
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">描述 (可选补充)</label>
          <textarea
            className="w-full border rounded-xl p-3 h-24 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm"
            placeholder={selectedImage ? "例如：只吃了一半的米饭，肉全吃了..." : "例如：一碗牛肉面，或者 200g 米饭..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-2">
            {selectedImage ? "AI 将结合图片和你的文字描述来估算热量。" : "AI 会自动估算热量和营养素。"}
          </p>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button 
            onClick={handleSubmit}
            disabled={loading || (!input.trim() && !selectedImage)}
            className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>分析并添加 <ArrowRight size={18} /></>}
          </button>
        </div>
      </div>
    </div>
  );
};
