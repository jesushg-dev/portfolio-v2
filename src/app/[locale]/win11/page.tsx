'use client';

import React, { FC, lazy, Suspense, useState, useRef, useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { CSS } from '@dnd-kit/utilities';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { WidthProvider, Responsive } from 'react-grid-layout';

import Window from '@/components/WinDesktop/Window';
import Taskbar from '@/components/WinDesktop/Taskbar';
import StartMenu from '@/components/WinDesktop/StartMenu';
import DesktopIcon, { IDesktopIcon } from '@/components/WinDesktop/DesktopIcon';

import '../../../../node_modules/react-grid-layout/css/styles.css';

const ResponsiveReactGridLayout = WidthProvider(Responsive);

interface IWinElevenPageProps {}

const icons: IDesktopIcon[] = [
  {
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-about-me-96_x6fa0e.webp',
    label: 'About Me',
  },
  {
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-mail-96_upmhx3.webp',
    label: 'Mail',
  },
  {
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-portfolio-96_opfju0.webp',
    label: 'Portfolio',
  },
  {
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-resume-96-alt_wcl4bp.webp',
    label: 'Resume',
  },
  {
    icon: 'https://res.cloudinary.com/js-media/image/upload/v1690088055/portfolio/win11/icons/icons8-rss-96_wxhdyp.webp',
    label: 'Blog',
  },
];

const WinElevenPage: FC<IWinElevenPageProps> = ({}) => {
  const t = useTranslations('curriculum');
  const elementRef = useRef<HTMLDivElement>(null);

  const [layouts, setLayouts] = useState(getFromLS('layouts') || {});
  const [showStartMenu, setShowStartMenu] = useState(false);

  const onLayoutChange = (layout: any, layouts: any) => {
    saveToLS('layouts', layouts);
    setLayouts(layouts);
  };

  return (
    <div className="w-screen h-screen bg-windows-11 bg-center bg-cover relative overflow-hidden pb-10">
      <div className="absolute top-0 left-0 w-full h-full flex flex-wrap">
        {/* Desktop Icons */}
        <ResponsiveReactGridLayout
          className="layout h-full w-full"
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={40}
          layouts={layouts}
          autoSize={false}
          isResizable={false}
          onLayoutChange={(layout, layouts) => onLayoutChange(layout, layouts)}>
          {/* Desktop icons */}
          {icons.map((icon, index) => (
            <div key={String(index)} data-grid={{ w: 1, h: 2, x: 0, y: index, minW: 1, minH: 2 }}>
              <DesktopIcon key={index} {...icon} />
            </div>
          ))}
        </ResponsiveReactGridLayout>
        {/* Windows */}
        <DndContext modifiers={[restrictToWindowEdges]}>
          <Window title="My First Window">
            <p>This is the content of the first window.</p>
            <p>This is the content of the first window.</p>
            <p>This is the content of the first window.</p>
            <p>This is the content of the first window.</p>
            <p>This is the content of the first window.</p>
          </Window>
        </DndContext>
      </div>
      <Taskbar />
      {showStartMenu && <StartMenu />}
    </div>
  );
};

function getFromLS(key: string) {
  let ls = {} as any;
  if (global.localStorage) {
    try {
      ls = JSON.parse(global.localStorage.getItem('rgl-8') || '') || {};
    } catch (e) {
      console.log(e);
    }
  }
  return ls[key];
}

function saveToLS(key: string, value: string) {
  if (global.localStorage) {
    global.localStorage.setItem(
      'rgl-8',
      JSON.stringify({
        [key]: value,
      })
    );
  }
}

export default WinElevenPage;
