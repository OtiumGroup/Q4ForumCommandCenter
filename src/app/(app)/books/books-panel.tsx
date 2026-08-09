"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Plus,
  Search,
  BookOpen,
  Headphones,
  Mic,
  Trash2,
  ExternalLink,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { addMediaItem, deleteMediaItem, fetchLinkMetadata } from "./actions";

type MediaType = "book" | "audiobook" | "podcast";
type MediaItem = {
  id: string;
  type: MediaType;
  title: string;
  author_or_host: string | null;
  topic: string | null;
  cover_image_url: string | null;
  source_url: string | null;
  external_link: string | null;
  description: string | null;
  added_by: string | null;
  created_at: string;
};

const TYPE_ICON: Record<MediaType, typeof BookOpen> = {
  book: BookOpen,
  audiobook: Headphones,
  podcast: Mic,
};

const TYPE_LABEL: Record<MediaType, string> = {
  book: "Book",
  audiobook: "Audiobook",
  podcast: "Podcast",
};

function AddMediaDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");

  async function handleFetch() {
    if (!link.trim()) return;
    setFetching(true);
    setError(null);
    try {
      const res = await fetchLinkMetadata(link.trim());
      if (res.ok && res.data) {
        if (res.data.title) setTitle(res.data.title);
        if (res.data.description) setDescription(res.data.description);
        if (res.data.image) setCoverImage(res.data.image);
        if (res.data.siteName && !author) setAuthor(res.data.siteName);
        toast.success("Pulled in what we could find — check it over.");
      } else {
        toast.error(res.message ?? "Could not fetch details.");
      }
    } finally {
      setFetching(false);
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addMediaItem({ ok: false }, formData);
      if (res.ok) {
        toast.success(res.message ?? "Added.");
        setOpen(false);
        setLink("");
        setTitle("");
        setAuthor("");
        setDescription("");
        setCoverImage("");
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
          <Plus className="mr-1.5 h-4 w-4" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add a book, audiobook, or podcast</DialogTitle>
            <DialogDescription>Paste a link to auto-fill details, or enter them by hand.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue="book">
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="audiobook">Audiobook</SelectItem>
                  <SelectItem value="podcast">Podcast</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Link (Audible, podcast page, etc.)</Label>
              <div className="flex gap-2">
                <Input
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  type="url"
                  placeholder="https://…"
                />
                <Button type="button" variant="outline" onClick={handleFetch} disabled={fetching || !link.trim()}>
                  <Wand2 className="mr-1.5 h-3.5 w-3.5" /> {fetching ? "Fetching…" : "Fetch"}
                </Button>
              </div>
            </div>
            <input type="hidden" name="source_url" value={link} />
            <input type="hidden" name="external_link" value={link} />
            <input type="hidden" name="cover_image_url" value={coverImage} />
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author_or_host">Author / host</Label>
              <Input
                id="author_or_host"
                name="author_or_host"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input id="topic" name="topic" placeholder="business, health, family, kids…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
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
              {pending ? "Saving…" : "Add to library"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BooksPanel({
  items,
  currentUserId,
  isAdmin,
}: {
  items: MediaItem[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [typeFilter, setTypeFilter] = useState<"all" | MediaType>("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const topics = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.topic && set.add(i.topic));
    return Array.from(set).sort();
  }, [items]);

  const filtered = items.filter((i) => {
    if (typeFilter !== "all" && i.type !== typeFilter) return false;
    if (topicFilter !== "all" && i.topic !== topicFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      i.title.toLowerCase().includes(q) ||
      (i.author_or_host ?? "").toLowerCase().includes(q) ||
      (i.description ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Books &amp; Podcasts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Recommendations from the forum.</p>
        </div>
        <AddMediaDialog />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | MediaType)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="book">Books</TabsTrigger>
            <TabsTrigger value="audiobook">Audiobooks</TabsTrigger>
            <TabsTrigger value="podcast">Podcasts</TabsTrigger>
          </TabsList>
        </Tabs>
        {topics.length > 0 && (
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All topics</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="relative ml-auto max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="pl-8" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const Icon = TYPE_ICON[item.type];
          return (
            <Card key={item.id} className="overflow-hidden">
              {item.cover_image_url ? (
                <div className="relative h-40 w-full bg-secondary">
                  <Image
                    src={item.cover_image_url}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-secondary text-accent">
                  <Icon className="h-10 w-10" />
                </div>
              )}
              <CardContent className="space-y-2 py-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Icon className="h-3 w-3" /> {TYPE_LABEL[item.type]}
                  </Badge>
                  {item.topic && <Badge variant="outline">{item.topic}</Badge>}
                </div>
                <p className="font-medium leading-snug">{item.title}</p>
                {item.author_or_host && <p className="text-sm text-muted-foreground">{item.author_or_host}</p>}
                {item.description && (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{item.description}</p>
                )}
                <div className="flex items-center justify-between pt-1">
                  {item.external_link ? (
                    <a
                      href={item.external_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-accent underline underline-offset-2"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View
                    </a>
                  ) : (
                    <span />
                  )}
                  {(item.added_by === currentUserId || isAdmin) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove"
                      disabled={pendingId === item.id}
                      onClick={() => {
                        setPendingId(item.id);
                        startTransition(async () => {
                          const res = await deleteMediaItem(item.id);
                          setPendingId(null);
                          if (!res.ok) toast.error(res.message ?? "Could not remove.");
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="border-dashed sm:col-span-2 lg:col-span-3">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {items.length === 0 ? "Nothing added yet." : "Nothing matches your filters."}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
