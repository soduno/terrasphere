import { useEffect, useRef, useState } from 'react';

export function useTransientFlag(duration = 600) {
  const [isActive, setIsActive] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const trigger = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    setIsActive(true);
    timeoutRef.current = window.setTimeout(() => {
      setIsActive(false);
      timeoutRef.current = null;
    }, duration);
  };

  useEffect(() => () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
  }, []);

  return { isActive, trigger };
}
