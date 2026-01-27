"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
  Printer,
  Save,
  Loader2,
  Table as TableIcon,
  Trash2,
} from "lucide-react";
import { useRef, useEffect } from "react";

interface DocumentEditorProps {
  initialContent: string;
  title: string;
  onSave?: (html: string) => Promise<void>;
  isSaving?: boolean;
}

export default function DocumentEditor({
  initialContent,
  title,
  onSave,
  isSaving = false,
}: DocumentEditorProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[500px] p-6",
        style: "font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.6;",
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  const handlePrint = () => {
    if (!editor) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4; margin: 2cm; }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 13pt;
            line-height: 1.6;
            color: #000;
          }
          h1 { font-size: 16pt; text-transform: uppercase; text-align: center; }
          h2 { font-size: 14pt; }
          p { margin: 0.5em 0; }
          table { width: 100%; border-collapse: collapse; margin: 1em 0; }
          th, td { border: 1px solid #000; padding: 8px; }
          th { background: #f0f0f0; font-weight: bold; }
          ul, ol { margin: 0.5em 0; padding-left: 2em; }
          .ProseMirror { outline: none; }
        </style>
      </head>
      <body>${editor.getHTML()}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleSave = async () => {
    if (!editor || !onSave) return;
    await onSave(editor.getHTML());
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-gray-200 transition-colors ${
        isActive ? "bg-blue-100 text-blue-600" : "text-gray-700"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">
        {/* History */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Hoàn tác (Ctrl+Z)"
        >
          <Undo size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Làm lại (Ctrl+Y)"
        >
          <Redo size={18} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="In đậm (Ctrl+B)"
        >
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="In nghiêng (Ctrl+I)"
        >
          <Italic size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Gạch chân (Ctrl+U)"
        >
          <UnderlineIcon size={18} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Căn trái"
        >
          <AlignLeft size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Căn giữa"
        >
          <AlignCenter size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Căn phải"
        >
          <AlignRight size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
          title="Căn đều"
        >
          <AlignJustify size={18} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Danh sách"
        >
          <List size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Danh sách đánh số"
        >
          <ListOrdered size={18} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Table */}
        <ToolbarButton
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          title="Chèn bảng"
        >
          <TableIcon size={18} />
        </ToolbarButton>
        {editor.isActive("table") && (
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteTable().run()}
            title="Xóa bảng"
          >
            <Trash2 size={18} />
          </ToolbarButton>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        {onSave && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Lưu
          </button>
        )}
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
        >
          <Printer size={16} />
          In
        </button>
      </div>

      {/* Editor */}
      <div ref={printRef} className="bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Editor styles */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror h1 {
          font-size: 18pt;
          font-weight: bold;
          text-align: center;
          margin: 1em 0;
        }
        .ProseMirror h2 {
          font-size: 14pt;
          font-weight: bold;
          margin: 0.8em 0;
        }
        .ProseMirror h3 {
          font-size: 13pt;
          font-weight: bold;
          margin: 0.6em 0;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
        }
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        .ProseMirror th,
        .ProseMirror td {
          border: 1px solid #ccc;
          padding: 8px;
          text-align: left;
        }
        .ProseMirror th {
          background: #f5f5f5;
          font-weight: bold;
        }
        .ProseMirror .tableWrapper {
          overflow-x: auto;
        }
        .ProseMirror-selectednode {
          outline: 2px solid #68cef8;
        }
      `}</style>
    </div>
  );
}
