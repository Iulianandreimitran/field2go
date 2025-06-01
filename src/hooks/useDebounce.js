// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Hook care întârzie actualizarea valorii până ce
 * timpul `delay` a trecut fără nicio modificare.
 * @param {any} value - valoarea care trebuie debounced
 * @param {number} delay - întârzierea în milisecunde
 * @returns valoarea debounced
 */
export default function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // La fiecare schimbare a lui `value`, setăm un timeout
    const handler = setTimeout(() => {
      setDebounced(value);
    }, delay);

    // Cleanup: dacă `value` se schimbă înainte de expirare, anulăm timeout-ul
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debounced;
}
