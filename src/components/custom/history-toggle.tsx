import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface HistoryToggleProps {
    onToggle: () => void;
}

export const HistoryToggle = ({ onToggle }: HistoryToggleProps) => {
    return (
        <Button
            variant="outline"
            className="bg-background border border-gray text-gray-600 hover:white dark:text-gray-200 h-10"
            onClick={onToggle}
        >
            <MessageCircle className="h-[1.2rem] w-[1.2rem]" />
        </Button>
    );
};
