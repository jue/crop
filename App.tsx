import React, { useState, useCallback, useEffect } from 'react';
import { GridConfig, ProcessingStatus } from './types';
import { processAndZipImage } from './services/imageService';
import { updateSEOMetadata, getLanguageFromURL, updateLanguageInURL, detectBrowserLanguage } from './services/seoService';
import GridPreview from './components/GridPreview';
import ControlPanel from './components/ControlPanel';
import { ScanFace, ChevronDown } from 'lucide-react';

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
    default6x4: 'Default 6x4',
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
    error: 'An error occurred while processing the image.',
    // SEO metadata
    seo: {
      title: 'Sticker Grid Slicer - Crop Sticker Sheets Instantly',
      description: 'Free online sticker grid slicer tool. Quickly crop large sticker sheets into individual images. Supports custom grids, one-click ZIP download. All processing happens locally in your browser for privacy.',
      keywords: 'sticker slicer,sticker crop,grid slicer,sticker tool,image crop,online slicer,sticker split,meme slicer',
      ogTitle: 'Sticker Grid Slicer - Crop Sticker Sheets Instantly',
      ogDescription: 'Free online sticker grid slicer tool. Quickly crop large sticker sheets into individual images. Supports custom grids, one-click ZIP download.',
      twitterTitle: 'Sticker Grid Slicer - Crop Sticker Sheets Instantly',
      twitterDescription: 'Free online sticker grid slicer tool. Quickly crop large sticker sheets into individual images.',
      schemaName: 'Sticker Grid Slicer',
      schemaDescription: 'Free online sticker grid slicer tool. Quickly crop large sticker sheets into individual images'
    }
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
    default6x4: '默认 6x4',
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
    error: '处理图片时发生错误。',
    // SEO metadata
    seo: {
      title: '表情包切图工具 - 快速裁剪表情包大图 | Sticker Grid Slicer',
      description: '免费在线表情包切图工具,支持将大图表情包快速裁剪成独立的表情图片。支持自定义网格,一键下载ZIP文件。所有处理均在浏览器本地完成,保护您的隐私。',
      keywords: '表情包切图,表情包裁剪,sticker slicer,表情包工具,图片切割,在线切图,表情包分割',
      ogTitle: '表情包切图工具 - 快速裁剪表情包大图',
      ogDescription: '免费在线表情包切图工具,支持将大图表情包快速裁剪成独立的表情图片。支持自定义网格,一键下载ZIP文件。',
      twitterTitle: '表情包切图工具 - 快速裁剪表情包大图',
      twitterDescription: '免费在线表情包切图工具,支持将大图表情包快速裁剪成独立的表情图片。',
      schemaName: 'Sticker Grid Slicer',
      schemaDescription: '免费在线表情包切图工具,支持将大图表情包快速裁剪成独立的表情图片'
    }
  }
};

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState<GridConfig>({ rows: 6, cols: 4 });
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // 初始化语言: URL参数 > 浏览器语言 > 默认中文
  const getInitialLanguage = (): Language => {
    const urlLang = getLanguageFromURL();
    if (urlLang === 'en' || urlLang === 'zh') {
      return urlLang;
    }
    return detectBrowserLanguage();
  };

  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  const t = translations[language];

  // 更新SEO元数据当语言改变时
  useEffect(() => {
    updateSEOMetadata(t.seo, language);
  }, [language, t.seo]);

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
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    updateLanguageInURL(newLang);
    setIsLangDropdownOpen(false);
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    updateLanguageInURL(newLang);
    setIsLangDropdownOpen(false);
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
            <div className="relative">
              <button 
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {language === 'en' ? 'English' : '中文'}
                <ChevronDown size={16} className={`transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => handleLanguageChange('zh')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors rounded-t-lg ${
                      language === 'zh' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600'
                    }`}
                  >
                    中文
                  </button>
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors rounded-b-lg ${
                      language === 'en' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600'
                    }`}
                  >
                    English
                  </button>
                </div>
              )}
            </div>
            <div className="hidden md:block">
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-500">
                v1.0.0
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Panel: Controls */}
          <div className="lg:col-span-4 order-1">
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
          <div className="lg:col-span-8 order-2 flex flex-col gap-6">
             <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex-1 flex items-center justify-center">
                <GridPreview file={file} config={config} t={t} />
             </div>
             
             {/* Instructions */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex justify-center items-center gap-2 text-sm text-slate-500">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <ScanFace size={14} />
            </div>
            <span>© 2025 Sticker Grid Slicer</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
