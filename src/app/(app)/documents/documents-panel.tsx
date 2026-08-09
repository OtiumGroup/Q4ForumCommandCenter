"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Upload,
  Search,
  FileText,
  Download,
  Trash2,
  Link as LinkIcon,
  Plus,
  FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import {
  recordDocument,
  deleteDocument,
  addResourceLink,
  deleteResourceLink,
  createCategory,
} from "./actions";

type Category = { id: string; name: string; sort_order: number };
type Doc = {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  file_path: string;
  file_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  url: string | null;
};
type ResourceLink = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category_id: string | null;
  added_by: string | null;
  created_at: string;
};

function CategorySelect({ categories, name }: { categories: Category[]; name: string }) {
  return (
    <Select name={name}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Category (optional)" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function UploadDialog({ categories, userId }: { categories: Category[]; userId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
        const path = `${userId}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
        if (uploadError) throw uploadError;

        formData.set("file_path", path);
        formData.set("file_type", file.type || file.name.split(".").pop() || "");

        const res = await recordDocument({ ok: false }, formData);
        if (!res.ok) throw new Error(res.message);

        toast.success(res.message ?? "Document added.");
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-1.5 h-4 w-4" /> Upload document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload a document</DialogTitle>
            <DialogDescription>Shared with the whole forum.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input ref={fileRef} id="file" type="file" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <CategorySelect categories={categories} name="category_id" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" name="description" rows={2} />
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

function AddLinkDialog({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addResourceLink({ ok: false }, formData);
      if (res.ok) {
        toast.success(res.message ?? "Link added.");
        setOpen(false);
      } else {
        setError(res.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1.5 h-4 w-4" /> Add link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add a helpful link</DialogTitle>
            <DialogDescription>Share a website with the forum.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link_title">Title</Label>
              <Input id="link_title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input id="url" name="url" type="url" required placeholder="https://…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link_category_id">Category</Label>
              <CategorySelect categories={categories} name="category_id" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link_description">Description (optional)</Label>
              <Textarea id="link_description" name="description" rows={2} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Add link"}
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
                const res = await createCategory(name);
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

export function DocumentsPanel({
  categories,
  documents,
  links,
  currentUserId,
  isAdmin,
}: {
  categories: Category[];
  documents: Doc[];
  links: ResourceLink[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const categoryName = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [categories]);

  const filteredDocs = documents.filter((d) => {
    const matchesCategory = categoryFilter === "all" || d.category_id === categoryFilter;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q || d.title.toLowerCase().includes(q) || (d.description ?? "").toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A shared, searchable library for the forum.
          </p>
        </div>
      </div>

      <Tabs defaultValue="library">
        <TabsList>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="links">Helpful Links</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents…"
                className="pl-8"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              {isAdmin && <AddCategoryDialog />}
              <UploadDialog categories={categories} userId={currentUserId} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocs.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="flex items-start justify-between gap-3 py-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-accent">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      {doc.category_id && categoryName.get(doc.category_id) && (
                        <p className="text-xs text-muted-foreground">{categoryName.get(doc.category_id)}</p>
                      )}
                      {doc.description && <p className="mt-1 text-sm text-muted-foreground">{doc.description}</p>}
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm text-accent underline underline-offset-2"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                      )}
                    </div>
                  </div>
                  {(doc.uploaded_by === currentUserId || isAdmin) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete document"
                      disabled={pendingId === doc.id}
                      onClick={() => {
                        setPendingId(doc.id);
                        startTransition(async () => {
                          const res = await deleteDocument(doc.id, doc.file_path);
                          setPendingId(null);
                          if (!res.ok) toast.error(res.message ?? "Could not delete document.");
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {filteredDocs.length === 0 && (
              <Card className="border-dashed sm:col-span-2 lg:col-span-3">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  {documents.length === 0 ? "No documents uploaded yet." : "No documents match your search."}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="links" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <AddLinkDialog categories={categories} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => (
              <Card key={link.id}>
                <CardContent className="flex items-start justify-between gap-3 py-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-accent">
                      <LinkIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-accent underline underline-offset-2"
                      >
                        {link.title}
                      </a>
                      {link.category_id && categoryName.get(link.category_id) && (
                        <p className="text-xs text-muted-foreground">{categoryName.get(link.category_id)}</p>
                      )}
                      {link.description && <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>}
                    </div>
                  </div>
                  {(link.added_by === currentUserId || isAdmin) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete link"
                      disabled={pendingId === link.id}
                      onClick={() => {
                        setPendingId(link.id);
                        startTransition(async () => {
                          const res = await deleteResourceLink(link.id);
                          setPendingId(null);
                          if (!res.ok) toast.error(res.message ?? "Could not delete link.");
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {links.length === 0 && (
              <Card className="border-dashed sm:col-span-2 lg:col-span-3">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No links shared yet.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
