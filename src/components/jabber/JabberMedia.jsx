import React from "react";
import { Image } from "@/components/ui/image";

// Renders an AI-generated media card inside a Jabber chat bubble.
export default function JabberMedia({ media }) {
  if (!media) return null;

  if (media.kind === "image" && media.url) {
    return (
      <a href={media.url} target="_blank" rel="noreferrer" className="mt-2 block overflow-hidden rounded-xl border border-border/40">
        <Image src={media.url} alt={media.title || "Generated image"} fittingType="fit" className="max-h-80 w-full" />
      </a>
    );
  }
  if (media.kind === "video" && media.url) {
    return <video src={media.url} controls className="mt-2 w-full max-h-80 rounded-xl border border-border/40" />;
  }
  if (media.kind === "audio" && media.url) {
    return <audio src={media.url} controls className="mt-2 w-full" />;
  }
  if (media.kind === "essay" && media.content) {
    return (
      <div className="mt-2 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border/40 bg-foreground/5 p-3 text-sm leading-relaxed text-foreground/85">
        {media.content}
      </div>
    );
  }
  return null;
}