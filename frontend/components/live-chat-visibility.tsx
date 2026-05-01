"use client";

import { usePathname } from "next/navigation";
import LiveChatAssistant from "@/components/live-chat-assistant";

export default function LiveChatVisibility() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return <LiveChatAssistant />;
}