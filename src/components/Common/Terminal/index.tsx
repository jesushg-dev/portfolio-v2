import React, { FC, useEffect } from 'react';

import { useThemeContext } from '@/hoc/ThemeContextProvider';

import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';

import 'highlight.js/styles/github-dark.css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);

interface ITerminalProps {
  language: 'javascript' | 'typescript';
  code: string;
}

const Terminal: FC<ITerminalProps> = ({ language, code }) => {
  const { isDark } = useThemeContext();

  useEffect(() => {
    hljs.highlightAll(); // Highlight all code blocks on initial render
  }, []);

  return (
    <div
      className={`text-neutralText-50 w-full flex flex-col overflow-hidden rounded-lg bg-background-900 shadow-2xl theme-main-${
        isDark ? 'dark' : 'light'
      }`}>
      <div className="border-b border-gray-800 px-4 py-2">
        <div className="mr-2 inline-block h-3 w-3 rounded-full bg-red-500" />
        <div className="mr-2 inline-block h-3 w-3 rounded-full bg-yellow-300" />
        <div className="mr-2 inline-block h-3 w-3 rounded-full bg-green-400" />
      </div>
      <pre className="-ml-6 flex flex-grow">
        <code className="hljs flex-grow">{code}</code>
      </pre>
    </div>
  );
};

export default Terminal;
