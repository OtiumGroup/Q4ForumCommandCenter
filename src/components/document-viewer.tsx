"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileWarning, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

function extOf(urlOrPath: string | null | undefined, fileType?: string | null) {
  const source = fileType || urlOrPath || "";
  const clean = source.split("?")[0].toLowerCase();
  const ext = clean.includes(".") ? clean.split(".").pop() : clean;
  return (ext || "").replace(/[^a-z0-9]/g, "");
}

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);
const WORD_EXTS = new Set(["docx", "doc"]);

export function DocumentViewer({
  url,
  title,
  fileType,
  className = "",
}: {
  url: string | null;
  title: string;
  fileType?: string | null;
  className?: string;
}) {
  const ext = extOf(url, fileType);
  const isPdf = ext === "pdf";
  const isImage = IMAGE_EXTS.has(ext);
  const isWord = WORD_EXTS.has(ext) && ext === "docx"; // .doc (legacy binary) can't be parsed client-side

  const [html, setHtml] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const requestedUrl = useRef<string | null>(null);

  useEffect(() => {
    requestedUrl.current = null;

    if (!url || !isWord) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting preview state when the selected document changes
      setHtml(null);
      setStatus("idle");
      return;
    }

    let cancelled = false;
    requestedUrl.current = url;

    (async () => {
      setStatus("loading");
      setHtml(null);
      try {
        const mammoth = await import("mammoth/mammoth.browser");
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        // Sanitize before rendering: mammoth does not guard against XSS, and
        // members can upload .docx files, so a crafted document could otherwise
        // inject script into another member's session.
        const DOMPurify = (await import("dompurify")).default;
        const clean = DOMPurify.sanitize(result.value, { USE_PROFILES: { html: true } });
        if (!cancelled && requestedUrl.current === url) {
          setHtml(clean);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, isWord]);

  if (!url) {
    return (
      <div className={`flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/50 py-20 text-center ${className}`}>
        <FileText className="h-10 w-10 text-muted-foreground" />
        <p className="max-w-xs text-sm text-muted-foreground">Choose a document from the list to read it here.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/40 px-4 py-3">
        <p className="truncate font-medium">{title}</p>
        <Button asChild size="sm" variant="outline">
          <a href={url} download target="_blank" rel="noreferrer">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Download
          </a>
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {isPdf && (
          <>
            <iframe src={url} className="hidden h-full min-h-[70vh] w-full lg:block" title={title} />
            <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 p-8 text-center lg:hidden">
              <FileText className="h-12 w-12 text-accent" />
              <div>
                <p className="font-medium text-foreground">{title || "Document"}</p>
                <p className="mt-1 text-sm text-muted-foreground">Open the document to read, zoom, and scroll — or download it to keep.</p>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  <FileText className="h-4 w-4" /> Open document
                </a>
                <a
                  href={url}
                  download
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60"
                >
                  <Download className="h-4 w-4" /> Download
                </a>
              </div>
            </div>
          </>
        )}

        {isImage && (
          <div className="flex justify-center bg-muted/40 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={title} className="max-h-[75vh] rounded-md object-contain shadow-sm" />
          </div>
        )}

        {isWord && (
          <>
            {status === "loading" && (
              <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-sm">Loading document…</p>
              </div>
            )}
            {status === "error" && (
              <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
                <FileWarning className="h-8 w-8 text-muted-foreground" />
                <p className="max-w-xs text-sm text-muted-foreground">Couldn&apos;t preview this file — download it to view.</p>
              </div>
            )}
            {status === "ready" && html && (
              <div className="doc-content mx-auto max-w-3xl px-6 py-8" dangerouslySetInnerHTML={{ __html: html }} />
            )}
          </>
        )}

        {!isPdf && !isImage && !isWord && (
          <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="max-w-xs text-sm text-muted-foreground">
              This file type can&apos;t be previewed here — download it to view.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
