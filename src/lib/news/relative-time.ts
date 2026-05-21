export function formatRelativeTime(
  iso: string,
  locale: string = "en"
): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const isZh = locale.startsWith("zh");

  if (diffSec < 60) {
    return isZh ? "刚刚" : "Just now";
  }
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return isZh ? `${m} 分钟前` : `${m}m ago`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return isZh ? `${h} 小时前` : `${h}h ago`;
  }
  if (diffSec < 604800) {
    const d = Math.floor(diffSec / 86400);
    return isZh ? `${d} 天前` : `${d}d ago`;
  }

  return new Date(iso).toLocaleDateString(isZh ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
  });
}
