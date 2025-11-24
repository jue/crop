import React, { useState, useCallback } from 'react';
import { GridConfig, ProcessingStatus } from './types';
import { processAndZipImage } from './services/imageService';
import GridPreview from './components/GridPreview';
import ControlPanel from './components/ControlPanel';
import { ScanFace, Languages } from 'lucide-react';

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    title: 'Sticker Grid Slicer',
    subtitle: 'Crop expression packs into individual stickers instantly',
    uploadTitle: '1. Upload Image',
    imageLoaded: 'Image Loaded',
    clickToChange: 'Click to change',
    clickToUpload: 'Click to upload',
    formats: 'PNG, JPG, WEBP',
    gridSettings: '2. Grid Settings',
    columns: 'Columns (X)',
    rows: 'Rows (Y)',
    default4x6: 'Default 4x6',
    preset3x3: '3x3',
    processing: 'Processing...',
    working: 'Working...',
    sliceDownload: 'Slice & Download ZIP',
    privacy: 'All processing happens in your browser. Your images are never uploaded to a server.',
    noImage: 'No Image Selected',
    uploadToPreview: 'Upload an image to see the grid preview',
    previewInfo: 'Preview showing {cols} columns x {rows} rows',
    step1Title: '1. Choose Image',
    step1Desc: 'Select your large meme or sticker sheet (usually a large JPG or PNG).',
    step2Title: '2. Adjust Grid',
    step2Desc: 'Set columns and rows. Standard WeChat/Telegram packs are often 4x6.',
    step3Title: '3. Download',
    step3Desc: 'Get a ZIP file containing all your cropped individual images.',
    error: 'An error occurred while processing the image.'
  },
  zh: {
    title: '表情包切图工具',
    subtitle: '快速将表情包大图裁剪成独立的表情图片',
    uploadTitle: '1. 上传图片',
    imageLoaded: '图片已加载',
    clickToChange: '点击更换',
    clickToUpload: '点击上传',
    formats: '支持 PNG, JPG, WEBP',
    gridSettings: '2. 网格设置',
    columns: '列数 (X)',
    rows: '行数 (Y)',
    default4x6: '默认 4x6',
    preset3x3: '3x3',
    processing: '处理中...',
    working: '处理中...',
    sliceDownload: '切图并下载 ZIP',
    privacy: '所有处理均在浏览器本地完成。您的图片不会上传到服务器。',
    noImage: '未选择图片',
    uploadToPreview: '上传图片以预览网格',
    previewInfo: '预览显示 {cols} 列 x {rows} 行',
    step1Title: '1. 选择图片',
    step1Desc: '选择您的大图表情包（通常是大尺寸的 JPG 或 PNG）。',
    step2Title: '2. 调整网格',
    step2Desc: '设置列数和行数。微信/Telegram 表情包通常是 4x6。',
    step3Title: '3. 下载',
    step3Desc: '获取包含所有裁剪后独立图片的 ZIP 文件。',
    error: '处理图片时发生错误。'
  }
};

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState<GridConfig>({ rows: 4, cols: 6 });
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState<Language>('zh');

  const t = translations[language];

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setStatus('idle');
    setProgress(0);
  }, []);

  const handleProcess = useCallback(async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setProgress(0);
      
      // Small delay to let UI render the processing state
      await new Promise(resolve => setTimeout(resolve, 100));

      await processAndZipImage(file, config, (pct) => {
        setProgress(pct);
        if (pct > 50) setStatus('zipping');
      });

      setStatus('done');
      setProgress(100);
      
      // Reset status after a delay so user sees "Done"
      setTimeout(() => setStatus('idle'), 2000);

    } catch (error) {
      console.error(error);
      setStatus('error');
      alert(t.error);
    }
  }, [file, config, t]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 text-white">
              <ScanFace size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.title}</h1>
              <p className="text-slate-500 text-sm">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Languages size={16} />
              {language === 'en' ? '中文' : 'English'}
            </button>
            <div className="hidden md:block">
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-500">
                v1.0.0
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Panel: Controls */}
          <div className="lg:col-span-4 order-2 lg:order-1 h-auto lg:h-[calc(100vh-12rem)] lg:min-h-[500px]">
             <ControlPanel 
                onFileSelect={handleFileSelect}
                config={config}
                onConfigChange={setConfig}
                onProcess={handleProcess}
                status={status}
                hasFile={!!file}
                progress={progress}
                t={t}
             />
          </div>

          {/* Right Panel: Preview */}
          <div className="lg:col-span-8 order-1 lg:order-2">
             <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[400px] flex items-center justify-center">
                <GridPreview file={file} config={config} t={t} />
             </div>
             
             {/* Instructions */}
             <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-blue-600 font-bold mb-1">{t.step1Title}</div>
                  <p className="text-sm text-slate-500">{t.step1Desc}</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-blue-600 font-bold mb-1">{t.step2Title}</div>
                  <p className="text-sm text-slate-500">{t.step2Desc}</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-blue-600 font-bold mb-1">{t.step3Title}</div>
                  <p className="text-sm text-slate-500">{t.step3Desc}</p>
                </div>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default App;
