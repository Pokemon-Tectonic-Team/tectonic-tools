import { ReactNode, useState } from "react";

export default function Collapsible({ children, title }: { children: ReactNode; title: string }): ReactNode {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    return (
        <div>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full px-4 py-2 text-left text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
                {<span>{title}</span>}
                <svg
                    className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`overflow-hidden ${isExpanded ? "" : "max-h-0"}`}>{children}</div>
        </div>
    );
}
