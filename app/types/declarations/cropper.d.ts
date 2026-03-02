// types/cropper.d.ts
interface CropperOptions {
  aspectRatio?: number;
  viewMode?: number;
  dragMode?: "crop" | "move" | "none";
  cropBoxMovable?: boolean;
  cropBoxResizable?: boolean;
  background?: boolean;
  // другие опции по необходимости
}

interface Cropper {
  destroy(): void;
  getCroppedCanvas(options?: {
    width?: number;
    height?: number;
    fillColor?: string;
    imageSmoothingQuality?: "low" | "medium" | "high";
  }): HTMLCanvasElement;
}

interface Window {
  Cropper: Cropper;
}
