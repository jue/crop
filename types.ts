export interface GridConfig {
  rows: number;
  cols: number;
}

export interface SliceResult {
  blob: Blob;
  filename: string;
}

export type ProcessingStatus = 'idle' | 'processing' | 'zipping' | 'done' | 'error';
