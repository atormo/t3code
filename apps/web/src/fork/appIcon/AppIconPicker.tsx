import { cn } from "../../lib/utils";
import blackIcon from "./black.png";
import blueprintIcon from "./blueprint.png";
import nightlyIcon from "./nightly.png";

export type AppIcon = "black" | "blueprint" | "nightly";

const ICONS: ReadonlyArray<{ id: AppIcon; label: string; src: string }> = [
  { id: "black", label: "Black", src: blackIcon },
  { id: "blueprint", label: "Blueprint", src: blueprintIcon },
  { id: "nightly", label: "Nightly", src: nightlyIcon },
];

/** The Mac app icon choices, shown as the icons themselves. */
export function AppIconPicker(props: { value: AppIcon; onChange: (icon: AppIcon) => void }) {
  return (
    <div role="radiogroup" aria-label="App icon" className="flex gap-2">
      {ICONS.map((icon) => (
        <button
          key={icon.id}
          type="button"
          role="radio"
          aria-checked={props.value === icon.id}
          aria-label={icon.label}
          onClick={() => props.onChange(icon.id)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-lg p-1.5 text-2xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            props.value === icon.id ? "bg-accent text-foreground" : "hover:bg-accent/60",
          )}
        >
          <img src={icon.src} alt="" className="size-10" draggable={false} />
          {icon.label}
        </button>
      ))}
    </div>
  );
}
