// src/components/RichTextEditor.tsx

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button, Space, Tooltip, Divider } from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  UndoOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import "./RichTextEditor.css"; // Chúng ta sẽ tạo file CSS này ngay sau đây

// Thanh công cụ cho trình soạn thảo
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <Space
      split={<Divider type="vertical" />}
      wrap
      style={{
        padding: "8px",
        border: "1px solid #d9d9d9",
        borderRadius: "5px 5px 0 0",
        borderBottom: "none",
      }}
    >
      <Tooltip title="In đậm">
        <Button
          type={editor.isActive("bold") ? "primary" : "text"}
          icon={<BoldOutlined />}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
      </Tooltip>
      <Tooltip title="In nghiêng">
        <Button
          type={editor.isActive("italic") ? "primary" : "text"}
          icon={<ItalicOutlined />}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
      </Tooltip>
      <Tooltip title="Gạch ngang">
        <Button
          type={editor.isActive("strike") ? "primary" : "text"}
          icon={<StrikethroughOutlined />}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
      </Tooltip>
      <Tooltip title="Danh sách gạch đầu dòng">
        <Button
          type={editor.isActive("bulletList") ? "primary" : "text"}
          icon={<UnorderedListOutlined />}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
      </Tooltip>
      <Tooltip title="Danh sách số">
        <Button
          type={editor.isActive("orderedList") ? "primary" : "text"}
          icon={<OrderedListOutlined />}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
      </Tooltip>
      <Tooltip title="Hoàn tác">
        <Button
          icon={<UndoOutlined />}
          onClick={() => editor.chain().focus().undo().run()}
        />
      </Tooltip>
      <Tooltip title="Làm lại">
        <Button
          icon={<RedoOutlined />}
          onClick={() => editor.chain().focus().redo().run()}
        />
      </Tooltip>
    </Space>
  );
};

// Component RichTextEditor chính, tương thích với Form của AntD
const RichTextEditor = ({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
  });

  return (
    <div className="tiptap-editor-wrapper">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
