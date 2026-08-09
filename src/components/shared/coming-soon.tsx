import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-accent">
            <Icon className="h-6 w-6" />
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            This section is being built next. It&apos;ll appear here as soon as it&apos;s ready —
            no action needed from you.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
