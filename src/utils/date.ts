export const getLocalDateString = (d = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatExpenseDateForServer = (input?: string | Date): string => {
  if (!input) return new Date().toISOString();
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? new Date().toISOString() : input.toISOString();
  }
  const dateStr = String(input);
  if (dateStr.includes('T')) {
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const now = new Date();
    const localDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
    return isNaN(localDate.getTime()) ? new Date().toISOString() : localDate.toISOString();
  }
  return new Date().toISOString();
};

export const formatDisplayDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const today = new Date();
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return 'Today';
    }
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};
