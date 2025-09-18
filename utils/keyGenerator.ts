
type PatternInput = number[] | number | string | null | undefined;

export const normalizePattern = (pattern: PatternInput): number[] => {
  if (Array.isArray(pattern)) {
    return pattern
      .map(segment => Math.max(0, Math.trunc(Number(segment))))
      .filter(segment => Number.isFinite(segment) && segment > 0);
  }

  if (typeof pattern === 'number') {
    const normalized = Math.max(0, Math.trunc(pattern));
    return Number.isFinite(normalized) && normalized > 0 ? [normalized] : [];
  }

  if (typeof pattern === 'string') {
    return pattern
      .split(/[^0-9]+/u)
      .map(segment => Number.parseInt(segment, 10))
      .filter(segment => Number.isFinite(segment) && segment > 0);
  }

  return [];
};

const DEFAULT_PATTERN = [4, 4, 4, 4];

export const generateKey = (prefix = '', pattern?: PatternInput): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const pick = () => alphabet[Math.floor(Math.random() * alphabet.length)];

  const sanitizedPrefix = prefix.trim().replace(/-+$/u, '');
  const normalizedPattern = normalizePattern(pattern);
  const segments = (normalizedPattern.length > 0 ? normalizedPattern : DEFAULT_PATTERN).map(len =>
    Array.from({ length: len }, pick).join('')
  );

  const prefixPart = sanitizedPrefix ? `${sanitizedPrefix}-` : '';
  return `${prefixPart}${segments.join('-')}`;
};
