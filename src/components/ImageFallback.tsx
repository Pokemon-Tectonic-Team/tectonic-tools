import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";

// Keep adding fallbacks till we can serve everyone for free?
const IMG_SIRV_ROOT = "https://tectonictools.sirv.com/Images/public";
const IMG_GITHUB_FALLBACK = "https://raw.githubusercontent.com/AlphaKretin/tectonic-tools/refs/heads/main/public";
export const IMG_NOT_FOUND = "/Items/NOTFOUND.png";

enum ImageSourceState {
    Vercel,
    Sirv,
    Github,
    Error,
}

export default function ImageFallback({
    alt,
    src,
    width,
    height,
    className,
    title,
    onClick,
    onContextMenu,
}: {
    alt: string;
    src: string;
    width: number;
    height: number;
    className?: string;
    title?: string;
    onClick?: () => void;
    onContextMenu?: () => void;
}): ReactNode {
    const [sourceState, setSourceState] = useState<ImageSourceState>(ImageSourceState.Vercel);
    const isDev = process.env.NODE_ENV !== "production";

    // Reset source state when src changes so we don't stay in error state
    useEffect(() => {
        setSourceState(ImageSourceState.Vercel);
    }, [src]);

    function toNextSourceState() {
        // On dev return immediately while staying in the error state
        if (isDev) {
            setSourceState(ImageSourceState.Error);
            return;
        }

        switch (sourceState) {
            case ImageSourceState.Vercel:
                setSourceState(ImageSourceState.Sirv);
                return;
            case ImageSourceState.Sirv:
                setSourceState(ImageSourceState.Github);
                return;
            case ImageSourceState.Github:
                setSourceState(ImageSourceState.Error);
                return;
            case ImageSourceState.Error:
                return;
        }
    }

    function getImageSourceString(): string {
        let root = "";
        let img = src;

        if (isDev && sourceState == ImageSourceState.Error) {
            return IMG_NOT_FOUND;
        }

        switch (sourceState) {
            case ImageSourceState.Vercel:
                break;
            case ImageSourceState.Sirv:
                root = IMG_SIRV_ROOT;
                break;
            case ImageSourceState.Github:
                root = IMG_GITHUB_FALLBACK;
                break;
            case ImageSourceState.Error:
                root = IMG_GITHUB_FALLBACK;
                img = IMG_NOT_FOUND;
                break;
        }

        return root + img;
    }

    function getNextJsImage(): ReactNode {
        return (
            <Image
                alt={alt}
                title={title}
                src={getImageSourceString()}
                onError={() => toNextSourceState()}
                width={width}
                height={height}
                className={className}
                onClick={onClick}
                onContextMenu={(e) => {
                    onContextMenu?.();
                    e.preventDefault();
                }}
            />
        );
    }

    function getHtmlImage() {
        return (
            <img
                alt={alt}
                title={title}
                loading="lazy"
                src={getImageSourceString()}
                onError={() => toNextSourceState()}
                width={width}
                height={height}
                className={className}
                onClick={onClick}
                onContextMenu={(e) => {
                    onContextMenu?.();
                    e.preventDefault();
                }}
            />
        );
    }

    // Dev builds should force use Image so we don't use up CDN limits
    if (isDev) {
        return getNextJsImage();
    }

    return sourceState == ImageSourceState.Vercel ? getNextJsImage() : getHtmlImage();
}
