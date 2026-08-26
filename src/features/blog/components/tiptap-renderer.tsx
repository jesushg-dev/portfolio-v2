"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Link from "@tiptap/extension-link";
import { common, createLowlight } from "lowlight";
import type { Content } from "@tiptap/core";
import { useEffect, useRef } from "react";

const lowlight = createLowlight(common);

interface TiptapRendererProps {
  content: string;
  className?: string;
}

export function TiptapRenderer({ content, className }: TiptapRendererProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ inline: false }),
      Youtube.configure({ width: 640, height: 360 }),
      Link.configure({ openOnClick: true }),
    ],
     
    content: tryParseJson(content),
    editable: false,
    editorProps: {
      attributes: {
        class: `prose prose-lg dark:prose-invert max-w-none ${className ?? ""}`,
      },
    },
  });

  useEffect(() => {
    if (!wrapperRef.current) return;
    const headings = wrapperRef.current.querySelectorAll("h1, h2, h3");
    headings.forEach((heading) => {
      const text = heading.textContent?.trim() ?? "";
      if (!text) return;
      const id = text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]+/gu, "")
        .trim()
        .replace(/\s+/g, "-");
      if (id) heading.setAttribute("id", id);
    });
  }, [content]);

  if (!editor) return null;

  return (
    <div ref={wrapperRef}>
      <EditorContent editor={editor} />
    </div>
  );
}

function tryParseJson(value: string): Content | string {
  try {
    return JSON.parse(value) as Content;
  } catch {
    return value;
  }
}
