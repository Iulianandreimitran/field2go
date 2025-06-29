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

    const handler = setTimeout(() => {
      setDebounced(value);
    }, delay);


    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debounced;
}
