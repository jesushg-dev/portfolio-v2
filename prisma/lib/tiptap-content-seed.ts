export type TiptapBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bulletList"; items: string[] }
  | { type: "orderedList"; items: string[] }
  | { type: "blockquote"; text: string }
  | { type: "code"; language: string; text: string };

export interface TiptapDocument {
  type: "doc";
  content: Record<string, unknown>[];
}

function textNode(text: string) {
  return { type: "text", text };
}

function paragraph(text: string) {
  return {
    type: "paragraph",
    content: [textNode(text)],
  };
}

function heading(level: 1 | 2 | 3, text: string) {
  return {
    type: "heading",
    attrs: { level },
    content: [textNode(text)],
  };
}

function bulletList(items: string[]) {
  return {
    type: "bulletList",
    content: items.map((item) => ({
      type: "listItem",
      content: [paragraph(item)],
    })),
  };
}

function orderedList(items: string[]) {
  return {
    type: "orderedList",
    content: items.map((item) => ({
      type: "listItem",
      content: [paragraph(item)],
    })),
  };
}

function blockquote(text: string) {
  return {
    type: "blockquote",
    content: [paragraph(text)],
  };
}

function codeBlock(language: string, text: string) {
  return {
    type: "codeBlock",
    attrs: { language },
    content: [textNode(text)],
  };
}

export function buildTiptapDocument(blocks: TiptapBlock[]): TiptapDocument {
  const content = blocks.map((block) => {
    switch (block.type) {
      case "heading":
        return heading(block.level, block.text);
      case "paragraph":
        return paragraph(block.text);
      case "bulletList":
        return bulletList(block.items);
      case "orderedList":
        return orderedList(block.items);
      case "blockquote":
        return blockquote(block.text);
      case "code":
        return codeBlock(block.language, block.text);
      default:
        return paragraph("");
    }
  });

  return { type: "doc", content };
}

export function serializeTiptapDocument(blocks: TiptapBlock[]): string {
  return JSON.stringify(buildTiptapDocument(blocks));
}
