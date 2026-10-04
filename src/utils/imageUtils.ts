/**
 * Utility functions for image upload, resizing, and canvas compression
 * Supports JPG, JPEG, PNG, WEBP.
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  cropToSquare?: boolean;
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  const hasValidExt = /\.(jpe?g|png|webp)$/i.test(fileName);
  const hasValidMime = ALLOWED_IMAGE_TYPES.includes(fileType);

  if (!hasValidExt && !hasValidMime) {
    return {
      valid: false,
      error: 'Please upload a valid image file (JPG, JPEG, PNG, or WEBP).',
    };
  }

  // Max raw file size check: 15MB
  if (file.size > 15 * 1024 * 1024) {
    return {
      valid: false,
      error: 'Image file size is too large (maximum 15MB allowed).',
    };
  }

  return { valid: true };
}

/**
 * Resizes and compresses an image into a high-quality base64 Data URL.
 * Automatically handles square centering/cropping for avatar presentation.
 */
export function compressImageFile(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 360,
    maxHeight = 360,
    quality = 0.88,
    cropToSquare = true,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file.'));
    };

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Invalid image data.'));
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(reader.result as string);
            return;
          }

          let srcX = 0;
          let srcY = 0;
          let srcWidth = img.naturalWidth || img.width;
          let srcHeight = img.naturalHeight || img.height;

          let targetWidth = srcWidth;
          let targetHeight = srcHeight;

          if (cropToSquare) {
            // Center crop to a square aspect ratio
            const minDim = Math.min(srcWidth, srcHeight);
            srcX = (srcWidth - minDim) / 2;
            srcY = (srcHeight - minDim) / 2;
            srcWidth = minDim;
            srcHeight = minDim;

            const finalSize = Math.min(maxWidth, maxHeight, minDim);
            targetWidth = finalSize;
            targetHeight = finalSize;
          } else {
            // Preserve aspect ratio within maxWidth and maxHeight bounds
            const scale = Math.min(1, maxWidth / srcWidth, maxHeight / srcHeight);
            targetWidth = Math.round(srcWidth * scale);
            targetHeight = Math.round(srcHeight * scale);
          }

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          // High quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(
            img,
            srcX,
            srcY,
            srcWidth,
            srcHeight,
            0,
            0,
            targetWidth,
            targetHeight
          );

          // Use WebP if supported, fallback to JPEG
          let outputType = 'image/jpeg';
          if (file.type === 'image/webp') {
            outputType = 'image/webp';
          }

          const compressedDataUrl = canvas.toDataURL(outputType, quality);
          resolve(compressedDataUrl);
        } catch (err) {
          // If canvas processing fails, fallback to raw reader output
          resolve(reader.result as string);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
