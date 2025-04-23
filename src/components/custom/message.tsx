import { motion } from 'framer-motion';
import { cx } from 'classix';
import { SparklesIcon, BotIcon } from './icons';
import { Markdown } from './markdown';
import { message } from "../../interfaces/interfaces"
import { MessageActions } from '@/components/custom/actions';

export const PreviewMessage = ({ message }: { message: message; }) => {

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >
      <div
        className={cx(
          'group-data-[role=user]/message:bg-zinc-700 dark:group-data-[role=user]/message:bg-muted group-data-[role=user]/message:text-white flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          'group-data-[role=error]/message:text-red-600 dark:group-data-[role=error]/message:text-red-400',
          'group-data-[role=user]/message:max-w-2x1 group-data-[role=assistant]/message:max-w-2xl break-words',
        )}
      >
        {message.role === 'assistant' && (
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}

        {message.role === 'error' && (
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border text-black dark:text-white">
            <BotIcon />
          </div>
        )}

        <div className="flex flex-col w-full">
          {message.content && (
            <div className="flex flex-col gap-4 text-left">
              <Markdown>{message.content}</Markdown>
            </div>
          )}

          {message.image && (
            <div className="image-container">
              {message.image.type === "url" ? (
                <img src={message.image.data} alt="Generated content" />
              ) : (
                <img
                  src={`data:image/png;base64,${message.image.data}`}
                  alt="Generated content"
                />
              )}
            </div>
          )}

          {message.role === 'assistant' && (
            <MessageActions message={message} />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
      data-role={role}
    >
      <motion.div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          'group-data-[role=user]/message:bg-muted'
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>
        <motion.div
          className="flex items-center text-white"
          animate={{
            opacity: [0.75, 0.5, 0.75], // Alternate between 75% and 50% opacity
          }}
          transition={{
            duration: 1.5, // Duration of one cycle
            repeat: Infinity, // Infinite loop
          }}
        >
          <Markdown>
            Thinking...
          </Markdown>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
