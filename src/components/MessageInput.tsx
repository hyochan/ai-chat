import { useState, useRef, useEffect } from "react";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
}

export function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const content = message.trim();
    setMessage("");
    setIsLoading(true);

    try {
      onSendMessage(content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      void handleSubmit(e);
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      <form onSubmit={(e) => void handleSubmit(e)} className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[52px] max-h-32 bg-slate-50"
              rows={1}
              disabled={isLoading}
            />
            <div className="absolute right-3 bottom-3">
              {message.trim() && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="p-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-full transition-colors"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <span>AI can make mistakes. Please verify important information.</span>
          <span>{message.length}/2000</span>
        </div>
      </form>
    </div>
  );
}
