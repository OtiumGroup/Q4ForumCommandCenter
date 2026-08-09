import { ComingSoon } from "@/components/shared/coming-soon";
import { Target } from "lucide-react";

export default function Page() {
  return (
    <ComingSoon
      icon={Target}
      title="Goals & Accountability"
      description="Track your business, personal, and life goals between meetings."
    />
  );
}
