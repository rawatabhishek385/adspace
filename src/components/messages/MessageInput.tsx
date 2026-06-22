"use client";

import { useState, useRef, useEffect } from "react";
import AttachmentButton from "./AttachmentButton";
import EmojiPickerButton from "./EmojiPickerButton";
import ReplyPreview from "./ReplyPreview";

export interface SendMessageData {
  content: string;
  messageType?: "TEXT" | "IMAGE" | "FILE";
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

interface MessageInputProps {
  onSend: (data: SendMessageData) => Promise<void>;
  onTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  blockedMessage?: string;
  replyTo?: { id: string; content: string; senderName: string; messageType: string; fileName?: string; isDeleted?: boolean } | null;
  onCancelReply?: () => void;
}

export default function MessageInput({ onSend, onTyping, onStopTyping, disabled = false, blockedMessage = "This conversation is closed.", replyTo, onCancelReply }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    if (onTyping && onStopTyping) {
      onTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onStopTyping();
      }, 1000);
    }
  };

  const handleSendText = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending || disabled) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    onStopTyping?.();

    setIsSending(true);
    const previousMessage = trimmed;
    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      await onSend({ content: previousMessage, messageType: "TEXT" });
      onCancelReply?.();
    } catch (err) {
      setMessage(previousMessage); // Restore on error
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  const uploadFile = async (file: File) => {
    if (isSending || disabled) return;
    setIsSending(true);

    const isImage = file.type.startsWith("image/");
    const endpoint = isImage ? "/api/messages/upload-image" : "/api/messages/upload-file";

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(endpoint, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      await onSend({
        content: "",
        messageType: isImage ? "IMAGE" : "FILE",
        imageUrl: isImage ? data.url : undefined,
        fileUrl: !isImage ? data.url : undefined,
        fileName: !isImage ? data.name : undefined,
        fileSize: !isImage ? data.size : undefined,
      });
      onCancelReply?.();
    } catch (error) {
      console.error("Failed to upload media:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  if (disabled) {
    return (
      <div className="p-4 bg-white/80 border-t border-slate-200 backdrop-blur shrink-0 flex justify-center z-20 relative">
        <div className="w-full max-w-4xl py-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center gap-3 text-red-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm font-medium">{blockedMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`p-4 bg-white/90 border-t border-slate-200 backdrop-blur shrink-0 transition-colors z-20 relative ${isDragging ? "bg-indigo-50/90" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="max-w-4xl mx-auto">
        {replyTo && (
          <ReplyPreview 
            content={replyTo.content} 
            senderName={replyTo.senderName} 
            onClose={onCancelReply} 
            messageType={replyTo.messageType as any}
            fileName={replyTo.fileName}
            isDeleted={replyTo.isDeleted}
          />
        )}
        
        <div className="flex items-end gap-2">
          <div className="shrink-0 flex items-center mb-1 gap-1">
            <AttachmentButton onFileSelect={uploadFile} disabled={isSending} />
          </div>

          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-100 transition-all flex items-end shadow-sm">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              placeholder={isDragging ? "Drop file to upload..." : "Message..."}
              className="w-full bg-transparent pl-4 pr-2 py-3 text-slate-800 placeholder-slate-400 focus:outline-none resize-none min-h-[48px] max-h-[120px] scrollbar-thin block"
              rows={1}
              maxLength={1000}
            />
            <div className="shrink-0 p-1 mb-0.5">
              <EmojiPickerButton onEmojiSelect={handleEmojiSelect} />
            </div>
          </div>

          <button
            onClick={handleSendText}
            disabled={(!message.trim() && !isSending) || isSending}
            className="w-12 h-12 shrink-0 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/20 mb-0.5 focus:outline-none focus:ring-4 focus:ring-indigo-100"
          >
            {isSending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-1 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {message.length > 900 && (
          <p className="text-xs text-orange-400 mt-2 text-right">
            {message.length} / 1000
          </p>
        )}
      </div>
    </div>
  );
}
