import type { UIMessage } from "@ai-sdk/react";
import type { ToolCallPart } from "./types";

// Extract text content from message parts
export function getMessageText(message: UIMessage): string {
  if (!message.parts || message.parts.length === 0) {
    return "";
  }
  return message.parts
    .filter((part: any) => part.type === "text")
    .map((part: any) => (part as { type: "text"; text: string }).text)
    .join("\n");
}

// Check if message has tool calls (parts starting with "tool-")
export function getToolParts(message: UIMessage): ToolCallPart[] {
  if (!message.parts || message.parts.length === 0) {
    return [];
  }
  return message.parts
    .filter((part: any) => part.type.startsWith("tool-"))
    .map((part: any) => part as unknown as ToolCallPart);
}

// Get human-readable tool name
export function getToolDisplayName(toolName: string): string {
  const toolNames: Record<string, string> = {
    searchProducts: "Searching products",
    getMyOrders: "Getting your orders",
  };
  return toolNames[toolName] || toolName;
}
