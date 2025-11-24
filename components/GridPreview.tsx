import React, { useRef, useState, useEffect } from 'react';
import { GridConfig } from '../types';

interface GridPreviewProps {
  file: File | null;
  config: GridConfig;
  t: any;
}

const GridPreview: React.FC<GridPreviewProps> = ({ file, config, t }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageUrl(null);
    }
  }, [file]);

  if (!imageUrl) {
    return (
      <div className="w-full h-96 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="text-lg font-medium">{t.noImage}</p>
          <p className="text-sm">{t.uploadToPreview}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div 
        ref={containerRef}
        className="relative overflow-hidden shadow-lg rounded-lg border border-slate-200 bg-white"
        style={{ maxWidth: '100%' }}
      >
        {/* The Image */}
        <img 
          src={imageUrl} 
          alt="Preview" 
          className="block w-full h-auto max-h-[70vh] object-contain"
        />

        {/* The Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Vertical Lines (Columns) */}
          {Array.from({ length: config.cols - 1 }).map((_, i) => (
            <div
              key={`col-${i}`}
              className="absolute top-0 bottom-0 border-l border-white/50 shadow-[1px_0_0_0_rgba(0,0,0,0.3)]"
              style={{ left: `${(100 / config.cols) * (i + 1)}%` }}
            />
          ))}

          {/* Horizontal Lines (Rows) */}
          {Array.from({ length: config.rows - 1 }).map((_, i) => (
            <div
              key={`row-${i}`}
              className="absolute left-0 right-0 border-t border-white/50 shadow-[0_1px_0_0_rgba(0,0,0,0.3)]"
              style={{ top: `${(100 / config.rows) * (i + 1)}%` }}
            />
          ))}
          
          {/* Numbers overlay (optional, for verification) */}
          <div className="absolute inset-0 grid" style={{
            gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
            gridTemplateRows: `repeat(${config.rows}, 1fr)`
          }}>
             {Array.from({ length: config.rows * config.cols }).map((_, i) => (
               <div key={i} className="flex items-center justify-center">
                  <span className="text-[10px] text-white/80 bg-black/30 px-1 rounded-sm backdrop-blur-sm">
                    {i + 1}
                  </span>
               </div>
             ))}
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {t.previewInfo.replace('{cols}', config.cols).replace('{rows}', config.rows)}
      </p>
    </div>
  );
};

export default GridPreview;
