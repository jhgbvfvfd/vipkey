import { useEffect, useMemo, useState } from 'react';

const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * 60;
const SECONDS_IN_DAY = SECONDS_IN_HOUR * 24;

export const formatTimeLeft = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / SECONDS_IN_DAY);
  const hours = Math.floor((totalSeconds % SECONDS_IN_DAY) / SECONDS_IN_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE);
  const seconds = totalSeconds % SECONDS_IN_MINUTE;

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days} วัน`);
  }
  if (hours > 0 || days > 0) {
    parts.push(`${hours} ชม.`);
  }
  if (minutes > 0 || hours > 0 || days > 0) {
    parts.push(`${minutes} นาที`);
  }
  parts.push(`${seconds} วินาที`);

  return parts.join(' ');
};

export const useExpirationCountdown = (expirationAt?: string) => {
  const expirationDate = useMemo(() => {
    if (!expirationAt) return null;
    const parsed = new Date(expirationAt);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [expirationAt]);

  const [timeLeft, setTimeLeft] = useState(() =>
    expirationDate ? expirationDate.getTime() - Date.now() : 0
  );

  useEffect(() => {
    if (!expirationDate) {
      setTimeLeft(0);
      return;
    }

    const updateTimeLeft = () => {
      setTimeLeft(expirationDate.getTime() - Date.now());
    };

    updateTimeLeft();

    if (expirationDate.getTime() <= Date.now()) {
      return;
    }

    const intervalId = window.setInterval(updateTimeLeft, 1000);
    return () => window.clearInterval(intervalId);
  }, [expirationDate]);

  const isExpired = expirationDate ? timeLeft <= 0 : false;
  const formatted = useMemo(() => {
    if (!expirationDate) return '';
    return formatTimeLeft(timeLeft);
  }, [expirationDate, timeLeft]);

  return {
    expirationDate,
    isExpired,
    timeLeft,
    formattedTimeLeft: formatted,
  };
};

export type UseExpirationCountdownReturn = ReturnType<typeof useExpirationCountdown>;
