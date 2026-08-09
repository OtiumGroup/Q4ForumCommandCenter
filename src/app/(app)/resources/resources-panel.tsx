"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Upload, Search, FileText, Download, Trash2, FolderPlus, LibraryBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { recordEoResource, deleteEoResource, createEoCategory } from "./actions";

type Category = { id: string; name: string; sort_order: number };
type Resource = {
  id: string;
  title: string;
  category_id: string | null;
  file_path: string;
  file_type: string | null;
  sort_order: number;
  created_at: string;
  url: string | null;
};

function UploadDialog({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    startTransition(async () => {
      setUploading(true);
      try {
        const supabase = createClient();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const category = String(formData.get("category_id") || "uncategorized");
        const path = `${category}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("eo-resources").upload(path, file);
        if (uploadError) throw uploadError;

        formData.set("file_path", path);
        formData.set("file_type", file.type || file.name.split(".").pop() || "");

        const res = await recordEoResource({ ok: false }, formData);
        if (!res.ok) throw new Error(res.message);

        toast.success(res.message ?? "Resource added.");
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    });
  }

  const busy = pending || uploading;

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setError(null); }}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-1.5 h-4 w-4" /> Upload resource
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload a resource</DialogTitle>
            <DialogDescription>Added to the EO Resources library for every member.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="eo_file">File</Label>
              <Input ref={fileRef} id="eo_file" type="file" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eo_title">Title</Label>
              <Input id="eo_title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eo_category_id">Category</Label>
              <Select name="category_id">
                <SelectTrigger id="eo_category_id" className="w-full">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={busy}>
              {busy ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderPlus className="mr-1.5 h-3.5 w-3.5" /> New category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New category</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={pending || !name.trim()}
            onClick={() =>
              startTransition(async () => {
                const res = await createEoCategory(name);
                if (res.ok) {
                  toast.success("Category added.");
                  setOpen(false);
                  setName("");
                } else {
                  toast.error(res.message ?? "Could not add category.");
                }
              })
            }
          >
            {pending ? "Saving…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ResourcesPanel({
  categories,
  resources,
  isAdmin,
}: {
  categories: Category[];
  resources: Resource[];
  isAdmin: boolean;
}) {
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = q ? resources.filter((r) => r.title.toLowerCase().includes(q)) : resources;

  const uncategorized = filtered.filter((r) => !r.category_id);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">EO Resources</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The forum&apos;s full Moderator Resources library, organized to browse or download.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && <AddCategoryDialog />}
          {isAdmin && <UploadDialog categories={categories} />}
        </div>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search resources…" className="pl-8" />
      </div>

      <div className="space-y-8">
        {categories.map((cat) => {
          const items = filtered.filter((r) => r.category_id === cat.id);
          if (items.length === 0) return null;
          return (
            <div key={cat.id}>
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
                <LibraryBig className="h-4 w-4 text-accent" /> {cat.name}
                <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="flex items-start justify-between gap-3 py-4">
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-accent">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{r.title}</p>
                          {r.url && (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-sm text-accent underline underline-offset-2"
                            >
                              <Download className="h-3.5 w-3.5" /> Download
                            </a>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete resource"
                          disabled={pendingId === r.id}
                          onClick={() => {
                            setPendingId(r.id);
                            startTransition(async () => {
                              const res = await deleteEoResource(r.id, r.file_path);
                              setPendingId(null);
                              if (!res.ok) toast.error(res.message ?? "Could not delete resource.");
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {uncategorized.length > 0 && (
          <div>
            <h2 className="mb-3 font-display text-lg font-semibold">Uncategorized</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {uncategorized.map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex items-start justify-between gap-3 py-4">
                    <div className="flex gap-3">
                      <FileText className="mt-0.5 h-4 w-4 text-accent" />
                      <div>
                        <p className="font-medium">{r.title}</p>
                        {r.url && (
                          <a href={r.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-accent underline underline-offset-2">
                            <Download className="h-3.5 w-3.5" /> Download
                          </a>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete resource"
                        onClick={() =>
                          startTransition(async () => {
                            const res = await deleteEoResource(r.id, r.file_path);
                            if (!res.ok) toast.error(res.message ?? "Could not delete resource.");
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {resources.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              {isAdmin
                ? "Nothing uploaded yet — start adding the moderator resource library."
                : "The resource library is being built out — check back soon."}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
