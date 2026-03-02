// utils/image.ts
/**
 * Генерирует URL с параметрами трансформации для Supabase Storage
 * @param url - исходный URL изображения
 * @param width - желаемая ширина
 * @param height - желаемая высота (опционально)
 * @param quality - качество (1-100, по умолчанию 80)
 * @returns оптимизированный URL
 */
export const getOptimizedImageUrl = (
  url: string,
  width: number,
  height?: number,
  quality = 80,
): string => {
  if (!url || !url.includes("supabase.co/storage")) return url;

  const separator = url.includes("?") ? "&" : "?";
  const params = [`width=${width}`, `quality=${quality}`];
  if (height) params.push(`height=${height}`);

  return `${url}${separator}${params.join("&")}`;
};

/**
 * Для аватарок (квадратные)
 */
export const getAvatarUrl = (url: string, size = 100) => {
  return getOptimizedImageUrl(url, size, size, 80);
};
