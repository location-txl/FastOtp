export const formatTime = (timestampMs: number) => {
  if (!Number.isFinite(timestampMs)) return '';
  return new Date(timestampMs).toLocaleString('zh-CN');
};

export const formatSize = (bytes?: number) => {
  if (!bytes || !Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};
