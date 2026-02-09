export function formatMessageTime(timeStr: string | number): string {
  try {
    let date: Date;
    if (typeof timeStr === 'number') {
      date = new Date(timeStr * 1000);
    } else {
      date = new Date(timeStr);
    }

    if (Number.isNaN(date.getTime())) {
      return String(timeStr);
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return typeof timeStr === 'string' ? timeStr : String(timeStr);
  }
}
