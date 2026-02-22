/**
 * Sanitize text to remove emojis and special Unicode characters
 * that cause ByteString conversion errors in Supabase
 */
export function sanitizeText(text) {
  if (!text) return text;
  
  try {
    // Method 1: Keep only printable ASCII characters (32-126)
    let cleaned = text.replace(/[^\x20-\x7E]/g, '');
    
    // If result is empty, try less aggressive approach
    if (!cleaned.trim()) {
      // Method 2: Remove only problematic high Unicode (> 255)
      cleaned = text.replace(/[^\x00-\xFF]/g, '');
    }
    
    // If still empty, return a default
    if (!cleaned.trim()) {
      return 'Text';
    }
    
    return cleaned.trim();
  } catch (error) {
    console.error('Sanitization error:', error);
    return 'Text';
  }
}

/**
 * Sanitize all string fields in an object
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Log problematic characters in text
 */
export function debugText(text, label = 'text') {
  if (!text) return;
  
  console.log(`\n=== Debug ${label} ===`);
  console.log('Length:', text.length);
  console.log('First 50 chars:', text.substring(0, 50));
  
  // Find problematic characters
  const problematic = [];
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    if (charCode > 255) {
      problematic.push({
        index: i,
        char: text[i],
        code: charCode
      });
    }
  }
  
  if (problematic.length > 0) {
    console.log('Problematic characters found:', problematic.slice(0, 5));
  } else {
    console.log('No problematic characters found');
  }
  console.log('===================\n');
}
