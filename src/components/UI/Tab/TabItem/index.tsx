import { FC } from 'react';
import { useTabContext } from '..';

import { motion } from 'framer-motion';

import type { IconType } from 'react-icons/lib';

export interface TabItemProps {
  index?: number;
  icon: IconType;
  title: string;
  description: string;
}

const variants = {
  active: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  inactive: {
    opacity: 0.7,
    transition: {
      duration: 0.3,
    },
  },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

const TabItem: FC<TabItemProps> = ({ index = -1, icon: Icon, title, description }) => {
  const { currentTab, setCurrentTab, minimal } = useTabContext();

  const isActive = currentTab === index;

  return (
    <div className="relative" role="tab">
      {isActive && (
        <motion.div layoutId="background-tab" className="rounded-xl absolute shadow-md inset-0 bg-primary-600  -z-10" />
      )}
      <motion.button
        type="button"
        title={title}
        id={`tab-${index}`}
        animate={isActive ? 'active' : 'inactive'}
        variants={variants}
        initial="inactive"
        whileHover="hover"
        onClick={() => setCurrentTab(index)}
        className={`text-left p-4 md:p-5 rounded-xl w-full ${isActive ? '' : 'hover:bg-background-800/30'}`}>
        <span
          className={`flex items-center transition-all ${isActive ? 'text-secondaryText-50' : 'text-primaryText-400'}`}>
          <Icon
            className={` ${minimal ? 'mt-0' : 'mt-2 flex-shrink-0  h-6 w-6 md:w-7 md:h-7'}`}
            width={16}
            height={16}
          />
          <span className="grow ml-6">
            <span className={`block whitespace-nowrap font-semibold ${minimal ? '' : 'text-lg'}  `}>{title}</span>
            {minimal ? null : <span className="block mt-1 text-primaryText-800">{description}</span>}
          </span>
        </span>
      </motion.button>
    </div>
  );
};

export default TabItem;
