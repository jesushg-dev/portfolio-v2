import { useEffect, useRef } from 'react';

type Callback = () => void;

const useInterval = (callback: Callback, delay: number | null): void => {
  const savedCallback = useRef<Callback>(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => savedCallback.current();

    if (typeof delay === 'number') {
      const intervalId = window.setInterval(tick, delay);
      return () => {
        clearInterval(intervalId); // Clear interval on cleanup
      };
    }
  }, [delay]);
};

export default useInterval;
