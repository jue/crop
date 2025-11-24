import React from 'react';
import { Upload, Scissors, Download, RefreshCw, FileImage } from 'lucide-react';
import { GridConfig, ProcessingStatus } from '../types';

interface ControlPanelProps {
  onFileSelect: (file: File) => void;
  config: GridConfig;
  onConfigChange: (config: GridConfig) => void;
  onProcess: () => void;
  status: ProcessingStatus;
  hasFile: boolean;
  progress: number;
  t: any;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onFileSelect,
  config,
  onConfigChange,
  onProcess,
  status,
  hasFile,
  progress,
  t
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const isProcessing = status === 'processing' || status === 'zipping';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col gap-8">
      
      {/* 1. Upload Section */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
            <Upload size={18} />
          </div>
          {t.uploadTitle}
        </h2>
        
        <label className={`
          flex flex-col items-center justify-center w-full h-32 
          border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
          ${hasFile ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
        `}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {hasFile ? (
               <>
                <FileImage className="w-8 h-8 text-green-500 mb-2" />
                <p className="text-sm text-green-700 font-medium">{t.imageLoaded}</p>
                <p className="text-xs text-green-600 mt-1">{t.clickToChange}</p>
               </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm text-slate-500"><span className="font-semibold">{t.clickToUpload}</span></p>
                <p className="text-xs text-slate-400 mt-1">{t.formats}</p>
              </>
            )}
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
            disabled={isProcessing}
          />
        </label>
      </section>

      {/* 2. Configuration */}
      <section>
         <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
            <Scissors size={18} />
          </div>
          {t.gridSettings}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.columns}</label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.cols}
              onChange={(e) => onConfigChange({ ...config, cols: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              disabled={isProcessing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.rows}</label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.rows}
              onChange={(e) => onConfigChange({ ...config, rows: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              disabled={isProcessing}
            />
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
           <button 
             onClick={() => onConfigChange({ cols: 4, rows: 6 })}
             className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
           >
             {t.default6x4}
           </button>
           <button 
             onClick={() => onConfigChange({ cols: 3, rows: 3 })}
             className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
           >
             {t.preset3x3}
           </button>
        </div>
      </section>

      {/* 3. Action */}
      <section className="mt-auto">
        {isProcessing && (
           <div className="mb-4">
              <div className="flex justify-between text-xs mb-1 text-slate-600">
                <span>{t.processing}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
           </div>
        )}

        <button
          onClick={onProcess}
          disabled={!hasFile || isProcessing}
          className={`
            w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white shadow-lg
            transition-all transform active:scale-95
            ${!hasFile || isProcessing 
              ? 'bg-slate-300 cursor-not-allowed shadow-none text-slate-500' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30'}
          `}
        >
          {isProcessing ? (
             <RefreshCw className="animate-spin" size={20} />
          ) : (
             <Download size={20} />
          )}
          {isProcessing ? t.working : t.sliceDownload}
        </button>
        
        <p className="text-center text-xs text-slate-400 mt-4">
          {t.privacy}
        </p>
      </section>
    </div>
  );
};

export default ControlPanel;
