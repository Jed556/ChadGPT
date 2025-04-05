import { ThemeToggle } from "./theme-toggle";
import { HistoryToggle } from "./history-toggle";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  return (
    <header className="flex items-center justify-between px-2 sm:px-4 py-2 bg-background text-black dark:text-white w-full">
      <div className="flex items-center space-x-1 sm:space-x-2">
        <HistoryToggle onToggle={onToggleSidebar} />
        <ThemeToggle />
      </div>
      <div className="text-lg font-bold ml-auto">ChadGPT</div>
    </header>
  );
};