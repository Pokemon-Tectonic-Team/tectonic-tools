"use client";

import { ReactNode } from "react";
import BasicButton from "./BasicButton";

export default function DownloadFileButton({
    filename,
    generateContent,
    children,
}: {
    filename: string;
    generateContent: () => string;
    children: ReactNode;
}) {
    const handleDownload = () => {
        const blob = new Blob([generateContent()], { type: "text/plain;charset=utf-8" });
        const href = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = href;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(href);
    };

    return <BasicButton onClick={handleDownload}>{children}</BasicButton>;
}
