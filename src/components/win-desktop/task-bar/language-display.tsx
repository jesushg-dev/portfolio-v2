"use client";

import { useState } from "react";

import { TaskbarSvgIcon } from "./task-bar-icons";

const LanguageDisplay = () => {
  const [keyboardLanguage] = useState(
    typeof navigator !== "undefined" ? navigator.language : "",
  );

  return (
    <TaskbarSvgIcon title="Language Display" isActive={false}>
      <p className="text-[0.75rem]">{keyboardLanguage.toUpperCase()}</p>
    </TaskbarSvgIcon>
  );
};

export default LanguageDisplay;
