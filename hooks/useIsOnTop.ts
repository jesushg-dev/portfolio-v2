import { useEffect, useState } from 'react';

const useIsOnTop = () => {
  const [isOnTop, setIsOnTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;

      const isOnTop = scrollPosition === 0;
      setIsOnTop(isOnTop);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return isOnTop;
};

export default useIsOnTop;
