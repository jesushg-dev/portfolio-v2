"use client";

import React, { useState, useEffect } from "react";

import { TaskbarSvgIcon } from "./TaskBarIcons";

const LanguageDisplay = () => {
  const [keyboardLanguage, setKeyboardLanguage] = useState("");

  useEffect(() => {
    const { language } = navigator;
    setKeyboardLanguage(language);
  }, []);

  return (
    <TaskbarSvgIcon title="Language Display" isActive={false}>
      <p className="text-[0.75rem]">{keyboardLanguage.toUpperCase()}</p>
    </TaskbarSvgIcon>
  );
};

export default LanguageDisplay;
