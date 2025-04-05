import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea"> & { children?: React.ReactNode } // Add children prop
>(({ className, children, ...props }, ref) => {
  return (
    <div
      className={cn(
        "flex flex-col min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <textarea
        className="flex-1 bg-transparent outline-none resize-none"
        ref={ref}
        {...props}
      />
      <div className="flex gap-2 mt-2">{children}</div>
    </div>
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
