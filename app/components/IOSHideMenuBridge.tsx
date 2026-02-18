"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        hideMenu?: {
          postMessage: (payload: { hidden: boolean }) => void;
        };
      };
    };
  }
}

export default function IOSHideMenuBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      const tag = target.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select";
    };

    const blockContextActions = (event: Event) => {
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
    };

    document.addEventListener("contextmenu", blockContextActions, { capture: true });
    document.addEventListener("selectstart", blockContextActions, { capture: true });
    document.addEventListener("dragstart", blockContextActions, { capture: true });

    const handler = window.webkit?.messageHandlers?.hideMenu;
    if (handler) {
      handler.postMessage({ hidden: true });
    }

    return () => {
      document.removeEventListener("contextmenu", blockContextActions, { capture: true });
      document.removeEventListener("selectstart", blockContextActions, { capture: true });
      document.removeEventListener("dragstart", blockContextActions, { capture: true });
    };
  }, []);

  return null;
}
