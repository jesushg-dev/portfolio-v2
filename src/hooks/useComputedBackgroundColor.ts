import { useState, useEffect, useRef, RefObject, DependencyList } from 'react';

const useComputedBackgroundColor = (dependencies: DependencyList = []): [RefObject<HTMLDivElement>, string] => {
  const ref = useRef<HTMLDivElement>(null);
  const [fillColor, setFillColor] = useState<string>('');

  useEffect(() => {
    if (ref.current) {
      const computedColor = getComputedStyle(ref.current).backgroundColor;
      setFillColor(computedColor);
    }
  }, [ref, ...dependencies]); // Spread the dependencies into the dependency array

  return [ref, fillColor];
};

export default useComputedBackgroundColor;
