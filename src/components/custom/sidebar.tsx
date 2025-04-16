import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NewChatButton } from './new-chat-button'; // Import NewChatButton

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteChat?: (chatId: string) => void;
  className?: string;
  chats: { id: string; name: string }[]; // Accept chats as a prop
  onCreateNewChat: (newChat: { id: string; name: string }) => void; // Accept onCreateNewChat as a prop
  onSelectChat: (chatId: string) => void; // Accept onSelectChat as a prop
}

export function Sidebar({ isOpen, onClose, onDeleteChat, className, chats, onCreateNewChat, onSelectChat }: SidebarProps) {
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const handleCreateNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      name: `Chat ${chats.length + 1}`,
    };
    onCreateNewChat(newChat); // Pass the new chat to the parent handler
  };

  const selectChat = (chatId: string) => {
    setActiveChat(chatId);
    onSelectChat(chatId); // Call onSelectChat with the selected chat ID
  };

  return (
    <div
      className={cn(
        `${className} fixed inset-y-0 left-0 w-auto bg-background border-r transform transition-transform duration-200 ease-in-out z-50`,
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Chats</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4 md:hidden"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-4">
          <NewChatButton onCreate={handleCreateNewChat} showText={true} /> {/* Use local handler */}
        </div>

        <ScrollArea className="flex-1 pr-5">
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="group relative"
              >
                <Button
                  variant={activeChat === chat.id ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2 pr-8"
                  onClick={() => selectChat(chat.id)}
                >
                  <MessageCircle className="h-4 w-4" />
                  {chat.name}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeleteChat) onDeleteChat(chat.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-primary" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
