/**
 * Image Processing and Compression Utilities
 * Task T117: Implement image compression for pet photo uploads
 */

import { manipulateAsync, SaveFormat, ImageResult } from 'expo-image-manipulator';
import { FEATURES } from '../config/api';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: 'jpeg' | 'png';
  maintainAspectRatio?: boolean;
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
  size: number; // estimated size in bytes
  format: string;
  thumbnail?: ProcessedImage;
}

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  size?: number;
  dimensions?: { width: number; height: number };
}

export class ImageProcessor {
  private readonly defaultOptions: Required<Omit<ImageProcessingOptions, 'thumbnail' | 'generateThumbnail'>> & {
    generateThumbnail: boolean;
    thumbnailSize: number;
  };

  constructor() {
    this.defaultOptions = {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.8,
      format: 'jpeg',
      maintainAspectRatio: true,
      generateThumbnail: true,
      thumbnailSize: 300,
    };
  }

  /**
   * Process and compress image
   */
  async processImage(
    uri: string,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    const config = { ...this.defaultOptions, ...options };

    try {
      // Get original image info
      const originalImage = await this.getImageInfo(uri);

      // Calculate target dimensions
      const targetDimensions = this.calculateTargetDimensions(
        originalImage.width,
        originalImage.height,
        config.maxWidth,
        config.maxHeight,
        config.maintainAspectRatio
      );

      // Process main image
      const processedResult = await manipulateAsync(
        uri,
        [
          {
            resize: targetDimensions,
          },
        ],
        {
          compress: config.quality,
          format: config.format === 'jpeg' ? SaveFormat.JPEG : SaveFormat.PNG,
        }
      );

      const processedImage: ProcessedImage = {
        uri: processedResult.uri,
        width: processedResult.width,
        height: processedResult.height,
        size: await this.estimateFileSize(processedResult.uri),
        format: config.format,
      };

      // Generate thumbnail if requested
      if (config.generateThumbnail) {
        const thumbnailDimensions = this.calculateThumbnailDimensions(
          originalImage.width,
          originalImage.height,
          config.thumbnailSize
        );

        const thumbnailResult = await manipulateAsync(
          uri,
          [
            {
              resize: thumbnailDimensions,
            },
          ],
          {
            compress: 0.7, // Slightly lower quality for thumbnails
            format: SaveFormat.JPEG, // Always use JPEG for thumbnails
          }
        );

        processedImage.thumbnail = {
          uri: thumbnailResult.uri,
          width: thumbnailResult.width,
          height: thumbnailResult.height,
          size: await this.estimateFileSize(thumbnailResult.uri),
          format: 'jpeg',
        };
      }

      return processedImage;

    } catch (error) {
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate image before processing
   */
  async validateImage(uri: string): Promise<ImageValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get image info
      const imageInfo = await this.getImageInfo(uri);
      const estimatedSize = await this.estimateFileSize(uri);

      // Check file size
      const maxSizeBytes = FEATURES.MAX_PHOTO_SIZE_MB * 1024 * 1024;
      if (estimatedSize > maxSizeBytes) {
        errors.push(`Image is too large (${(estimatedSize / 1024 / 1024).toFixed(1)}MB). Maximum size is ${FEATURES.MAX_PHOTO_SIZE_MB}MB`);
      }

      // Check dimensions
      const minDimension = 100;
      const maxDimension = 4096;

      if (imageInfo.width < minDimension || imageInfo.height < minDimension) {
        errors.push(`Image is too small (${imageInfo.width}x${imageInfo.height}). Minimum size is ${minDimension}x${minDimension}`);
      }

      if (imageInfo.width > maxDimension || imageInfo.height > maxDimension) {
        warnings.push(`Image is very large (${imageInfo.width}x${imageInfo.height}). It will be resized for upload`);
      }

      // Check aspect ratio
      const aspectRatio = imageInfo.width / imageInfo.height;
      if (aspectRatio > 3 || aspectRatio < 0.33) {
        warnings.push('Unusual aspect ratio detected. Image might appear distorted');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        size: estimatedSize,
        dimensions: { width: imageInfo.width, height: imageInfo.height },
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to validate image: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
      };
    }
  }

