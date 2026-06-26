"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { useCallback } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4 bg-white border border-slate-200 rounded-b-xl',
      },
    },
  });

  const addImage = useCallback(() => {
    const url = window.prompt('URL');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap gap-1">
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('bold') ? 'bg-slate-200 text-amber-600' : 'text-slate-700'}`}
          title="Bold"
        >
          <b>B</b>
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('italic') ? 'bg-slate-200 text-amber-600' : 'text-slate-700'}`}
          title="Italic"
        >
          <i>I</i>
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run() }}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('underline') ? 'bg-slate-200 text-amber-600' : 'text-slate-700'}`}
          title="Underline"
        >
          <u>U</u>
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run() }}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('strike') ? 'bg-slate-200 text-amber-600' : 'text-slate-700'}`}
          title="Strikethrough"
        >
          <s>S</s>
        </button>
        <div className="w-px h-6 bg-slate-300 mx-1 self-center" />
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run() }}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 text-amber-600' : 'text-slate-700'}`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-amber-600' : 'text-slate-700'}`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run() }}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-200 text-amber-600' : 'text-slate-700'}`}
          title="Heading 3"
        >
          H3
        </button>
        <div className="w-px h-6 bg-slate-300 mx-1 self-center" />
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('bulletList') ? 'bg-slate-200 text-amber-600' : 'text-slate-700'}`}
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('orderedList') ? 'bg-slate-200 text-amber-600' : 'text-slate-700'}`}
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H21M9 12H21M9 19H21M5 5h.01M5 12h.01M5 19h.01" /></svg>
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run() }}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('blockquote') ? 'bg-slate-200 text-amber-600' : 'text-slate-700'}`}
          title="Quote"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
        </button>
        <div className="w-px h-6 bg-slate-300 mx-1 self-center" />
        <button
          onClick={(e) => { e.preventDefault(); setLink() }}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('link') ? 'bg-slate-200 text-amber-600' : 'text-slate-700'}`}
          title="Link"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        </button>
        <button
          onClick={(e) => { e.preventDefault(); addImage() }}
          className="p-2 rounded hover:bg-slate-200 text-slate-700"
          title="Image"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleCodeBlock().run() }}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('codeBlock') ? 'bg-slate-200 text-amber-600' : 'text-slate-700'}`}
          title="Code Block"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
