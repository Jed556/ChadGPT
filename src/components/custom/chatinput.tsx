import { Textarea } from "../ui/textarea";
import { cx } from 'classix';
import { Button } from "../ui/button";
import { ArrowUpIcon, PenIcon, PaperclipIcon } from "./icons"; // Import the pencil icon
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ChatInputProps {
    question: string;
    setQuestion: (question: string) => void;
    onSubmit: (text?: string) => void;
    onGenerateImage: (text?: string) => void;
    isLoading: boolean;
}

const suggestedActions = [
    {
        title: 'How is the weather',
        label: 'Calamba?',
        action: 'How is the weather in Calamba today?',
    },
    {
        title: 'What is a',
        label: 'Chad',
        action: 'How do you define is a Chad?',
    },
    {
        title: 'Why are we here',
        label: 'just to suffer',
        action: 'Why are we here? just to suffer?',
    },
    {
        title: 'What happened on',
        label: 'September 11, 2001',
        action: 'What happened on 9/11?',
    }
];

export const ChatInput = ({ question, setQuestion, onSubmit, onGenerateImage, isLoading }: ChatInputProps) => {
    const [showSuggestions, setShowSuggestions] = useState(true);

    return (
        <div className="relative w-full flex flex-col gap-4">
            {showSuggestions && (
                <div className="hidden md:grid sm:grid-cols-2 gap-2 w-full">
                    {suggestedActions.map((suggestedAction, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ delay: 0.05 * index }}
                            key={index}
                            className={index > 1 ? 'hidden sm:block' : 'block'}
                        >
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    const text = suggestedAction.action;
                                    onSubmit(text);
                                    setShowSuggestions(false);
                                }}
                                className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
                            >
                                <span className="font-medium">{suggestedAction.title}</span>
                                <span className="text-muted-foreground">
                                    {suggestedAction.label}
                                </span>
                            </Button>
                        </motion.div>
                    ))}
                </div>
            )}
            <input
                type="file"
                className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
                multiple
                tabIndex={-1}
            />

            <Textarea
                placeholder="Send a message..."
                className={cx(
                    'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-xl text-base bg-muted',
                )}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();

                        if (isLoading) {
                            toast.error('Please wait for the model to finish its response!');
                        } else {
                            setShowSuggestions(false);
                            onSubmit();
                        }
                    }
                }}
                rows={3}
                autoFocus
            >
                <Button
                    className={cx(
                        "rounded-full p-1.5 h-fit border dark:border-zinc-600 bg-transparent",
                        question.length === 0
                            ? "opacity-50 cursor-not-allowed text-muted-foreground"
                            : "opacity-100 hover:ring-2 hover:ring-ring text-muted-foreground hover:text-ring hover:bg-transparent"
                    )}
                    onClick={() => onGenerateImage(question)}
                    disabled={question.length === 0}
                >
                    <PenIcon size={14} />
                </Button>

                <Button
                    className={cx(
                        "rounded-full p-1.5 h-fit border dark:border-zinc-600 bg-transparent",
                        "opacity-100 hover:ring-2 hover:ring-ring text-muted-foreground hover:text-ring hover:bg-transparent"
                    )}
                    onClick={() => {
                        toast.info("Attach functionality not implemented yet!");
                    }}
                >
                    <PaperclipIcon size={14} />
                </Button>

                <Button
                    className={cx(
                        "rounded-full p-1.5 h-fit border dark:border-zinc-600 bg-transparent",
                        question.length === 0
                            ? "opacity-50 cursor-not-allowed text-muted-foreground"
                            : "opacity-100 hover:ring-2 hover:ring-ring text-muted-foreground hover:text-ring hover:bg-transparent"
                    )}
                    onClick={() => onSubmit(question)}
                    disabled={question.length === 0}
                >
                    <ArrowUpIcon size={14} />
                </Button>
            </Textarea>
        </div>
    );
}