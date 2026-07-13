export interface TerminalStepTranslation {
  appLanguageId: string;
  languageCode: string;
  command: string;
  output: string;
}

export interface TerminalStepResolved {
  order: number;
  translations: TerminalStepTranslation[];
}

export interface TerminalDisplayDTO {
  username: string;
  commands: string[];
  outputs: Record<number, string[]>;
  typingSpeed: number;
  delayBetweenCommands: number;
}

export interface TerminalEditorStepDTO {
  id: string;
  order: number;
  translations: Record<string, { command: string; output: string }>;
}

export interface TerminalEditorDTO {
  username: string;
  typingSpeed: number;
  delayBetweenCommands: number;
  steps: TerminalEditorStepDTO[];
}
