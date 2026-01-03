import { Notice } from "obsidian";
import { ENCRYPTION_BYTE_LENGTH, PLUGIN_PREFIX } from "./constants";
import { DateTime } from "luxon";

export function hideChildren(children: HTMLDivElement) {
        children.addClass("comment-hidden");
}

export function showChildren(children: HTMLDivElement) {
        children.removeClass("comment-hidden");
}

export function toggleChildren(children: HTMLDivElement) {
        if (isHidden(children)) {
                showChildren(children);
                return;
        }

        hideChildren(children);
}

export function isHidden(children: HTMLDivElement) {
        return children.classList.contains("comment-hidden");
}

export async function generateCommentId(name: string, timestamp: DateTime | undefined, content: string): Promise<string> {
        const str = `${name}|${timestamp?.toMillis()}|${content}`;

        const enc = new TextEncoder();
        const data = enc.encode(str);

        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const bytes = new Uint8Array(hashBuffer).slice(0, ENCRYPTION_BYTE_LENGTH);
        // return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

        let binary = "";
        for (const b of bytes) {
                binary += String.fromCharCode(b);
        }
        return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Notification component. Use to present timely, high-value information.
 * @public
 * @since 0.9.7
 */
export class CommentsNotice extends Notice {
        /**
         * @param message - The message to be displayed, can either be a simple string or a {@link DocumentFragment}
         * @param duration - Time in seconds to show the notice for. If this is 0, the
         * Notice will stay visible until the user manually dismisses it.
         * @public
         */
        constructor(message: string, duration?: number) {
                super(`${PLUGIN_PREFIX} ${message}`, duration != null ? duration * 1000 : duration);
        }
}
