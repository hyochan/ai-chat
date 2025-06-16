import { Id } from "../../convex/_generated/dataModel";

interface Conversation {
  _id: Id<"conversations">;
  title: string;
  lastMessageAt: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Id<"conversations"> | null;
  onSelectConversation: (id: Id<"conversations">) => void;
  onNewConversation: () => void;
}

export function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  onNewConversation,
}: ConversationListProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <button
          onClick={onNewConversation}
          className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            <p>No conversations yet</p>
            <p className="text-sm mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conversation) => (
              <button
                key={conversation._id}
                onClick={() => onSelectConversation(conversation._id)}
                className={`w-full p-3 rounded-lg text-left transition-colors mb-1 ${
                  selectedConversation === conversation._id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="font-medium text-slate-800 truncate">
                  {conversation.title}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  {new Date(conversation.lastMessageAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
