import { v } from "convex/values";
import { query, mutation, httpAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import { PersistentTextStreaming } from "@convex-dev/persistent-text-streaming";
import { components } from "./_generated/api";
import { StreamId, StreamIdValidator } from "@convex-dev/persistent-text-streaming";

const persistentTextStreaming = new PersistentTextStreaming(
  components.persistentTextStreaming
);

export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
  },
});

// Internal version for HTTP actions (bypasses auth)
export const getMessagesInternal = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
  },
});

export const createConversation = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("conversations", {
      userId,
      title: args.title,
      lastMessageAt: Date.now(),
    });
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found");
    }

    // Insert user message
    const userMessageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: "user",
      content: args.content,
    });

    // Create a stream for the AI response
    const streamId = await persistentTextStreaming.createStream(ctx);

    // Create the AI message with streaming enabled
    const aiMessageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: "assistant",
      content: "", // Start with empty content
      streamId: streamId,
      isStreaming: true,
    });

    // Update conversation timestamp
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
    });

    return { 
      userMessageId, 
      aiMessageId,
      streamingMessageId: aiMessageId,
      streamId: streamId
    };
  },
});

export const getStreamBody = query({
  args: {
    streamId: StreamIdValidator,
  },
  handler: async (ctx, args) => {
    return await persistentTextStreaming.getStreamBody(
      ctx,
      args.streamId as StreamId
    );
  },
});

export const markStreamComplete = mutation({
  args: {
    messageId: v.id("messages"),
    finalContent: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      isStreaming: false,
      content: args.finalContent,
    });
  },
});

export const storeApiKey = mutation({
  args: { apiKey: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Simple encoding using btoa (browser-compatible base64 encoding)
    const encoded = btoa(args.apiKey);

    const existing = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { encryptedKey: encoded });
    } else {
      await ctx.db.insert("apiKeys", {
        userId,
        encryptedKey: encoded,
      });
    }
  },
});

export const getApiKey = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const apiKeyDoc = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!apiKeyDoc) return null;

    // Simple decoding using atob (browser-compatible base64 decoding)
    return atob(apiKeyDoc.encryptedKey);
  },
});

export const streamChat = httpAction(async (ctx, request) => {
  const body = (await request.json()) as {
    streamId: string;
    conversationId: string;
    userMessage: string;
    messages?: any[];
  };

  const generateChat = async (ctx: any, request: any, streamId: StreamId, chunkAppender: any) => {
    try {
      console.log("Generate chat called with streamId:", streamId);
      
      // Get the message that we're streaming to
      const message = await ctx.runQuery(api.chat.getMessageByStreamId, { streamId });
      if (!message) {
        console.error("No message found for streamId:", streamId);
        await chunkAppender("Error: Message not found");
        return;
      }

      // Get conversation history from the conversation
      const allMessages = await ctx.runQuery(api.chat.getMessagesInternal, { 
        conversationId: message.conversationId 
      });

      // Get the user's latest message (the one that triggered this response)
      const userMessages = allMessages.filter((m: any) => m.role === "user");
      const latestUserMessage = userMessages[userMessages.length - 1];
      
      if (!latestUserMessage) {
        await chunkAppender("안녕하세요! 무엇을 도와드릴까요?");
        await ctx.runMutation(api.chat.markStreamComplete, {
          messageId: message._id,
          finalContent: "안녕하세요! 무엇을 도와드릴까요?",
        });
        return;
      }

      // Simple echo response for testing
      const userContent = latestUserMessage.content;
      const response = `안녕하세요! "${userContent}"라고 말씀하셨네요. 저는 AI 어시스턴트입니다. 어떻게 도와드릴까요?`;
      
      // Stream the response character by character for testing
      for (let i = 0; i < response.length; i++) {
        await chunkAppender(response[i]);
        // Add a small delay to see the streaming effect
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Mark the message as complete
      await ctx.runMutation(api.chat.markStreamComplete, {
        messageId: message._id,
        finalContent: response,
      });

      console.log("Stream completed successfully");

    } catch (error) {
      console.error("Chat generation error:", error);
      const errorMessage = "죄송합니다. 응답 중 오류가 발생했습니다.";
      await chunkAppender(errorMessage);
      
      // Try to mark the message as complete even on error
      try {
        const message = await ctx.runQuery(api.chat.getMessageByStreamId, { streamId });
        if (message) {
          await ctx.runMutation(api.chat.markStreamComplete, {
            messageId: message._id,
            finalContent: errorMessage,
          });
        }
      } catch (e) {
        console.error("Failed to mark message as complete on error:", e);
      }
    }
  };

  const response = await persistentTextStreaming.stream(
    ctx,
    request,
    body.streamId as StreamId,
    generateChat
  );

  // Set CORS headers appropriately.
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Vary", "Origin");
  return response;
});

// Helper queries for the HTTP action
export const getMessageByStreamId = query({
  args: { streamId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("streamId"), args.streamId))
      .first();
  },
});

export const getConversationById = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

export const getApiKeyByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});
