"use client";

import { AnchorHTMLAttributes, ReactNode } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  sourcePath: string;
  targetSlug?: string;
  targetType: "relay" | "guide" | "model" | "external";
  url: string;
};

export function TrackedOutboundLink({
  children,
  sourcePath,
  targetSlug,
  targetType,
  url,
  ...props
}: Props) {
  function recordClick() {
    const payload = JSON.stringify({
      targetType,
      targetSlug,
      url,
      sourcePath,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/outbound-clicks",
        new Blob([payload], { type: "application/json" }),
      );
      return;
    }

    void fetch("/api/outbound-clicks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  }

  return (
    <a
      {...props}
      href={url}
      onClick={recordClick}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}
