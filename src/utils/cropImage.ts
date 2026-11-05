export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 載入圖片物件
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

/**
 * 將 Canvas 轉換為 Blob
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas 轉換圖檔失敗'));
        }
      },
      type,
      quality
    );
  });
}

/**
 * 依據裁切區域將圖片繪製到正方形 Canvas，並轉換為 image/webp (預設品質 0.85)
 * 自動調整尺寸與壓縮品質，確保單張圖檔控制在 50KB (51,200 bytes) 以內以節省流量
 */
export async function getCroppedWebpBlob(
  imageSrc: string,
  pixelCrop: PixelCrop,
  maxBytes = 50 * 1024
): Promise<{ blob: Blob; previewUrl: string; width: number; sizeKB: number }> {
  const image = await createImage(imageSrc);

  // 預設最高輸出邊長 600px（對單字書法字帖極為清晰，且容易控制在 15~35KB 內）
  let targetSize = Math.min(600, Math.max(240, Math.round(pixelCrop.width)));
  let quality = 0.85;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('無法取得 2D Canvas Context');
  }

  let blob: Blob;

  // 若首次轉換超過 50KB，自動微調尺寸與品質直到符合 < 50KB 規範
  while (true) {
    canvas.width = targetSize;
    canvas.height = targetSize;

    // 鋪設宣紙白底，防止透明圖層變黑
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetSize, targetSize);

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetSize,
      targetSize
    );

    blob = await canvasToBlob(canvas, 'image/webp', quality);

    if (blob.size <= maxBytes || (targetSize <= 240 && quality <= 0.5)) {
      break;
    }

    if (quality > 0.65) {
      quality = Number((quality - 0.1).toFixed(2));
    } else {
      targetSize = Math.max(240, Math.round(targetSize * 0.8));
    }
  }

  const previewUrl = URL.createObjectURL(blob);
  const sizeKB = Number((blob.size / 1024).toFixed(1));

  return {
    blob,
    previewUrl,
    width: targetSize,
    sizeKB,
  };
}
