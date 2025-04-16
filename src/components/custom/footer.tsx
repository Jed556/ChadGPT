import { GitIcon } from "@/components/custom/icons";

export const Footer = () => {
    return (
        <div className="flex items-center justify-between px-4 py-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
                {/* Made with ❤️ by <strong>Jerrald Guiriba</strong> */}
            </p>
            <p className="flex items-center gap-2">
                <a
                    href="https://github.com/Jed556/ChadGPT"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-gray-500 hover:underline"
                >
                    <GitIcon /> Jed556/ChadGPT
                </a>
                |
                <span className="text-gray-500">© {new Date().getFullYear()} Jerrald Guiriba.</span>
            </p>
        </div>
    );
};
