/**
 * Date formatting utility ensuring all user-facing dates display in DD-MM-YYYY format.
 */

export const formatDateDDMMYYYY = (dateInput?: string | number | Date | null): string => {
  if (!dateInput) return '';
  
  // Handle plain YYYY-MM-DD string directly to avoid timezone shift issues
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    const [year, month, day] = dateInput.trim().split('-');
    return `${day}-${month}-${year}`;
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
      const [year, month, day] = dateInput.split('T')[0].split('-');
      return `${day}-${month}-${year}`;
    }
    return String(dateInput);
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export const formatDateTimeDDMMYYYY = (dateInput?: string | number | Date | null): string => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const dateStr = formatDateDDMMYYYY(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
};
