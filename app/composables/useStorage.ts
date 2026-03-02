// composables/useStorage.ts
import type { Database } from "~/types/supabase";

export const useStorage = () => {
  const supabase = useSupabaseClient<Database>();
  const { authUid, profile, updateProfile } = useAuth();
  const ensureAuthUid = async () => {
    if (authUid.value) return authUid.value;
    // Попробуем подождать загрузку профиля (если она идёт)
    const { loadProfile } = useAuth();
    await loadProfile(); // дождёмся
    if (!authUid.value) throw new Error("Не удалось получить авторизацию");
    return authUid.value;
  };

  /**
   * Оптимизация изображения на клиенте
   */
  const optimizeImage = async (
    file: File,
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: "image/jpeg" | "image/webp";
    },
  ): Promise<File> => {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.85,
      format = "image/jpeg",
    } = options || {};

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimized = new File([blob], file.name, {
                type: format,
                lastModified: Date.now(),
              });
              resolve(optimized);
            } else {
              reject(new Error("Не удалось оптимизировать изображение"));
            }
          },
          format,
          quality,
        );
      };
      img.onerror = reject;
    });
  };

  /**
   * Загрузка файла в бакет
   */
  const uploadFile = async (
    bucket: "avatars" | "posts" | "temp" | "comments" | "community-avatars",
    file: File,
    folder: string,
    options?: { upsert?: boolean; cacheControl?: string; optimize?: boolean },
  ) => {
    if (!authUid.value) throw new Error("Требуется авторизация");

    let fileToUpload = file;
    if (options?.optimize && file.type.startsWith("image/")) {
      fileToUpload = await optimizeImage(file);
    }

    const ext = fileToUpload.name.split(".").pop() || "jpg";
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
    const filePath = fileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileToUpload, {
        cacheControl: options?.cacheControl || "3600",
        upsert: options?.upsert || false,
        contentType: fileToUpload.type,
      });

    if (error) throw error;
    return data;
  };

  /**
   * Получить публичный URL (только для public bucket)
   */
  const getPublicUrl = (bucket: string, path: string): string => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  /**
   * Получить подписанный URL (для приватных файлов)
   */
  const getSignedUrl = async (
    bucket: string,
    path: string,
    expiresIn = 60, // секунд
  ): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  };

  /**
   * Удалить файл
   */
  const deleteFile = async (bucket: string, paths: string | string[]) => {
    const pathsArray = Array.isArray(paths) ? paths : [paths];
    const { error } = await supabase.storage.from(bucket).remove(pathsArray);
    if (error) throw error;
  };

  /**
   * Скачать файл
   */
  const downloadFile = async (bucket: string, path: string): Promise<Blob> => {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error) throw error;
    return data;
  };

  /**
   * ========================================
   * СПЕЦИАЛИЗИРОВАННЫЕ МЕТОДЫ ДЛЯ АВАТАРОК
   * ========================================
   */

  /**
   * Загрузить аватарку (автоматически связывает с профилем)
   */
  const uploadAvatar = async (file: File) => {
    const uid = await ensureAuthUid();
    if (!profile.value) throw new Error("Профиль не загружен");

    // 1. Оптимизируем до 500x500
    if (profile.value.avatar) {
      try {
        const oldPath = extractPathFromUrl(profile.value.avatar, "avatars");
        if (oldPath) {
          await deleteFile("avatars", oldPath);
        }
      } catch (e) {
        console.warn("Не удалось удалить старую аватарку:", e);
      }
    }
    const optimized = await optimizeImage(file, {
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.85,
      format: "image/jpeg",
    });

    // 2. Загрузка
    const data = await uploadFile("avatars", optimized, uid, {
      upsert: true,
      optimize: false,
    });

    // 3. Публичный URL (теперь работает, т.к. бакет публичный)
    const publicUrl = getPublicUrl("avatars", data.path);

    // 4. Обновление профиля
    await updateProfile({ avatar: publicUrl });

    return { path: data.path, url: publicUrl };
  };

  /**
   * Удалить аватарку
   */
  const deleteAvatar = async () => {
    if (!profile.value?.avatar) return;

    // Извлекаем путь из URL
    const url = profile.value.avatar;
    const path = extractPathFromUrl(url, "avatars");
    if (path) {
      await deleteFile("avatars", path);
    }

    // Очищаем поле avatar в профиле
    await updateProfile({ avatar: null });
  };

  /**
   * ========================================
   * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
   * ========================================
   */

  /**
   * Извлечь путь из публичного URL
   */
  const extractPathFromUrl = (url: string, bucket: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const bucketIndex = pathParts.indexOf(bucket);
      if (bucketIndex !== -1 && bucketIndex + 1 < pathParts.length) {
        return pathParts.slice(bucketIndex + 1).join("/");
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  return {
    // Базовые методы
    uploadFile,
    getPublicUrl,
    getSignedUrl,
    deleteFile,
    downloadFile,
    optimizeImage,

    // Специализированные методы для аватарок
    uploadAvatar,
    deleteAvatar,

    // Утилиты
    extractPathFromUrl,
  };
};
