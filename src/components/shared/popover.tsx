"use client";

import {
  cloneElement,
  forwardRef,
  isValidElement,
  useLayoutEffect,
} from "react";
import type { ButtonHTMLAttributes, FC, HTMLProps, ReactNode } from "react";
import {
  FloatingFocusManager,
  FloatingPortal,
  useId,
  useMergeRefs,
} from "@floating-ui/react";

import type { PopoverOptions } from "../../hooks/use-popover";
import PopoverContextProvider, {
  usePopoverContext,
} from "./popover-context-provider";

interface IPopoverProps extends PopoverOptions {
  children: ReactNode;
}

const Popover: FC<IPopoverProps> = ({ children, ...restOptions }) => {
  return (
    <PopoverContextProvider {...restOptions}>{children}</PopoverContextProvider>
  );
};

interface PopoverTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export const PopoverTrigger = forwardRef<
  HTMLElement,
  HTMLProps<HTMLElement> & PopoverTriggerProps
>(function PopoverTrigger({ children, asChild = false, ...props }, propRef) {
  const context = usePopoverContext();
  const ref = useMergeRefs([context.refs.setReference, propRef]);

  // `asChild` allows the user to pass any element as the anchor
  if (asChild && isValidElement(children)) {
    const referenceProps = context.getReferenceProps({
      ...props,
      ...(isValidElement(children) && typeof children.props === "object"
        ? children.props
        : {}),
    });

    return (
      <span ref={ref}>{cloneElement(children, { ...referenceProps })}</span>
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      // The user can style the trigger based on the state
      data-state={context.open ? "open" : "closed"}
      {...context.getReferenceProps(props)}
    >
      {children}
    </button>
  );
});

interface IPopoverContentProps extends HTMLProps<HTMLDivElement> {
  portalId?: string;
}

export const PopoverContent = forwardRef<HTMLDivElement, IPopoverContentProps>(
  function PopoverContent({ style, portalId, ...props }, propRef) {
    const { context: floatingContext, ...context } = usePopoverContext();
    const ref = useMergeRefs([context.refs.setFloating, propRef]);

    if (!floatingContext.open) return null;

    return (
      <FloatingPortal id={portalId}>
        <FloatingFocusManager context={floatingContext} modal={context.modal}>
          <div
            ref={ref}
            style={{ ...context.floatingStyles, ...style }}
            aria-labelledby={context.labelId}
            aria-describedby={context.descriptionId}
            {...context.getFloatingProps(props)}
          >
            {props.children}
          </div>
        </FloatingFocusManager>
      </FloatingPortal>
    );
  },
);

export const PopoverHeading = forwardRef<
  HTMLHeadingElement,
  HTMLProps<HTMLHeadingElement>
>(function PopoverHeading(props, ref) {
  const { setLabelId } = usePopoverContext();
  const id = useId();

  // Only sets `aria-labelledby` on the Popover root element
  // if this component is mounted inside it.
  useLayoutEffect(() => {
    setLabelId(id);
    return () => setLabelId(undefined);
  }, [id, setLabelId]);

  return (
    <h2 {...props} ref={ref} id={id}>
      {props.children}
    </h2>
  );
});

export const PopoverDescription = forwardRef<
  HTMLParagraphElement,
  HTMLProps<HTMLParagraphElement>
>(function PopoverDescription(props, ref) {
  const { setDescriptionId } = usePopoverContext();
  const id = useId();

  // Only sets `aria-describedby` on the Popover root element
  // if this component is mounted inside it.
  useLayoutEffect(() => {
    setDescriptionId(id);
    return () => setDescriptionId(undefined);
  }, [id, setDescriptionId]);

  return <p {...props} ref={ref} id={id} />;
});

export const PopoverClose = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(function PopoverClose(props, ref) {
  const { setOpen } = usePopoverContext();
  return (
    <button
      type="button"
      ref={ref}
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        setOpen(false);
      }}
    />
  );
});

export default Popover;
