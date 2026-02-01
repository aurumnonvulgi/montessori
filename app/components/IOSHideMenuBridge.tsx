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
    const handler = window.webkit?.messageHandlers?.hideMenu;
    if (!handler) return;
    handler.postMessage({ hidden: true });
  }, []);

  return null;
}
