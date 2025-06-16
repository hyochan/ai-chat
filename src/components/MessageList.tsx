import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useStream } from "@convex-dev/persistent-text-streaming/react";
import { StreamId } from "@convex-dev/persistent-text-streaming";

interface Message {
  _id: Id<"messages">;
  conversationId: Id<"conversations">;
  role: "user" | "assistant";
  content: string;
  streamId?: string;
  isStreaming?: boolean;
  _creationTime: number;
}

interface MessageListProps {
  messages: Message[];
}

function StreamingMessage({ message }: { message: Message }) {
  // Convex site URL for HTTP actions - convert .cloud to .site
  const convexApiUrl = import.meta.env.VITE_CONVEX_URL;
  const convexSiteUrl = convexApiUrl?.replace('.convex.cloud', '.convex.site') || window.location.origin;
  
  // For newly created streaming messages, this component should drive the stream
  const isDriven = message.isStreaming === true;
  
  const { text, status } = useStream(
    api.chat.getStreamBody,
    new URL(`${convexSiteUrl}/chat-stream`),
    isDriven, // Drive the stream if the message is actively streaming
    message.streamId as StreamId
  );

  // Use streamed text if available and streaming, otherwise use message content
  const displayText = (status === "streaming" && text) ? text : message.content;
  const isActive = status === "streaming" || message.isStreaming;

  return (
    <div className="whitespace-pre-wrap break-words">
      {displayText}
      {isActive && (
        <span className="inline-block w-2 h-5 bg-current opacity-75 animate-pulse ml-1" />
      )}
    </div>
  );
}

export function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 opacity-50">
            <span className="text-white font-bold">AI</span>
          </div>
          <p className="text-slate-600">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {messages.map((message) => (
        <div
          key={message._id}
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
        >
          <div className={`flex gap-3 max-w-3xl ${message.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.role === "user" 
                ? "bg-slate-200" 
                : "bg-gradient-to-br from-blue-500 to-purple-600"
            }`}>
              {message.role === "user" ? (
                <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              ) : (
                <span className="text-white font-bold text-xs">AI</span>
              )}
            </div>

            {/* Message Content */}
            <div className={`rounded-2xl px-4 py-3 ${
              message.role === "user"
                ? "bg-blue-500 text-white"
                : "bg-white border border-slate-200 text-slate-800"
            }`}>
              {message.role === "assistant" && message.streamId ? (
                <StreamingMessage message={message} />
              ) : (
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              )}
              
              {message.role === "assistant" && message.isStreaming && !message.streamId && (
                <div className="flex items-center gap-1 mt-2 text-slate-500">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs">AI is typing...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
