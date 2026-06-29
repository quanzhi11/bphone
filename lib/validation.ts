const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return "请输入邮箱地址";
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "邮箱地址格式无效";
  }
  return null;
}

export function validateEmailCode(code: string): string | null {
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    return "请输入 6 位数字验证码";
  }
  return null;
}
