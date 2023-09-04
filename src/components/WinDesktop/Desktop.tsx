import React, { useState } from 'react';
import Taskbar from './Taskbar';
import StartMenu from './StartMenu';
import DesktopIcon from './DesktopIcon';

const Desktop = () => {
  const [showStartMenu, setShowStartMenu] = useState(false);

  return (
    <div className="w-screen h-screen bg-blue-300">
      {/* Desktop background and wallpaper */}
      <div className="absolute top-0 left-0 w-full h-full flex flex-wrap p-4">
        <DesktopIcon icon="icon1.png" label="Icon 1" />
        <DesktopIcon icon="icon2.png" label="Icon 2" />
        {/* Add more icons as needed */}
      </div>
      <Taskbar />
      {showStartMenu && <StartMenu />}
    </div>
  );
};

export default Desktop;
