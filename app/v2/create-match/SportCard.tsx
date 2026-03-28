import { cn } from "@/lib/utils";
import { materialSymbolIconStyle } from "./materialSymbolIconStyle";
import styles from "./create-match.module.css";

function MaterialIcon({
  name,
  className,
  filled,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={className}
      style={materialSymbolIconStyle(Boolean(filled))}
    >
      {name}
    </span>
  );
}

export type SportCardProps = {
  name: string;
  icon: string;
  symbol: string;
  selected?: boolean;
  onClick?: () => void;
};

export function SportCard({
  name,
  icon,
  symbol,
  selected = false,
  onClick,
}: SportCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full cursor-pointer overflow-hidden rounded-xl bg-[#1f1f22] p-6 text-left transition-all",
        selected
          ? "bg-[#c2c1ff] inverted-colors:text-[#131316]"
          : "border-2 border-transparent hover:border-[#c2c1ff]/30",
      )}
    >
      <div className="mb-8 flex items-start justify-between">
        <MaterialIcon name={icon}
          className={cn("text-4xl", selected ? "text-[#003919]" : "text-[#c2c1ff]")}
        />
        <span
          className={cn(
            "text-[10px] font-bold tracking-widest",
            selected
              ? "text-[#003919]"
              : "text-[#c8c5d2] group-hover:text-[#c2c1ff]",
          )}
        >
          {symbol}
        </span>
      </div>
      <h3
        className={cn(
          "text-xl font-extrabold tracking-tight lg:text-2xl",
          styles.headline,
          selected ? "text-[#003919]" : "text-[#c8c5d2] group-hover:text-[#c2c1ff]",
        )}
      >
        {name}
      </h3>
    </button>
  );
}
