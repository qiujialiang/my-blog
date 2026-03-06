/**
 * 图片优化工具函数
 * 提供统一的图片处理配置
 */

export interface ImageConfig {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  widths?: number[];
  format?: 'avif' | 'webp' | 'png' | 'jpeg';
  quality?: number;
  loading?: 'eager' | 'lazy';
  className?: string;
}

// 默认图片尺寸配置
export const defaultWidths = [400, 800, 1200, 1600];

// 默认图片格式优先级
export const defaultFormats = ['avif', 'webp', 'jpeg'];

// 生成图片alt文本
export const generateAlt = (title: string, context?: string): string => {
  return context ? `${title} - ${context}` : title;
};

// 验证图片路径
export const isValidImage = (src: string): boolean => {
  if (!src) return false;
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'];
  return validExtensions.some(ext => src.toLowerCase().includes(ext));
};
