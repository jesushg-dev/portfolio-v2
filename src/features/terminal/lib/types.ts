export type TerminalStepTranslation = {
  appLanguageId: string;
  languageCode: string;
  command: string;
  output: string;
};

export type TerminalStepResolved = {
  order: number;
  translations: TerminalStepTranslation[];
};

export type TerminalDisplayDTO = {
  username: string;
  commands: string[];
  outputs: Record<number, string[]>;
  typingSpeed: number;
  delayBetweenCommands: number;
};

export type TerminalEditorStepDTO = {
  id: string;
  order: number;
  translationsByLangId: Record<string, { command: string; output: string }>;
};

export type TerminalEditorDTO = {
  username: string;
  typingSpeed: number;
  delayBetweenCommands: number;
  steps: TerminalEditorStepDTO[];
};

export type TerminalUpsertInput = {
  username: string;
  typingSpeed?: number;
  delayBetweenCommands?: number;
  steps: {
    order: number;
    translations: {
      appLanguageId: string;
      command: string;
      output: string;
    }[];
  }[];
};
