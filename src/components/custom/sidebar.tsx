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
  activeChatId: string | null; // New prop to track the active chat
}

export function Sidebar({ isOpen, onClose, onDeleteChat, className, chats, onCreateNewChat, onSelectChat, activeChatId }: SidebarProps) {
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
          <NewChatButton onCreate={onCreateNewChat} showText={true} />
        </div>

        <ScrollArea className="flex-1 pr-5">
          <div className="space-y-2">
            {chats.map((chat) => (
              <div key={chat.id} className="group relative">
                <Button
                  variant={activeChatId === chat.id ? "secondary" : "ghost"} // Use activeChatId to determine style
                  className="w-full justify-start gap-2 pr-8"
                  onClick={() => onSelectChat(chat.id)}
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
