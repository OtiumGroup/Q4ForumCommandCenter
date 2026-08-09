import { ComingSoon } from "@/components/shared/coming-soon";
import { FolderOpen } from "lucide-react";

export default function Page() {
  return (
    <ComingSoon
      icon={FolderOpen}
      title="Documents"
      description="A shared, searchable library organized by category."
    />
  );
}
