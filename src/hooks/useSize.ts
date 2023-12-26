import { useState, useEffect, RefObject } from 'react';

interface Size {
  width: number;
  height: number;
}

const useSize = (elementRef?: RefObject<HTMLElement>): Size => {
  const [size, setSize] = useState<Size>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    function handleResize() {
      if (elementRef?.current) {
        // If a ref is provided, use its size
        setSize({
          width: elementRef.current.offsetWidth,
          height: elementRef.current.offsetHeight,
        });
      } else {
        // Otherwise, use the window size
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Call it immediately to get initial size

    return () => window.removeEventListener('resize', handleResize);
  }, [elementRef]); // Dependency array includes the ref

  return size;
};

export default useSize;
