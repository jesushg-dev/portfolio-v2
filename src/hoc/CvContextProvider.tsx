import React, { FC, ReactNode, createContext, useState, useContext } from 'react';

// Define the type for the context value
interface ICvContextValue {
  showSectionIcons: boolean;
  addSplashOfColor: boolean;
  showHeadshot: boolean;
  showVisualizations: boolean;
  toggleSectionIcons: () => void;
  toggleSplashOfColor: () => void;
  toggleHeadshot: () => void;
  toggleVisualizations: () => void;
}

// Create the context
const CvContext = createContext<ICvContextValue | undefined>(undefined);

interface ICvContextProviderProps {
  children: ReactNode;
}

// Create a provider component
export const CvContextProvider: FC<ICvContextProviderProps> = ({ children }) => {
  // State variables
  const [showSectionIcons, setShowSectionIcons] = useState(false);
  const [addSplashOfColor, setAddSplashOfColor] = useState(false);
  const [showHeadshot, setShowHeadshot] = useState(false);
  const [showVisualizations, setShowVisualizations] = useState(false);

  // Toggle functions
  const toggleSectionIcons = () => {
    setShowSectionIcons(!showSectionIcons);
  };

  const toggleSplashOfColor = () => {
    setAddSplashOfColor(!addSplashOfColor);
  };

  const toggleHeadshot = () => {
    setShowHeadshot(!showHeadshot);
  };

  const toggleVisualizations = () => {
    setShowVisualizations(!showVisualizations);
  };

  // Context provider value
  const contextValue: ICvContextValue = {
    showSectionIcons,
    addSplashOfColor,
    showHeadshot,
    showVisualizations,
    toggleSectionIcons,
    toggleSplashOfColor,
    toggleHeadshot,
    toggleVisualizations,
  };

  // Render the provider with the context value and children components
  return <CvContext.Provider value={contextValue}>{children}</CvContext.Provider>;
};

export const useCvContext = () => {
  const context = useContext(CvContext);
  if (context === undefined) {
    throw new Error('useCvContext must be used within a CvProvider');
  }
  return context;
};
