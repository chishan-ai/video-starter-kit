"use client";

import { Coins } from "lucide-react";
import { useCreditsBalance } from "@/hooks/use-project";

export function CreditsBadge() {
  const { data, isLoading } = useCreditsBalance();

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1 text-sm">
      <Coins className="h-3.5 w-3.5 text-yellow-500" />
      <span className="font-medium">
        {isLoading ? "..." : (data?.balance ?? 0)}
      </span>
    </div>
  );
}
