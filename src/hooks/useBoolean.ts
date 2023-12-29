import { useState } from 'react';

const useBoolean = (initial = false) => {
  const [value, setValue] = useState(initial);

  const actions = {
    set: (val: boolean) => setValue(val),
    toggle: () => setValue((val) => !val),
    on: () => setValue(true),
    off: () => setValue(false),
  };

  return [value, actions] as const;
};

export default useBoolean;
