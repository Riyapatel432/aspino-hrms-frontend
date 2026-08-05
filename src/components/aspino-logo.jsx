import { useState } from "react";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

export function AspinoIcon({ className, size = 36 }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden flex items-center justify-center select-none bg-sky-500/10 rounded-xl",
        className
      )}
      style={{ width: size, height: size }}
    >
      {!imgError ? (
        <img
          src="/aspino-icon.png"
          alt="Aspino"
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <Building2 className="w-2/3 h-2/3 text-sky-500" />
      )}
    </div>
  );
}

export function AspinoLogo({
  className,
  size = "default",
  showText = true,
  subtitle = "Pharma ERP",
}) {
  const iconSizes = {
    xs: 24,
    sm: 30,
    default: 36,
    lg: 48,
    xl: 64,
  };

  const iconSize = iconSizes[size] || iconSizes.default;

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <AspinoIcon size={iconSize} />
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-aspino-primary to-aspino-secondary bg-clip-text text-transparent">
            ASPINO
          </span>
          {subtitle && (
            <span className="text-[10px] font-medium text-muted-foreground tracking-tight leading-tight mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
