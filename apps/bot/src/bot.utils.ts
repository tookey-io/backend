export function getPagination(currentPage = 1, totalPages = 5): { text: string; data: string }[] {
  const keys: { text: string; data: string }[] = [];

  if (totalPages <= 1) return [];
  if (currentPage > 1) keys.push({ text: `« 1`, data: '1' });
  if (currentPage > 2) keys.push({ text: `‹ ${currentPage - 1}`, data: `${currentPage - 1}` });

  keys.push({ text: `· ${currentPage} ·`, data: '' });

  if (currentPage < totalPages - 1) keys.push({ text: `${currentPage + 1} ›`, data: `${currentPage + 1}` });
  if (currentPage < totalPages) keys.push({ text: `${totalPages} »`, data: `${totalPages}` });

  return keys;
}

export const replaceMiddle = (str: string): string => (str.length < 9 ? str : `${str.slice(0, 8)}...${str.slice(-8)}`);
