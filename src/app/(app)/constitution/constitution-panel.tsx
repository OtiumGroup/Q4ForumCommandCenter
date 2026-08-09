"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ScrollText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentViewer } from "@/components/document-viewer";
import { createClient } from "@/lib/supabase/client";
import { setConstitutionFile } from "./actions";

export function ConstitutionPanel({
  url,
  updatedAt,
  isAdmin,
}: {
  url: string | null;
  updatedAt: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "pdf";
      const path = `current.${ext}`;
      const { error } = await supabase.storage
        .from("constitution")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (error) throw error;

      startTransition(async () => {
        const res = await setConstitutionFile(path);
        if (res.ok) {
          toast.success("Constitution updated.");
          router.refresh();
        } else {
          toast.error(res.message ?? "Could not save.");
        }
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Constitution</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {updatedAt
              ? `Last updated ${new Date(updatedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}`
              : "The forum's governing document."}
          </p>
        </div>
        {isAdmin && (
          <>
            <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="mr-1.5 h-4 w-4" /> {uploading ? "Uploading…" : url ? "Replace" : "Upload"}
            </Button>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFile} />
          </>
        )}
      </div>

      {url ? (
        <DocumentViewer url={url} title="Constitution" />
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ScrollText className="h-10 w-10 text-muted-foreground" />
            <p className="max-w-sm text-sm text-muted-foreground">
              {isAdmin
                ? "Upload the forum's constitution so every member can reference it."
                : "The forum's moderator hasn't uploaded a constitution yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
