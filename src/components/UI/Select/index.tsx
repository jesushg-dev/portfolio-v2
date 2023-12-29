import type { FC, ReactNode } from 'react';
import React, { createContext, useState, useRef, useCallback, useMemo, useContext, useEffect } from 'react';
import {
  autoUpdate,
  flip,
  useFloating,
  useInteractions,
  useListNavigation,
  useTypeahead,
  useClick,
  useListItem,
  useDismiss,
  useRole,
  FloatingFocusManager,
  FloatingList,
} from '@floating-ui/react';

interface SelectContextValue {
  activeIndex: number | null;
  selectedIndex: number | null;
  getItemProps: ReturnType<typeof useInteractions>['getItemProps'];
  handleSelect: (index: number | null) => void;
}

const SelectContext = createContext<SelectContextValue>({} as SelectContextValue);

interface ISelectProps {
  header?: ReactNode;
  children: ReactNode;
  value?: number | null;
  disabled?: boolean;
  onChange?: (index: number) => void;
}

export const Select: FC<ISelectProps> = ({ children, header, value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    placement: 'bottom-start',
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [flip()],
  });

  const elementsRef = useRef<Array<HTMLElement | null>>([]);
  const labelsRef = useRef<Array<string | null>>([]);

  const handleSelect = useCallback(
    (index: number | null) => {
      setSelectedIndex(index);
      setIsOpen(false);
      if (index !== null) {
        onChange?.(index);
        setSelectedLabel(labelsRef.current[index]);
      }
    },
    [onChange]
  );

  const handleTypeaheadMatch = (index: number | null) => {
    if (isOpen) {
      setActiveIndex(index);
    } else {
      handleSelect(index);
    }
  };

  const listNav = useListNavigation(context, {
    listRef: elementsRef,
    activeIndex,
    selectedIndex,
    onNavigate: setActiveIndex,
  });

  const typeahead = useTypeahead(context, {
    listRef: labelsRef,
    activeIndex,
    selectedIndex,
    onMatch: handleTypeaheadMatch,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'listbox' });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    listNav,
    typeahead,
    click,
    dismiss,
    role,
  ]);

  const selectContext = useMemo(
    () => ({
      activeIndex,
      selectedIndex,
      getItemProps,
      handleSelect,
    }),
    [activeIndex, selectedIndex, getItemProps, handleSelect]
  );

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setSelectedIndex(value);
      setSelectedLabel(labelsRef.current[value]);
    }
  }, [value]);

  return (
    <>
      <div
        ref={refs.setReference}
        /* eslint-disable react/jsx-props-no-spreading */
        {...getReferenceProps()}
        /* eslint-enable react/jsx-props-no-spreading */
      >
        {header || <span className="text-sm text-primaryText-700">{selectedLabel ?? 'Select...'}</span>}
      </div>
      <SelectContext.Provider value={selectContext}>
        {isOpen && (
          <FloatingFocusManager context={context} modal={false} disabled={disabled}>
            <div
              ref={refs.setFloating}
              className="rounded-lg bg-background-50 shadow-none outline-none ring-0"
              style={floatingStyles}
              /* eslint-disable react/jsx-props-no-spreading */
              {...getFloatingProps()}
              /* eslint-enable react/jsx-props-no-spreading */
            >
              <FloatingList elementsRef={elementsRef} labelsRef={labelsRef}>
                <ul className="py-2">{children}</ul>
              </FloatingList>
            </div>
          </FloatingFocusManager>
        )}
      </SelectContext.Provider>
    </>
  );
};

interface IOptionProps {
  label: string;
  className?: string;
  children?: ReactNode;
  isPending?: boolean;
}

export const Option: FC<IOptionProps> = ({ label, className, children, isPending }) => {
  const { activeIndex, selectedIndex, getItemProps, handleSelect } = useContext(SelectContext);

  const { ref, index } = useListItem({ label });

  const isActive = activeIndex === index;
  const isSelected = selectedIndex === index;

  return (
    <li className="w-full">
      <button
        ref={ref}
        type="button"
        role="option"
        disabled={isPending}
        aria-selected={isActive && isSelected}
        tabIndex={isActive ? 0 : -1}
        style={{
          fontWeight: isSelected ? 'bold' : '',
        }}
        className={`w-full shadow-none outline-none ring-0 ${className}`}
        /* eslint-disable react/jsx-props-no-spreading */
        {...getItemProps({
          onClick: () => handleSelect(index),
        })}
        /* eslint-enable react/jsx-props-no-spreading */
      >
        {children ?? label}
      </button>
    </li>
  );
};
