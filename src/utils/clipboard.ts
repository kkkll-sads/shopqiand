/**
 * 通用剪贴板复制工具函数
 * 
 * 使用降级策略确保在各种环境下都能正常工作：
 * 1. 优先使用 document.execCommand('copy') - 兼容性更好，特别是在移动端
 * 2. 失败则尝试 navigator.clipboard.writeText - 现代API，需要HTTPS
 * 
 * @param text 要复制的文本
 * @returns Promise<boolean> 是否复制成功
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    // 方法1: 使用 execCommand（兼容性更好，特别是移动端）
    const execCommandCopy = (): boolean => {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            // 防止滚动和可见
            textArea.style.cssText = "position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            // 尝试设置选择范围（iOS Safari 需要）
            textArea.setSelectionRange(0, text.length);

            const successful = document.execCommand('copy');

            document.body.removeChild(textArea);
            return successful;
        } catch {
            return false;
        }
    };

    // 方法2: 使用 Clipboard API（需要 HTTPS 和权限）
    const clipboardApiCopy = async (): Promise<boolean> => {
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(text);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    // 先尝试 execCommand（兼容性更好），失败再尝试 Clipboard API
    let success = execCommandCopy();

    if (!success) {
        success = await clipboardApiCopy();
    }

    return success;
};
