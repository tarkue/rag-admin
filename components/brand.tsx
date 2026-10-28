import { Asterisk } from "lucide-react";
import { cn } from "@/lib/utils";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={cn("brand", light && "brand-light")}>
      <span className="brand-symbol">
        <Asterisk size={28} strokeWidth={2.6} />
      </span>
      <div>
        <span className="brand-name">
          moodle<span className="brand-name-dot">.</span>
        </span>
        <span className="brand-caption">KNOWLEDGE</span>
      </div>
    </div>
  );
}
