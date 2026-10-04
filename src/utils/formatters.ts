// Indian Currency and Number Formatting Utilities

export function formatINR(val: number | string | undefined | null): string {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}

export function formatCurrencyAmount(val: number | string | undefined | null): string {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(val: number | string | undefined | null): string {
  const num = Number(val) || 0;
  return num.toLocaleString('en-IN');
}

export function formatWeight(kg: number | string | undefined | null, unit: string = 'KG'): string {
  const num = Number(kg) || 0;
  return `${num.toLocaleString('en-IN')} ${unit}`;
}

export function formatDate(isoDateStr?: string): string {
  if (!isoDateStr) return '';
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return isoDateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDateStr;
  }
}

export function formatDateTime(isoDateStr?: string): string {
  if (!isoDateStr) return '';
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return isoDateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDateStr;
  }
}

// Build WhatsApp Direct Message URL
export function buildWhatsAppLink(phone: string, message: string): string {
  // Strip non-digits
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

// Download CSV helper
export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
