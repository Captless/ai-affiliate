export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

export function validateImageFile(file: File): ValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      reason: "Only PNG, JPEG, WEBP or GIF images are supported.",
    };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { valid: false, reason: "Image exceeds the 20 MB limit." };
  }
  return { valid: true };
}

export function validateApiKey(key: string): ValidationResult {
  if (!key.trim()) {
    return { valid: false, reason: "Enter the API key." };
  }
  if (key.trim().length < 12) {
    return { valid: false, reason: "API key looks too short to be valid." };
  }
  if (/\s/.test(key)) {
    return { valid: false, reason: "API key must not contain spaces." };
  }
  return { valid: true };
}
