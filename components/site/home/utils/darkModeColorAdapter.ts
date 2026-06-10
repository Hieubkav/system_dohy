'use client';

import { oklch, formatHex, parse, formatRgb } from 'culori';

/**
 * Chuyển đổi một chuỗi màu đơn lẻ sang tông màu tương thích Dark Mode nếu cần thiết.
 * Giữ nguyên các màu sắc thương hiệu chính (Brand Colors) và chỉ điều chỉnh các màu trung hòa.
 */
export function adaptColorForDarkMode(colorStr: string, isDark: boolean): string {
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
    
    // Nếu là màu trung hòa (Chroma C cực kỳ thấp trong hệ OKLCH)
    if ((color.c ?? 0) < 0.04) {
      // 1. Nền sáng (L > 0.85) -> Chuyển thành nền tối sang trọng (L khoảng 0.12 - 0.18)
      if ((color.l ?? 0) > 0.8) {
        const darkColor = oklch({
          ...color,
          l: 0.15, // Tông màu tối nhẹ giống zinc-900
          c: Math.min((color.c ?? 0), 0.01),
        });
        return alpha < 1 ? formatRgb(darkColor) : formatHex(darkColor);
      }
      
      // 2. Chữ tối (L < 0.35) -> Chuyển thành chữ sáng (L khoảng 0.9 - 0.95)
      if ((color.l ?? 0) < 0.35) {
        const lightColor = oklch({
          ...color,
          l: 0.93, // Chữ sáng dễ đọc giống zinc-200
          c: Math.min((color.c ?? 0), 0.01),
        });
        return alpha < 1 ? formatRgb(lightColor) : formatHex(lightColor);
      }
      
      // 3. Các màu xám trung gian (như đường viền, chữ muted phụ)
      // Đảo ngược độ sáng L để tương thích dark mode
      const adjustedColor = oklch({
        ...color,
        l: 1 - (color.l ?? 0.5),
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
          result[key] = adaptColorForDarkMode(val, isDark);
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