  /**
   * Batch process multiple images
   */
  async processImages(
    uris: string[],
    options: ImageProcessingOptions = {}
  ): Promise<{
    processed: ProcessedImage[];
    failed: Array<{ uri: string; error: string }>;
  }> {
    const processed: ProcessedImage[] = [];
    const failed: Array<{ uri: string; error: string }> = [];

    for (const uri of uris) {
      try {
        const result = await this.processImage(uri, options);
        processed.push(result);
      } catch (error) {
        failed.push({
          uri,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { processed, failed };
  }

  /**
   * Create multiple sizes of an image
   */
  async createImageSizes(
    uri: string,
    sizes: Array<{ name: string; maxWidth: number; maxHeight: number; quality?: number }>
  ): Promise<Record<string, ProcessedImage>> {
    const results: Record<string, ProcessedImage> = {};

    for (const sizeConfig of sizes) {
      try {
        const processed = await this.processImage(uri, {
          maxWidth: sizeConfig.maxWidth,
          maxHeight: sizeConfig.maxHeight,
          quality: sizeConfig.quality || 0.8,
          generateThumbnail: false,
        });

        results[sizeConfig.name] = processed;
      } catch (error) {
        console.warn(`Failed to create ${sizeConfig.name} size:`, error);
      }
    }

    return results;
  }

  /**
   * Optimize image for upload
   */
  async optimizeForUpload(uri: string): Promise<ProcessedImage> {
    // Use settings optimized for upload
    return this.processImage(uri, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.85,
      format: 'jpeg',
      generateThumbnail: true,
      thumbnailSize: 300,
    });
  }

  /**
   * Create avatar-sized image
   */
  async createAvatar(uri: string): Promise<ProcessedImage> {
    return this.processImage(uri, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.9,
      format: 'jpeg',
      generateThumbnail: true,
      thumbnailSize: 100,
    });
  }

  // Private helper methods

  private async getImageInfo(uri: string): Promise<ImageResult> {
    try {
      // For local files, we can use manipulateAsync with empty actions to get info
      return await manipulateAsync(uri, [], { format: SaveFormat.JPEG });
    } catch (error) {
      throw new Error(`Failed to get image info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateTargetDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    maintainAspectRatio: boolean
  ): { width: number; height: number } {
    if (!maintainAspectRatio) {
      return { width: maxWidth, height: maxHeight };
    }

    const aspectRatio = originalWidth / originalHeight;

    // If image is already smaller than max dimensions, keep original size
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    // Calculate new dimensions maintaining aspect ratio
    let newWidth = maxWidth;
    let newHeight = maxWidth / aspectRatio;

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = maxHeight * aspectRatio;
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  }

  private calculateThumbnailDimensions(
    originalWidth: number,
    originalHeight: number,
    thumbnailSize: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    if (aspectRatio >= 1) {
      // Landscape or square
      return {
        width: thumbnailSize,
        height: Math.round(thumbnailSize / aspectRatio),
      };
    } else {
      // Portrait
      return {
        width: Math.round(thumbnailSize * aspectRatio),
        height: thumbnailSize,
      };
    }
  }

  private async estimateFileSize(uri: string): Promise<number> {
    // This is an estimation - in React Native, getting exact file size
    // requires native modules or file system operations
    try {
      // For now, we'll provide a rough estimation based on typical compression
      // In production, you might want to implement native file size detection
      return 0; // Placeholder
    } catch (error) {
      return 0;
    }
  }
}

// Utility functions

/**
 * Quick image compression for common use cases
 */
export const quickCompress = async (uri: string, quality: number = 0.8): Promise<string> => {
  const processor = new ImageProcessor();
  const result = await processor.processImage(uri, { quality });
  return result.uri;
};

/**
 * Create thumbnail from image
 */
export const createThumbnail = async (uri: string, size: number = 300): Promise<string> => {
  const processor = new ImageProcessor();
  const result = await processor.processImage(uri, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    generateThumbnail: false,
  });
  return result.uri;
};

/**
 * Standard pet photo processing
 */
export const processPetPhoto = async (uri: string): Promise<ProcessedImage> => {
  const processor = new ImageProcessor();

  // Validate first
  const validation = await processor.validateImage(uri);
  if (!validation.isValid) {
    throw new Error(`Invalid image: ${validation.errors.join(', ')}`);
  }

  // Log warnings
  if (validation.warnings.length > 0) {
    console.warn('Image processing warnings:', validation.warnings);
  }

  // Process with pet-specific settings
  return processor.optimizeForUpload(uri);
};

// Predefined size configurations
export const IMAGE_SIZES = {
  THUMBNAIL: { name: 'thumbnail', maxWidth: 300, maxHeight: 300, quality: 0.7 },
  MEDIUM: { name: 'medium', maxWidth: 800, maxHeight: 800, quality: 0.8 },
  LARGE: { name: 'large', maxWidth: 1920, maxHeight: 1920, quality: 0.85 },
  AVATAR: { name: 'avatar', maxWidth: 400, maxHeight: 400, quality: 0.9 },
} as const;

// Export default processor instance
export const imageProcessor = new ImageProcessor();
export default imageProcessor;