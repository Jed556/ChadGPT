import { Header } from "@/components/custom/header";
import { Overview } from "@/components/custom/overview";
import { Sidebar } from "@/components/custom/sidebar";
import { ChatInput } from "@/components/custom/chatinput";
import { PreviewMessage, ThinkingMessage } from "../../components/custom/message";
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { Footer } from "@/components/custom/footer";
import { message } from "../../interfaces/interfaces";
import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import OpenAI from "openai";
import { GoogleGenAI, Modality } from "@google/genai";
import { fireStore } from "@/firebase/firebaseConfig";
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, setDoc, getDocs, orderBy, where } from "firebase/firestore";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export function Chat() {
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();
  const [messages, setMessages] = useState<message[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chats, setChats] = useState<{ id: string; name: string }[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const chatCounterRef = useRef(0);
  const currentAccountId = "jed556";

  useEffect(() => {
    const unsubscribe = fetchChats(); // Ensure fetchChats returns the unsubscribe function
    setMessages([]);
    setActiveChatId(null);
    return () => unsubscribe(); // Cleanup the listener on unmount
  }, [currentAccountId]); // Trigger when currentAccountId changes

  useEffect(() => {
    if (activeChatId) {
      const unsubscribe = fetchMessages(activeChatId); // Fetch messages for the active chat
      return () => unsubscribe(); // Cleanup the listener on unmount
    }
  }, [activeChatId]); // Fetch messages when activeChatId changes

  // Fetch chats from Firestore
  const fetchChats = () => {
    const chatsQuery = query(
      collection(fireStore, "chats"),
      where("accountId", "==", currentAccountId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as { id: string; name: string }));
      setChats(chatsData);
      chatCounterRef.current = chatsData.length;

      if (!activeChatId && chatsData.length > 0) {
        setActiveChatId(chatsData[0].id);
      }
    });

    setActiveChatId(null); // Reset active chat ID when fetching chats

    return () => unsubscribe();
  };

  // Fetch messages for the selected chat
  const fetchMessages = (chatId: string) => {
    const messagesQuery = query(
      collection(fireStore, `chats/${chatId}/messages`),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as message[];
      setMessages(messagesData);
    });

    return () => unsubscribe();
  };

  // Create a new chat
  const createNewChat = async (): Promise<string> => {
    const name = `Chat ${chatCounterRef.current + 1}`;
    const createdAt = new Date().toISOString();
    const accountId = currentAccountId;

    const newChatRef = await addDoc(collection(fireStore, "chats"), { name, accountId, createdAt });
    console.log("Chat created successfully:", { id: newChatRef.id, name, accountId, createdAt });

    setActiveChatId(newChatRef.id);
    //fetchMessages(newChatRef.id);
    return newChatRef.id;
  };

  // Save message to Firestore with retry logic
  const saveMessage = async (chatId: string, message: message, maxRetries = 5, delay = 3000) => {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        const messageRef = doc(fireStore, `chats/${chatId}/messages`, message.id);
        await setDoc(messageRef, message);
        console.log("Message saved to Firestore with ID:", message.id, "after", attempts + 1, "attempt(s).");
        return; // Exit the loop if successful
      } catch (error) {
        attempts++;
        console.error(`Attempt ${attempts} to save message failed:`, error);
        if (attempts >= maxRetries) {
          throw new Error("Failed to save message after maximum retries.");
        }
        await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
      }
    }
  };

  // Delete chat from Firestore
  const deleteChat = async (chatId: string) => {
    const chatRef = doc(fireStore, "chats", chatId);
    await deleteDoc(chatRef);
    console.log("Chat deleted successfully:", chatId);

    // Reset active chat and messages if the deleted chat was active
    if (activeChatId === chatId) {
      setActiveChatId(null);
      //setMessages([]);
    }
  };

  // Function to check if a chat is inactive and empty, and delete it if necessary
  const deleteEmptyChat = async (chatId: string) => {
    // Check if the chat is inactive before deleting
    if (chatId === activeChatId) {
      //console.log(`Chat with ID: ${chatId} is active and will not be deleted.`);
      return false;
    }

    // Check if the chat is empty
    const messagesQuery = collection(fireStore, `chats/${chatId}/messages`);
    const snapshot = await getDocs(messagesQuery);

    if (snapshot.empty) {
      // Delete the chat if it has no messages
      await deleteChat(chatId);
      console.log(`Deleted inactive and empty chat with ID: ${chatId}`);
      return true; // Indicate that the chat was deleted
    }

    console.log(`Chat with ID: ${chatId} is not empty and will not be deleted.`);
    return false; // Indicate that the chat was not deleted
  };

  // Function to handle selecting a chat
  const handleSelectChat = async (chatId: string) => {
    // Delete if chat is inactive and empty before switching to a new chat
    const wasDeleted = await deleteEmptyChat(activeChatId || "");

    // ...else, fetch messages for the new selected chat
    if (!wasDeleted) {
      setActiveChatId(chatId);
      //fetchMessages(chatId);
    }
  };

  // Handle message submission
  const handleSubmit = async (text?: string) => {
    if (isLoading) return;

    const messageText = text || question;
    setIsLoading(true);
    const traceId = uuidv4();

    const newMessage: message = {
      id: traceId,
      content: messageText,
      role: "user",
      accountId: currentAccountId,
      createdAt: new Date().toISOString(),
    };

    setQuestion("");

    let chatId = activeChatId;

    if (!chatId) {
      chatId = await createNewChat();
    }
    await saveMessage(chatId, newMessage);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: messageText },
        ],
      });

      const assistantMessage: message = {
        id: uuidv4(),
        content: response.choices[0].message.content ?? "No response provided.",
        role: "assistant",
        accountId: currentAccountId,
        createdAt: new Date().toISOString(),
      };

      await saveMessage(chatId, assistantMessage);
    } catch (error) {
      console.error("OpenAI API failed, trying Gemini API:", error);

      try {
        const geminiResponse = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: messageText,
        });

        const assistantMessage: message = {
          id: uuidv4(),
          content: geminiResponse.text || "No response provided by Gemini.",
          role: "assistant",
          accountId: currentAccountId,
          createdAt: new Date().toISOString(),
        };

        await saveMessage(chatId, assistantMessage);
      } catch (geminiError) {
        console.error("Gemini API also failed:", geminiError);

        const errorMessage: message = {
          id: uuidv4(),
          content: "Error: Both OpenAI and Gemini APIs failed.",
          role: "error",
          accountId: currentAccountId,
          createdAt: new Date().toISOString(),
        };

        await saveMessage(chatId, errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image generation
  const handleGenerateImage = async (text?: string) => {
    if (isLoading) return;

    const messageText = text || question;
    setIsLoading(true);
    const traceId = uuidv4();

    const newMessage: message = {
      id: traceId,
      content: messageText,
      role: "user",
      accountId: currentAccountId,
      createdAt: new Date().toISOString(),
    };

    setQuestion("");

    let chatId = activeChatId;

    if (!chatId) {
      chatId = await createNewChat();
    }
    await saveMessage(chatId, newMessage);

    try {
      const response = await client.images.generate({
        model: "dall-e-3",
        prompt: messageText,
        n: 1,
        quality: "hd",
        size: "1024x1024",
        response_format: "url",
      });

      const imageUrl = response.data[0].url;
      const assistantMessage: message = {
        id: uuidv4(),
        content: "Here is the generated image:",
        role: "assistant",
        accountId: currentAccountId,
        createdAt: new Date().toISOString(),
        image: { type: "url", data: imageUrl || "" },
      };

      await saveMessage(chatId, assistantMessage);
    } catch (error) {
      console.error("OpenAI image generation failed, trying Gemini API:", error);

      let imageData = "";

      try {
        const geminiResponse = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp-image-generation",
          contents: messageText,
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
          },
        });

        if (geminiResponse?.candidates?.[0]?.content?.parts) {
          const parts = geminiResponse.candidates[0].content.parts;
          let description = "";

          for (const part of parts) {
            if (part.text) {
              description = part.text;
            } else if (part.inlineData?.data) {
              imageData = part.inlineData.data;
            }
          }

          if (imageData) {
            const assistantMessage: message = {
              id: uuidv4(),
              content: description || "Here is the generated image:",
              role: "assistant",
              accountId: currentAccountId,
              createdAt: new Date().toISOString(),
              image: { type: "base64", data: imageData }, // Save base64 image
            };

            await saveMessage(chatId, assistantMessage);
          } else {
            throw new Error("Gemini API returned no image data.");
          }
        } else {
          throw new Error("Gemini response is missing candidates or parts.");
        }
      } catch (geminiError) {
        if (imageData) return;

        console.error("Gemini API also failed:", geminiError);

        const errorMessage: message = {
          id: uuidv4(),
          content: "Error: Both OpenAI and Gemini APIs failed.",
          role: "error",
          accountId: currentAccountId,
          createdAt: new Date().toISOString(),
        };

        await saveMessage(chatId, errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-row min-w-0 h-dvh bg-background">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onDeleteChat={deleteChat}
        onCreateNewChat={async () => { await createNewChat(); }}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        className={`transition-transform transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 w-64 bg-background border-r z-10 md:w-64`}
      />
      <div className={`flex flex-col flex-1 transition-all ${isSidebarOpen ? "md:ml-64" : "md:ml-0"}`}>
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onCreateNewChat={async () => { await createNewChat(); }}
        />
        <div className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4" ref={messagesContainerRef}>
          {messages.length === 0 && <Overview />}
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
            showSuggestions={messages.length === 0}
          />
        </div>
        <Footer />
      </div>
    </div>
  );
}