const PERSIAN_ZERO = 0x06f0;

export function faDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (ch) =>
    String.fromCharCode(PERSIAN_ZERO + (ch.charCodeAt(0) - 48))
  );
}

export function groupedFa(value: number): string {
  const digits = Math.max(0, Math.floor(value)).toString();
  const parts: string[] = [];
  for (let i = digits.length; i > 0; i -= 3) {
    parts.unshift(digits.slice(Math.max(0, i - 3), i));
  }
  return faDigits(parts.join('\u066C'));
}

export function todayDayKey(nowMs = Date.now()): string {
  const d = new Date(nowMs);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function newRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
