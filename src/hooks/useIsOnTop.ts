import { useEffect, useState } from 'react';

const debounce = (func: () => void, delay: number): (() => void) => {
  let timer: NodeJS.Timeout;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(func, delay);
  };
};

const useIsOnTop = (): boolean => {
  const [isOnTop, setIsOnTop] = useState<boolean>(true);

  useEffect(() => {
    const handleScroll = (): void => {
      const scrollPosition: number = window.scrollY;
      const isOnTop: boolean = scrollPosition === 0;
      setIsOnTop(isOnTop);
    };

    const debouncedScrollHandler = debounce(handleScroll, 10); // Adjust the debounce delay as needed

    window.addEventListener('scroll', debouncedScrollHandler);
    return () => {
      window.removeEventListener('scroll', debouncedScrollHandler);
    };
  }, []);

  return isOnTop;
};

export default useIsOnTop;
