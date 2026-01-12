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
    console.log('[Clipboard] 开始复制:', text);

    // 方法1: 使用 execCommand（兼容性更好，特别是移动端）
    const execCommandCopy = (): boolean => {
        console.log('[Clipboard] 尝试方法1: execCommand');
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            // 防止滚动和可见
            textArea.style.cssText = "position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            console.log('[Clipboard] execCommand - textArea已创建并选中');

            // 尝试设置选择范围（iOS Safari 需要）
            textArea.setSelectionRange(0, text.length);

            const successful = document.execCommand('copy');
            console.log('[Clipboard] execCommand结果:', successful);

            document.body.removeChild(textArea);
            return successful;
        } catch (err) {
            console.error('[Clipboard] execCommand失败:', err);
            return false;
        }
    };

    // 方法2: 使用 Clipboard API（需要 HTTPS 和权限）
    const clipboardApiCopy = async (): Promise<boolean> => {
        console.log('[Clipboard] 尝试方法2: Clipboard API');
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                console.log('[Clipboard] Clipboard API可用');
                await navigator.clipboard.writeText(text);
                console.log('[Clipboard] Clipboard API成功');
                return true;
            }
            console.warn('[Clipboard] Clipboard API不可用');
            return false;
        } catch (err) {
            console.error('[Clipboard] Clipboard API失败:', err);
            return false;
        }
    };

    // 先尝试 execCommand（兼容性更好），失败再尝试 Clipboard API
    let success = execCommandCopy();
    console.log('[Clipboard] execCommand最终结果:', success);

    if (!success) {
        console.log('[Clipboard] execCommand失败，尝试Clipboard API');
        success = await clipboardApiCopy();
        console.log('[Clipboard] Clipboard API最终结果:', success);
    }

    console.log('[Clipboard] 复制操作完成，结果:', success);
    return success;
};
