import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ApiKeyModal } from "./ApiKeyModal";
import { ConversationList } from "./ConversationList";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

export function ChatInterface() {
  const [selectedConversation, setSelectedConversation] =
    useState<Id<"conversations"> | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const conversationsData = useQuery(api.chat.getConversations);
  const conversations = useMemo(
    () => conversationsData || [],
    [conversationsData]
  );
  const messages =
    useQuery(
      api.chat.getMessages,
      selectedConversation ? { conversationId: selectedConversation } : "skip"
    ) || [];
  const apiKey = useQuery(api.chat.getApiKey);

  const createConversation = useMutation(api.chat.createConversation);
  const sendMessage = useMutation(api.chat.sendMessage);

  // Auto-select first conversation or create one
  useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      setSelectedConversation(conversations[0]._id);
    }
  }, [conversations, selectedConversation]);

  // Check for API key on first load
  useEffect(() => {
    if (apiKey === null) {
      setShowApiKeyModal(true);
    }
  }, [apiKey]);

  const handleNewConversation = async () => {
    const title = `Chat ${new Date().toLocaleDateString()}`;
    const conversationId = await createConversation({ title });
    setSelectedConversation(conversationId);
    return conversationId;
  };

  const handleSendMessage = async (content: string) => {
    let conversationId = selectedConversation;

    if (!conversationId) {
      const newConversationId = await handleNewConversation();
      conversationId = newConversationId;
      if (!conversationId) return;
    }

    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    try {
      // Send the message and create the AI response with streaming
      await sendMessage({
        conversationId,
        content,
      });

      console.log(
        "Message sent successfully, AI response will stream automatically"
      );
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="flex-1 flex h-full min-h-0">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 overflow-hidden border-r border-slate-200 bg-white`}
      >
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
          onNewConversation={() => void handleNewConversation()}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h2 className="font-semibold text-slate-800">
              {selectedConversation
                ? conversations.find((c) => c._id === selectedConversation)
                    ?.title || "Chat"
                : "New Chat"}
            </h2>
          </div>
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {apiKey && apiKey !== "builtin" ? "✓ API Key Set" : "Set API Key"}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          {selectedConversation ? (
            <MessageList messages={messages} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-50">
                  <span className="text-white font-bold text-xl">AI</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  Start a new conversation
                </h3>
                <p className="text-slate-600 mb-4">
                  Ask me anything and I'll help you out!
                </p>
                <button
                  onClick={() => void handleNewConversation()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  New Chat
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        {selectedConversation && (
          <MessageInput
            onSendMessage={(content) => void handleSendMessage(content)}
          />
        )}
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <ApiKeyModal
          onClose={() => setShowApiKeyModal(false)}
          currentApiKey={apiKey || null}
        />
      )}
    </div>
  );
}
