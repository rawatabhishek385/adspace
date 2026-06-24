export function maskContactInfo(text: string | null | undefined): string {
  if (!text) return "";

  // Mask Email
  let masked = text.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, 'xxxxx@xxxxx.xxx');

  // Catch any sequence of 7 or more digits, even if heavily separated by spaces or punctuation
  const phoneRegex = /(?:\+?[\s\-\.\(\)]*)?(?:\d[\s\-\.\(\)]*){7,}/g;
  
  masked = masked.replace(phoneRegex, (match) => {
    const digits = match.replace(/\D/g, '');
    if (digits.length > 6) {
      return digits.substring(0, 3) + 'x'.repeat(digits.length - 3);
    }
    return match;
  });

  return masked;
}
