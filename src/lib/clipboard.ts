/**
 * 安全复制到剪贴板
 * navigator.clipboard 在非 HTTPS、部分 WebView 或沙箱环境下可能为 undefined
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  const str = String(text);
  if (!str) return false;

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(str);
      return true;
    } catch {
      return false;
    }
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = str;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
