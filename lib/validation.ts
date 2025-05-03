export function validateUrl(url: string): void {
  if (url.trim() === '') return; // 允许空链接（后续会过滤）

  const maxLength = 100;
  if (url.length > maxLength) {
    throw new Error(`链接不能超过${maxLength}个字符`);
  }

  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('链接必须以 http:// 或 https:// 开头');
    }
  } catch (e) {
    if (e instanceof Error && e.message !== 'Invalid URL') {
      throw e; // 抛出我们自定义的错误
    }
    throw new Error('请输入有效的 URL (以 http:// 或 https:// 开头)');
  }
}

export function validateDescription(description: string): void {
  const maxLength = 50;
  if (description.length > maxLength) {
    throw new Error(`备注不能超过${maxLength}个字符`);
  }
}
