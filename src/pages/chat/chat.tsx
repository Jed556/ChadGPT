import { ChatInput } from "@/components/custom/chatinput";
import { PreviewMessage, ThinkingMessage } from "../../components/custom/message";
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { useState, useRef } from "react";
import { message } from "../../interfaces/interfaces"
import { Overview } from "@/components/custom/overview";
import { Header } from "@/components/custom/header";
import { v4 as uuidv4 } from 'uuid';
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export function Chat() {
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();
  const [messages, setMessages] = useState<message[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);

  const cleanupMessageHandler = () => {
    if (messageHandlerRef.current) {
      messageHandlerRef.current = null;
    }
  };

  async function handleSubmit(text?: string) {
    if (isLoading) return;

    const messageText = text || question;
    setIsLoading(true);
    cleanupMessageHandler();

    const traceId = uuidv4();
    setMessages(prev => [...prev, { content: messageText, role: "user", id: traceId }]);
    setQuestion("");

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: messageText },
        ],
      });

      const assistantMessage = response.choices[0].message.content;

      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        const newContent = lastMessage?.role === "assistant"
          ? (lastMessage.content ?? "") + assistantMessage
          : assistantMessage;

        const newMessage = { content: newContent, role: "assistant", id: traceId } as message;
        return lastMessage?.role === "assistant"
          ? [...prev.slice(0, -1), newMessage]
          : [...prev, newMessage];
      });
    } catch (error) {
      console.error("OpenAI API error:", error);
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        const errorMessage = error instanceof Error && error.message ? error.message : "An unknown error occurred.";
        const newMessage = { content: "Error: " + errorMessage, role: "error", id: traceId } as message;
        return lastMessage?.role === "assistant"
          ? [...prev.slice(0, -1), newMessage]
          : [...prev, newMessage];
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerateImage(text?: string) {
    if (isLoading) return;

    const messageText = text || question;
    setIsLoading(true);
    cleanupMessageHandler();

    const traceId = uuidv4();
    setMessages(prev => [...prev, { content: messageText, role: "user", id: traceId }]);
    setQuestion("");
    try {
      const response = await client.images.generate({
        prompt: messageText,
        n: 1,
        size: '512x512',
      });

      const imageUrl = response.data[0].url;

      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        const newMessage = { content: imageUrl, role: "assistant", id: traceId } as message;
        return lastMessage?.role === "assistant"
          ? [...prev.slice(0, -1), newMessage]
          : [...prev, newMessage];
      });
    }
    catch (error) {
      console.error("OpenAI API error:", error);
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        const errorMessage = error instanceof Error && error.message ? error.message : "An unknown error occurred.";
        const newMessage = { content: "Error: " + errorMessage, role: "error", id: traceId } as message;
        return lastMessage?.role === "assistant"
          ? [...prev.slice(0, -1), newMessage]
          : [...prev, newMessage];
      });
    }
    finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <Header />
      <div className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4" ref={messagesContainerRef}>
        {messages.length == 0 && <Overview />}
        {messages.map((message, index) => (
          <PreviewMessage key={index} message={message} />
        ))}
        {isLoading && <ThinkingMessage />}
        <div ref={messagesEndRef} className="shrink-0 min-w-[24px] min-h-[24px]" />
      </div>
      <div className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
        <ChatInput
          question={question}
          setQuestion={setQuestion}
          onSubmit={handleSubmit}
          onGenerateImage={handleGenerateImage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};