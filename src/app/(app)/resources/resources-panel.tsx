"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Upload, Search, FileText, Trash2, FolderPlus, LibraryBig, ChevronRight, ChevronDown, BookOpen, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
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
import { DocumentViewer } from "@/components/document-viewer";
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
        formData.set("file_type", file.name.split(".").pop() || file.type || "");

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
        <Button size="sm">
          <Upload className="mr-1.5 h-4 w-4" /> Upload
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
  const [selectedId, setSelectedId] = useState<string | null>(resources[0]?.id ?? null);
  const [mobileDocOpen, setMobileDocOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const filtered = q ? resources.filter((r) => r.title.toLowerCase().includes(q)) : resources;

  const grouped = useMemo(() => {
    const byCategory = categories.map((cat) => ({
      cat,
      items: filtered.filter((r) => r.category_id === cat.id),
    }));
    const uncategorized = filtered.filter((r) => !r.category_id);
    return { byCategory, uncategorized };
  }, [categories, filtered]);

  const selected = resources.find((r) => r.id === selectedId) ?? null;

  // Sub-categories under the "EO Resources" root are collapsible — start with
  // just the section holding the selected doc open, so the tree stays compact
  // and the viewer gets most of the room.
  const [openCats, setOpenCats] = useState<Set<string>>(() => {
    const initial = resources[0]?.category_id;
    return new Set(initial ? [initial] : []);
  });
  const toggleCat = (id: string) =>
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // While searching, treat every category with a match as open so results are
  // visible — derived from state rather than an effect, so clearing the search
  // restores whatever the member had manually expanded.
  const effectiveOpenCats = q
    ? new Set(grouped.byCategory.filter((g) => g.items.length > 0).map((g) => g.cat.id).concat("uncategorized"))
    : openCats;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader eyebrow="Moderator Resources" title="EO Resources" description="The forum's full Moderator Resources library — pick a document to read it right here.">
        {isAdmin && <AddCategoryDialog />}
        {isAdmin && <UploadDialog categories={categories} />}
      </PageHeader>

      {resources.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {isAdmin
              ? "Nothing uploaded yet — start adding the moderator resource library."
              : "The resource library is being built out — check back soon."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid flex-1 gap-4 lg:grid-cols-[240px_1fr]">
          <div className={cn("flex-col gap-3", mobileDocOpen ? "hidden lg:flex" : "flex")}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="pl-8" />
            </div>

            <div className="max-h-[75vh] overflow-y-auto rounded-lg border border-border bg-card">
              <div className="flex items-center gap-1.5 border-b border-border bg-primary/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-primary">
                <BookOpen className="h-3.5 w-3.5 text-accent" /> EO Resources
              </div>

              {grouped.byCategory.map(({ cat, items }) => {
                if (items.length === 0) return null;
                const isOpen = effectiveOpenCats.has(cat.id);
                return (
                  <div key={cat.id} className="border-b border-border last:border-0">
                    <button
                      type="button"
                      onClick={() => toggleCat(cat.id)}
                      className="flex w-full items-center justify-between gap-1.5 bg-secondary/40 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-secondary/60"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <LibraryBig className="h-3 w-3 shrink-0" />
                        <span className="truncate">{cat.name}</span>
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium normal-case text-muted-foreground">
                          {items.length}
                        </span>
                        {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                    {isOpen && (
                      <ul>
                        {items.map((r) => (
                          <li key={r.id}>
                            <div
                              className={`flex w-full items-center justify-between gap-2 pl-7 pr-3 text-sm transition-colors hover:bg-secondary/60 ${
                                selectedId === r.id ? "bg-accent/10" : ""
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => { setSelectedId(r.id); setMobileDocOpen(true); }}
                                className={`flex flex-1 items-center gap-2 truncate py-2 text-left ${
                                  selectedId === r.id ? "font-medium text-accent" : "text-foreground"
                                }`}
                              >
                                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">{r.title}</span>
                              </button>
                              {isAdmin && (
                                <button
                                  type="button"
                                  aria-label="Delete resource"
                                  disabled={pendingId === r.id}
                                  className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
                                  onClick={() => {
                                    setPendingId(r.id);
                                    startTransition(async () => {
                                      const res = await deleteEoResource(r.id, r.file_path);
                                      setPendingId(null);
                                      if (!res.ok) toast.error(res.message ?? "Could not delete resource.");
                                      else if (selectedId === r.id) setSelectedId(null);
                                    });
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}

              {grouped.uncategorized.length > 0 && (
                <div className="border-b border-border last:border-0">
                  <button
                    type="button"
                    onClick={() => toggleCat("uncategorized")}
                    className="flex w-full items-center justify-between gap-1.5 bg-secondary/40 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-secondary/60"
                  >
                    <span>Uncategorized</span>
                    {effectiveOpenCats.has("uncategorized") ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                  {effectiveOpenCats.has("uncategorized") && (
                    <ul>
                      {grouped.uncategorized.map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => { setSelectedId(r.id); setMobileDocOpen(true); }}
                            className={`flex w-full items-center gap-2 py-2 pl-7 pr-3 text-left text-sm transition-colors hover:bg-secondary/60 ${
                              selectedId === r.id ? "bg-accent/10 font-medium text-accent" : "text-foreground"
                            }`}
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{r.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {filtered.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">No resources match &quot;{query}&quot;.</p>
              )}
            </div>
          </div>

          <div className={cn("min-w-0 flex-col", mobileDocOpen ? "flex" : "hidden lg:flex")}>
            <button
              type="button"
              onClick={() => setMobileDocOpen(false)}
              className="mb-3 inline-flex items-center gap-1.5 self-start text-sm font-medium text-accent lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" /> Back to list
            </button>
            <DocumentViewer url={selected?.url ?? null} title={selected?.title ?? ""} fileType={selected?.file_type} className="min-h-[70vh] lg:min-h-[80vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
