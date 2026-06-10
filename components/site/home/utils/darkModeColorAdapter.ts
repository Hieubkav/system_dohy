'use client';

import { oklch, formatHex, parse, formatRgb } from 'culori';

/**
 * Chuyển đổi một chuỗi màu đơn lẻ sang tông màu tương thích Dark Mode nếu cần thiết.
 * Giữ nguyên các màu sắc thương hiệu chính (Brand Colors) và chỉ điều chỉnh các màu trung hòa.
 */
export function adaptColorForDarkMode(colorStr: string, isDark: boolean, key = ''): string {
  if (!isDark) return colorStr;
  if (typeof colorStr !== 'string') return colorStr;
  
  const trimmed = colorStr.trim();
  
  // Bỏ qua các CSS variables hoặc màu rỗng/đặc biệt
  if (
    trimmed.startsWith('var(') || 
    trimmed === 'transparent' || 
    trimmed === 'none' || 
    trimmed === 'inherit' ||
    trimmed === ''
  ) {
    return colorStr;
  }
  
  // Xử lý một số từ khóa màu cơ bản trước khi parse
  let normalizedColor = trimmed;
  if (trimmed === 'white') normalizedColor = '#ffffff';
  if (trimmed === 'black') normalizedColor = '#000000';

  try {
    const parsed = parse(normalizedColor);
    if (!parsed) return colorStr;
    
    const color = oklch(parsed);
    if (!color) return colorStr;
    
    const alpha = color.alpha !== undefined ? color.alpha : 1;
    
    // Tăng ngưỡng chroma lên 0.08 để bao quát các tông xám Slate/Blue-grey có sắc độ nhẹ
    const chromaThreshold = 0.08;
    
    const isBackgroundKey = key.toLowerCase().includes('bg') || 
                            key.toLowerCase().includes('surface') || 
                            key.toLowerCase().includes('background');
    
    if ((color.c ?? 0) < chromaThreshold) {
      const l = color.l ?? 0;
      
      // 1. Nền chính cực sáng (L > 0.95) -> Nền tối sâu (L = 0.14) (~zinc-950)
      if (l > 0.95) {
        const darkColor = oklch({
          ...color,
          l: 0.14,
          c: Math.min((color.c ?? 0), 0.005),
        });
        return alpha < 1 ? formatRgb(darkColor) : formatHex(darkColor);
      }
      
      // 2. Nền phụ sáng (L > 0.88) -> Nền phụ tối (L = 0.21) (~zinc-900)
      if (l > 0.88) {
        const darkColor = oklch({
          ...color,
          l: 0.21,
          c: Math.min((color.c ?? 0), 0.005),
        });
        return alpha < 1 ? formatRgb(darkColor) : formatHex(darkColor);
      }
      
      // 3. Nền phụ thứ ba/Alt (L > 0.82) -> Nền tối sáng vừa (L = 0.27) (~zinc-800)
      if (l > 0.82) {
        const darkColor = oklch({
          ...color,
          l: 0.27,
          c: Math.min((color.c ?? 0), 0.005),
        });
        return alpha < 1 ? formatRgb(darkColor) : formatHex(darkColor);
      }
      
      // 4. Đường viền (L > 0.75) -> Viền tối rõ ràng hơn (L = 0.35) (~zinc-700/750)
      if (l > 0.75) {
        const borderDark = oklch({
          ...color,
          l: 0.35,
          c: Math.min((color.c ?? 0), 0.005),
        });
        return alpha < 1 ? formatRgb(borderDark) : formatHex(borderDark);
      }

      // Nếu là thuộc tính chỉ NỀN (background/surface/bg) mà vốn dĩ đã TỐI (L < 0.5), ta giữ nguyên tông tối của nó, không được biến thành nền sáng!
      if (isBackgroundKey && l < 0.5) {
        return colorStr;
      }

      // 5. Chữ chính tối (L < 0.25) -> Chữ chính sáng (L = 0.92) (~zinc-200)
      if (l < 0.25) {
        const lightColor = oklch({
          ...color,
          l: 0.92,
          c: Math.min((color.c ?? 0), 0.005),
        });
        return alpha < 1 ? formatRgb(lightColor) : formatHex(lightColor);
      }
      
      // 6. Chữ phụ trung bình (L < 0.58) -> Chữ phụ sáng (L = 0.71) (~zinc-400)
      if (l < 0.58) {
        const lightMuted = oklch({
          ...color,
          l: 0.71,
          c: Math.min((color.c ?? 0), 0.01),
        });
        return alpha < 1 ? formatRgb(lightMuted) : formatHex(lightMuted);
      }

      // 7. Chữ phụ rất nhạt/Subtle (L < 0.75) -> Chữ phụ tối/Subtle sáng vừa (L = 0.55) (~zinc-500)
      if (l < 0.75) {
        const lightSubtle = oklch({
          ...color,
          l: 0.55,
          c: Math.min((color.c ?? 0), 0.01),
        });
        return alpha < 1 ? formatRgb(lightSubtle) : formatHex(lightSubtle);
      }

      // 8. Trường hợp còn lại: Điều chỉnh tuyến tính đảo ngược nhẹ
      const adjustedColor = oklch({
        ...color,
        l: 0.15 + (1 - l) * 0.7,
      });
      return alpha < 1 ? formatRgb(adjustedColor) : formatHex(adjustedColor);
    }
    
    // Nếu là màu brand/accent có sắc độ (Chroma cao)
    // Tăng độ sáng nếu màu brand quá tối để đảm bảo độ tương phản APCA trên nền đen
    if ((color.l ?? 0) < 0.45) {
      const brightenedColor = oklch({
        ...color,
        l: 0.55,
      });
      return alpha < 1 ? formatRgb(brightenedColor) : formatHex(brightenedColor);
    }
    
    return colorStr;
  } catch {
    return colorStr;
  }
}

/**
 * Hàm đệ quy duyệt qua tất cả các thuộc tính của một object tokens màu sắc
 * và tự động chuyển đổi các giá trị màu trung tính sang dark mode.
 */
export function adaptTokensForDarkMode<T>(tokens: T, isDark: boolean): T {
  if (!isDark) return tokens;
  if (!tokens || typeof tokens !== 'object') return tokens;
  
  const result: any = Array.isArray(tokens) ? [] : {};
  
  for (const key in tokens) {
    if (Object.prototype.hasOwnProperty.call(tokens, key)) {
      const val = tokens[key];
      if (typeof val === 'string') {
        const trimmed = val.trim();
        // Nhận diện các định dạng chuỗi màu sắc phổ biến
        const isColor = trimmed.startsWith('#') || 
                        trimmed.startsWith('rgb') || 
                        trimmed.startsWith('hsl') || 
                        trimmed === 'transparent' || 
                        trimmed === 'white' || 
                        trimmed === 'black';
        if (isColor) {
          result[key] = adaptColorForDarkMode(val, isDark, key);
        } else {
          result[key] = val;
        }
      } else if (typeof val === 'object' && val !== null) {
        result[key] = adaptTokensForDarkMode(val, isDark);
      } else {
        result[key] = val;
      }
    }
  }
  
  return result;
}
