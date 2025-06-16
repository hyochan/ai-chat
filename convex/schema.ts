import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  conversations: defineTable({
    userId: v.id("users"),
    title: v.string(),
    lastMessageAt: v.number(),
  }).index("by_user", ["userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    streamId: v.optional(v.string()),
    isStreaming: v.optional(v.boolean()),
    streamingComplete: v.optional(v.boolean()),
  }).index("by_conversation", ["conversationId"]),

  apiKeys: defineTable({
    userId: v.id("users"),
    encryptedKey: v.string(),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
