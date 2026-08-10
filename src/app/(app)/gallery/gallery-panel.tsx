"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Trash2, Images, Download, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type GalleryPhoto = {
  id: string;
  url: string;
  caption: string | null;
  created_at: string;
  uploader_id: string;
  uploader: { full_name: string | null; photo_url: string | null } | null;
};

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function GalleryPanel({
  photos,
  currentUserId,
  isAdmin,
}: {
  photos: GalleryPhoto[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<GalleryPhoto | null>(null);

  async function download(url: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = url.split("/").pop()?.split("?")[0] || "photo.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, "_blank");
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createClient();
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${currentUserId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("gallery").upload(path, file, { cacheControl: "3600" });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("gallery").getPublicUrl(path);
        const { error: insErr } = await supabase
          .from("gallery_photos")
          .insert({ uploader_id: currentUserId, url: data.publicUrl });
        if (insErr) throw insErr;
      }
      toast.success("Added to the gallery.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Removed.");
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Photo Gallery</h1>
          <p className="mt-1 text-sm text-muted-foreground">Share the fun stuff — trips, wins, meetups, the good times.</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          <ImagePlus className="mr-1.5 h-4 w-4" /> {uploading ? "Uploading…" : "Add photos"}
        </Button>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <Images className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No photos yet — be the first to share something.</p>
        </div>
      ) : (
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption ?? ""} loading="lazy" onClick={() => setLightbox(p)} className="w-full cursor-zoom-in" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
                <Avatar className="h-6 w-6">
                  {p.uploader?.photo_url ? <AvatarImage src={p.uploader.photo_url} alt="" /> : null}
                  <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">
                    {initials(p.uploader?.full_name ?? null)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-xs text-white/90">{p.uploader?.full_name ?? "Member"}</span>
              </div>
              {(p.uploader_id === currentUserId || isAdmin) && (
                <button
                  onClick={() => handleDelete(p.id)}
                  aria-label="Delete photo"
                  className="absolute right-2 top-2 hidden rounded-full bg-black/50 p-1.5 text-white transition hover:bg-destructive group-hover:block"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm duration-200 animate-in fade-in"
        >
          <div onClick={(e) => e.stopPropagation()} className="relative max-h-[90vh] max-w-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.url} alt={lightbox.caption ?? ""} className="max-h-[90vh] w-auto rounded-xl object-contain" />
            <div className="absolute right-2 top-2 flex gap-2">
              <button
                onClick={() => download(lightbox.url)}
                aria-label="Download photo"
                className="rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLightbox(null)}
                aria-label="Close"
                className="rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
