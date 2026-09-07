import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-line bg-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 data-[state=checked]:bg-hud data-[state=checked]:border-hud",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-5 translate-x-0.5 rounded-full bg-fg shadow-sm transition-transform data-[state=checked]:translate-x-6 data-[state=checked]:bg-bg" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
