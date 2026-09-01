"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Link from "@tiptap/extension-link";
import { common, createLowlight } from "lowlight";
import type { Content } from "@tiptap/core";
import { useEffect } from "react";

import { cn } from "@/lib/utils";
import { slugifyHeading } from "@/features/blog/lib/blog-headings";

import "@/features/blog/styles/blog-prose.css";

const lowlight = createLowlight(common);

interface TiptapRendererProps {
  content: string;
  className?: string;
}

export function TiptapRenderer({ content, className }: TiptapRendererProps) {
  const editor = useEditor({
    immediatelyRender: false,
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
        class: cn("blog-prose outline-none", className),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    const applyHeadingIds = () => {
      const headings = editor.view.dom.querySelectorAll("h1, h2, h3");
      headings.forEach((heading) => {
        const text = heading.textContent?.trim() ?? "";
        if (!text) return;
        const id = slugifyHeading(text);
        if (id) heading.setAttribute("id", id);
      });
    };

    applyHeadingIds();
    editor.on("update", applyHeadingIds);
    return () => {
      editor.off("update", applyHeadingIds);
    };
  }, [editor, content]);

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}

function tryParseJson(value: string): Content | string {
  try {
    return JSON.parse(value) as Content;
  } catch {
    return value;
  }
}
