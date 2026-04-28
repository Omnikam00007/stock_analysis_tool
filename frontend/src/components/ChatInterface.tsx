/* ─── useChatEngine ───────────────────────────────────────
   Custom hook that manages:
   - Message history
   - Sending messages to OpenAI via proxy
   - Executing tool calls and looping back results
   - Collecting tool result cards for the output panel
   ─────────────────────────────────────────────────────── */

import { useState, useRef, useEffect, useCallback } from "react";
import { sendChatToProxy, type ChatMessage } from "../services/api";
import {
  TOOL_DEFINITIONS,
  executeTool,
  type ToolResult,
} from "../services/tools";

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are StockPilot, an expert AI stock analyst and financial advisor assistant.
You have access to real-time market data tools. Use them proactively when users ask about stocks, prices, charts, indicators, or companies.

Guidelines:
- Always call the relevant tool(s) rather than guessing data.
- When asked to "analyze" a stock, call get_stock_quote, get_stock_chart, and get_technical_indicators together.
- Present your analysis in a clear, professional manner after receiving tool results.
- Use financial terminology appropriately but explain concepts when needed.
- If a user asks about multiple stocks, call tools for each one.
- For chart requests, default to 90 days unless specified otherwise.
- Be concise but thorough. Format your responses well with bold text for key numbers.`;

export default function useChatEngine() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Full conversation history for OpenAI (includes tool messages)
  const conversationRef = useRef<ChatMessage[]>([
    { role: "system", content: SYSTEM_PROMPT },
  ]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  // ── Send message ──────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Add user message
    const userMsg: DisplayMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    conversationRef.current.push({ role: "user", content: text });

    setIsLoading(true);

    try {
      await runConversationLoop();
    } catch (err) {
      const errorMsg: DisplayMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `⚠️ Error: ${(err as Error).message}. Please check that the proxy server is running and your API keys are configured.`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  // ── Conversation loop (handles tool calls) ────────────
  const runConversationLoop = async () => {
    let maxIterations = 8; // safety limit

    while (maxIterations-- > 0) {
      const response = await sendChatToProxy(
        conversationRef.current,
        TOOL_DEFINITIONS
      );
      const data = await response.json();
      const choice = data.choices?.[0];

      if (!choice) {
        throw new Error("No response from OpenAI");
      }

      const assistantMessage = choice.message;

      // Push assistant message to conversation
      conversationRef.current.push(assistantMessage);

      // If there are tool calls, execute them
      if (assistantMessage.tool_calls?.length) {
        // Execute all tool calls in parallel
        const toolCallPromises = assistantMessage.tool_calls.map(
          async (tc: { id: string; function: { name: string; arguments: string } }) => {
            const result = await executeTool(tc.function.name, tc.function.arguments);

            // Add tool result card to output panel
            setToolResults((prev) => [...prev, result]);

            // Push tool result back to conversation
            conversationRef.current.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify(result.data),
            });

            return result;
          }
        );

        await Promise.all(toolCallPromises);

        // Continue the loop — OpenAI will use the tool results
        continue;
      }

      // No tool calls — final text response
      if (assistantMessage.content) {
        const assistantDisplay: DisplayMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assistantMessage.content,
        };
        setMessages((prev) => [...prev, assistantDisplay]);
      }

      break; // Done
    }
  };

  // ── Handle suggestion chip click ──────────────────────
  const handleSuggestion = (text: string) => {
    setInput(text);
    // Focus textarea
    textareaRef.current?.focus();
  };

  // ── Handle Enter key ─────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return { messages, toolResults, input, isLoading, messagesEndRef, textareaRef, handleTextareaChange, sendMessage, handleSuggestion, handleKeyDown };
}
