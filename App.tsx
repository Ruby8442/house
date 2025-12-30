
import React, { useState, useEffect, useRef } from 'react';
import { Property, ViewType } from './types';
import PropertyCard from './components/PropertyCard';
import PropertyForm from './components/PropertyForm';
import PropertyCharts from './components/PropertyCharts';
import { getPropertyAdvice, compareProperties, generateSpeech } from './services/geminiService';

const App: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [view, setView] = useState<ViewType>('list');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [activePropertyForAi, setActivePropertyForAi] = useState<Property | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('viewing_butler_properties');
    if (saved) {
      setProperties(JSON.parse(saved));
    }
    return () => {
      stopSpeech();
    };
  }, []);

  const saveToLocal = (data: Property[]) => {
    localStorage.setItem('viewing_butler_properties', JSON.stringify(data));
  };

  const addProperty = (data: Omit<Property, 'id' | 'createdAt'>) => {
    const newProp: Property = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    const updated = [newProp, ...properties];
    setProperties(updated);
    saveToLocal(updated);
    setView('list');
  };

  const deleteProperty = (id: string) => {
    if (confirm('確定要刪除這個建案嗎？')) {
      const updated = properties.filter(p => p.id !== id);
      setProperties(updated);
      saveToLocal(updated);
    }
  };

  const handleAiAnalysis = async (property: Property) => {
    stopSpeech();
    setView('ai');
    setActivePropertyForAi(property);
    setLoading(true);
    setAiResponse(null);
    const result = await getPropertyAdvice(property);
    setAiResponse(result || '無法生成分析');
    setLoading(false);
  };

  const handleComparison = async () => {
    stopSpeech();
    if (properties.length < 2) {
      alert("請至少新增兩個建案以進行比較。");
      return;
    }
    setView('ai');
    setActivePropertyForAi(null);
    setLoading(true);
    setAiResponse(null);
    const result = await compareProperties(properties);
    setAiResponse(result || '無法生成比較報告');
    setLoading(false);
  };

  const decodeAudio = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const playAudio = async (base64Audio: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    const audioData = decodeAudio(base64Audio);
    
    // Decoding raw PCM 16-bit
    const dataInt16 = new Int16Array(audioData.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => setIsSpeaking(false);
    
    stopSpeech();
    audioSourceRef.current = source;
    source.start();
    setIsSpeaking(true);
  };

  const stopSpeech = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    setIsSpeaking(false);
  };

  const handleSpeak = async () => {
    if (isSpeaking) {
      stopSpeech();
      return;
    }
    if (!aiResponse) return;
    
    setLoading(true);
    const audioData = await generateSpeech(aiResponse);
    setLoading(false);
    if (audioData) {
      playAudio(audioData);
    } else {
      alert("語音生成失敗");
    }
  };

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-100 p-4 flex justify-between items-center">
        <h1 className="text-xl font-black text-blue-600 flex items-center gap-2">
          <i className="fas fa-home"></i> 看房管家
        </h1>
        <div className="flex gap-2">
          <button 
            onClick={() => { stopSpeech(); setView('add'); }}
            className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-blue-200 hover:scale-110 transition-transform"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        {view === 'list' && (
          <div className="space-y-4 pb-20">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">建案清單 ({properties.length})</h2>
              {properties.length >= 2 && (
                <button 
                  onClick={handleComparison}
                  className="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <i className="fas fa-balance-scale"></i> AI 綜合評比
                </button>
              )}
            </div>
            {properties.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300 text-2xl">
                  <i className="fas fa-file-contract"></i>
                </div>
                <p className="text-gray-400">目前沒有建案資料，快去新增一個吧！</p>
                <button 
                  onClick={() => setView('add')}
                  className="bg-gray-100 text-gray-600 px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  新增第一個建案
                </button>
              </div>
            ) : (
              properties.map(p => (
                <PropertyCard 
                  key={p.id} 
                  property={p} 
                  onDelete={deleteProperty} 
                  onAnalyze={handleAiAnalysis} 
                />
              ))
            )}
          </div>
        )}

        {view === 'add' && (
          <PropertyForm onAdd={addProperty} onCancel={() => setView('list')} />
        )}

        {view === 'charts' && (
          <PropertyCharts properties={properties} />
        )}

        {view === 'ai' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 pb-20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <i className="fas fa-magic"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">AI 專家分析</h2>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">
                    {activePropertyForAi ? `正在分析：${activePropertyForAi.name}` : '正在進行建案大數據比較'}
                  </p>
                </div>
              </div>
              {aiResponse && !loading && (
                <button 
                  onClick={handleSpeak}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isSpeaking ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-100 text-blue-600'}`}
                >
                  <i className={`fas ${isSpeaking ? 'fa-stop' : 'fa-volume-up'} text-xl`}></i>
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                <p className="text-gray-500 animate-pulse">正在請 AI 房仲專家研讀資料...</p>
              </div>
            ) : (
              <div className="prose prose-blue max-w-none">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {aiResponse}
                </div>
                <button 
                  onClick={() => { stopSpeech(); setView('list'); }}
                  className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  返回清單
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 px-6 py-3 flex justify-around items-center max-w-4xl mx-auto">
        <button 
          onClick={() => { stopSpeech(); setView('list'); }}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'list' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <i className={`fas fa-th-list text-xl`}></i>
          <span className="text-[10px] font-bold">建案列表</span>
        </button>
        <button 
          onClick={() => { stopSpeech(); setView('charts'); }}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'charts' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <i className={`fas fa-chart-pie text-xl`}></i>
          <span className="text-[10px] font-bold">數據分析</span>
        </button>
        <button 
          onClick={() => { stopSpeech(); setView('ai'); }}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'ai' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <i className={`fas fa-robot text-xl`}></i>
          <span className="text-[10px] font-bold">AI 建議</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
