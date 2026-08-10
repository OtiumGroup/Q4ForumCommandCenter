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
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const requestedUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!url || (!isWord && !isPdf)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset preview state when the selection changes
      setHtml(null);
      setPdfPages([]);
      setStatus("idle");
      requestedUrl.current = null;
      return;
    }

    let cancelled = false;
    requestedUrl.current = url;
    setStatus("loading");
    setHtml(null);
    setPdfPages([]);

    (async () => {
      try {
        if (isWord) {
          const mammoth = await import("mammoth/mammoth.browser");
          const res = await fetch(url);
          const arrayBuffer = await res.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          // Sanitize: mammoth doesn't guard against XSS and members can upload docx.
          const DOMPurify = (await import("dompurify")).default;
          const clean = DOMPurify.sanitize(result.value, { USE_PROFILES: { html: true } });
          if (!cancelled && requestedUrl.current === url) {
            setHtml(clean);
            setStatus("ready");
          }
        } else if (isPdf) {
          // Render PDF pages to images with PDF.js. Unlike an <iframe>, this
          // renders legibly and scrolls on mobile Safari.
          const pdfjs = await import("pdfjs-dist");
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
          const doc = await pdfjs.getDocument({ url }).promise;
          const pages: string[] = [];
          const scale = 2; // crisp on high-DPI screens; CSS scales to fit width
          for (let i = 1; i <= doc.numPages; i++) {
            if (cancelled || requestedUrl.current !== url) return;
            const page = await doc.getPage(i);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) continue;
            await page.render({ canvas, canvasContext: ctx, viewport }).promise;
            pages.push(canvas.toDataURL("image/png"));
          }
          if (!cancelled && requestedUrl.current === url) {
            setPdfPages(pages);
            setStatus("ready");
          }
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, isWord, isPdf]);

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
          <div className="bg-muted/30 p-2 sm:p-4">
            {status === "loading" && (
              <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-sm">Loading document…</p>
              </div>
            )}
            {status === "error" && (
              <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
                <FileWarning className="h-8 w-8 text-muted-foreground" />
                <p className="max-w-xs text-sm text-muted-foreground">Couldn&apos;t render a preview here.</p>
                <div className="flex flex-col gap-2">
                  <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
                    <FileText className="h-4 w-4" /> Open document
                  </a>
                  <a href={url} download className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60">
                    <Download className="h-4 w-4" /> Download
                  </a>
                </div>
              </div>
            )}
            {status === "ready" &&
              pdfPages.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={`Page ${i + 1}`} className="mx-auto mb-3 w-full max-w-3xl rounded-sm bg-white shadow-sm last:mb-0" />
              ))}
          </div>
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
