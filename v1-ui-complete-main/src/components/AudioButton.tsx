import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { speakThai, isSpeechSupported } from "@/lib/audio";

interface AudioButtonProps {
  text: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-14 w-14",
};

export function AudioButton({
  text,
  size = "md",
  className,
  label,
}: AudioButtonProps) {
  const supported = isSpeechSupported();
  return (
    <button
      type="button"
      onClick={() => speakThai(text)}
      disabled={!supported}
      aria-label={label ?? `播放泰语发音 ${text}`}
      className={cn(
        "inline-flex items-center justify-center rounded-full gradient-accent text-accent-foreground shadow-soft tap-scale disabled:opacity-40",
        sizeMap[size],
        className,
      )}
    >
      <Volume2 className={cn(size === "sm" ? "h-4 w-4" : "h-6 w-6")} />
    </button>
  );
}
