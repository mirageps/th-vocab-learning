import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  /** hide the bottom nav for immersive flows (e.g. active lesson) */
  hideNav?: boolean;
  className?: string;
}

export function AppShell({ children, hideNav, className }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background shadow-card">
      <main className={cn("flex-1", className)}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
