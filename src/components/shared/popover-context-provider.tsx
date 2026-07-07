import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react";
import type { FC } from "react";

import usePopover from "../../hooks/use-popover";
import type { PopoverOptions } from "../../hooks/use-popover";

type ContextType =
  | (ReturnType<typeof usePopover> & {
      setLabelId: Dispatch<SetStateAction<string | undefined>>;
      setDescriptionId: Dispatch<SetStateAction<string | undefined>>;
    })
  | null;

const PopoverContext = createContext<ContextType>(null);

interface IPopoverContextProviderProps extends PopoverOptions {
  children: ReactNode;
}

const PopoverContextProvider: FC<IPopoverContextProviderProps> = ({
  children,
  ...restOptions
}) => {
  const popover = usePopover(restOptions);
  return (
    <PopoverContext.Provider value={popover}>
      {children}
    </PopoverContext.Provider>
  );
};

export const usePopoverContext = () => {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error(
      "Popover compound components cannot be rendered outside the Popover component",
    );
  }
  return context;
};

export default PopoverContextProvider;
