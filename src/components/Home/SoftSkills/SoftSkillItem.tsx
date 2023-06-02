import { Fragment, useRef, useTransition, useMemo, FC } from 'react';

import { Popover, Transition } from '@headlessui/react';

interface ISoftSkillItemProps {
  title: string;
  description: string;
  icon: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
}

const SoftSkillItem: FC<ISoftSkillItemProps> = ({ title, description, icon: Icon }) => {
  const [isPending, startTransition] = useTransition();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutDuration = 200;
  let timeout: NodeJS.Timeout;

  const closePopover = () => {
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    return buttonRef.current?.dispatchEvent(event);
  };

  const onMouseEnter = (open: boolean) => {
    clearTimeout(timeout);
    if (open) return;
    return buttonRef.current?.click();
  };

  const onMouseLeave = (open: boolean) => {
    if (!open) return;
    timeout = setTimeout(() => closePopover(), timeoutDuration);
  };

  return (
    <Popover className="relative">
      {({ open }) => {
        return (
          <>
            <div onMouseLeave={onMouseLeave.bind(null, open)}>
              <Popover.Button
                ref={buttonRef}
                className={`${
                  open ? '' : 'text-opacity-90'
                } flex shrink-0 snap-center scroll-pl-6 flex-col items-center gap-4 p-4 px-6 shadow-none outline-none`}
                onMouseEnter={onMouseEnter.bind(null, open)}
                onMouseLeave={onMouseLeave.bind(null, open)}>
                <div className="flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary-600 transition-all hover:scale-110 hover:border-primary-500">
                    <Icon className="h-10 w-10 rounded-full text-slate-100 shadow-lg" />
                  </div>
                  <p className="ml-1 select-none text-white antialiased">{title}</p>
                </div>
              </Popover.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1">
                <Popover.Panel
                  className="absolute left-1/2 z-50 -mt-12 w-screen max-w-[8.5rem] -translate-x-1/2 transform px-4 sm:px-0"
                  onMouseEnter={onMouseEnter.bind(null, open)}
                  onMouseLeave={onMouseLeave.bind(null, open)}>
                  <div className="overflow-hidden rounded bg-black px-2 py-1 ">
                    <p className="pointer-events-none text-center text-sm text-secondaryText-50">{description}</p>
                  </div>
                </Popover.Panel>
              </Transition>
            </div>
          </>
        );
      }}
    </Popover>
  );
};

export default SoftSkillItem;
