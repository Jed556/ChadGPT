import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface NewChatButtonProps {
    onCreate: (newChat: { id: string; name: string }) => void; // Adjusted to match the expected signature
    showText?: boolean; // Optional parameter to show "New Chat" text
}

export const NewChatButton = ({ onCreate, showText = false }: NewChatButtonProps) => {
    return (
        <Button
            variant="outline"
            className="bg-background border border-gray text-gray-600 hover:white dark:text-gray-200 h-10 flex items-center justify-center gap-2 w-full max-w-full"
            onClick={() => onCreate({ id: "new-id", name: "New Chat" })} // Call the provided callback with a newChat object
        >
            <PlusCircle className="h-[1.2rem] w-[1.2rem]" />
            {showText && <span className="ml-2">New Chat</span>}
        </Button>
    );
};
