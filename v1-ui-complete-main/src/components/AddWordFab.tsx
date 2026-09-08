import { Plus } from "lucide-react";

interface AddWordFabProps {
  onClick: () => void;
}

/**
 * Floating action button anchored to the app column (max-w-md), sitting
 * above the bottom navigation. The outer wrapper is click-through so it
 * never blocks the content underneath.
 */
export function AddWordFab({ onClick }: AddWordFabProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <div className="relative mx-auto max-w-md">
        <button
          type="button"
          onClick={onClick}
          aria-label="添加单词"
          className="tap-scale pointer-events-auto absolute bottom-[76px] right-4 flex items-center gap-2 rounded-full gradient-primary px-5 py-3.5 font-bold text-primary-foreground shadow-glow"
        >
          <Plus className="h-5 w-5" />
          添加单词
        </button>
      </div>
    </div>
  );
}
