import { ChatInput } from "@/components/custom/chatinput";
import { PreviewMessage, ThinkingMessage } from "../../components/custom/message";
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { useState, useRef, useEffect } from "react";
import { message } from "../../interfaces/interfaces";
import { Overview } from "@/components/custom/overview";
import { Header } from "@/components/custom/header";
import { v4 as uuidv4 } from 'uuid';
import OpenAI from "openai";
import { Sidebar } from "@/components/custom/sidebar";
import { db } from "@/firebase/firebaseConfig";
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export function Chat() {
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();
  const [messages, setMessages] = useState<message[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chats, setChats] = useState<{ id: string; name: string }[]>([]);
  const chatCounterRef = useRef(0); // Centralized counter for chat names

  useEffect(() => {
    // Listen for real-time updates from Firebase
    const unsubscribe = onSnapshot(collection(db, "chats"), (snapshot) => {
      const chatsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as { id: string; name: string }));
      setChats(chatsData);

      // Update the counter to ensure it reflects the number of chats in the database
      chatCounterRef.current = chatsData.length;
    });

    return () => unsubscribe();
  }, []);

  const handleCreateNewChat = async () => {
    try {
      const id = Date.now().toString(); // Generate a unique ID
      const name = `Chat ${chatCounterRef.current + 1}`; // Include the ID in the chat name

      // Add a new chat to Firebase
      await addDoc(collection(db, "chats"), { id, name });
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      // Delete the chat from Firebase
      await deleteDoc(doc(db, "chats", chatId));
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

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
    <div className="flex flex-row min-w-0 h-dvh bg-background">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onDeleteChat={handleDeleteChat}
        className={`transition-transform transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 w-64 bg-background border-r z-10 md:w-64`}
        chats={chats} // Pass chats from Firebase
        onCreateNewChat={handleCreateNewChat} // Pass centralized handler to Sidebar
      />
      <div className={`flex flex-col flex-1 transition-all ${isSidebarOpen ? "md:ml-64" : "md:ml-0"}`}>
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onCreateNewChat={handleCreateNewChat} // Pass centralized handler to Header
        />
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
    </div>
  );
};