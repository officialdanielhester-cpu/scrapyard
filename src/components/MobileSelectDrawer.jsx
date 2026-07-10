import React, { useState } from "react";
import { Check } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

// Renders a standard Radix Select on desktop, and a Vaul bottom-sheet drawer on mobile.
// options: array of strings OR { value, label } objects.
export default function MobileSelectDrawer({ value, onValueChange, options, triggerClassName, title = "Select" }) {
  const [open, setOpen] = useState(false);
  const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const current = normalized.find((o) => o.value === value);

  return (
    <>
      {/* Desktop: standard Select */}
      <div className="hidden md:block">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className={triggerClassName}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {normalized.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile: button + Vaul bottom-sheet */}
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center justify-between gap-2 md:hidden ${triggerClassName}`}
      >
        <span className="truncate">{current?.label ?? value}</span>
        <Check className="h-3 w-3 shrink-0 opacity-50" strokeWidth={2} />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[60vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="font-mono text-xs uppercase tracking-wider">{title}</DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[50vh] overflow-y-auto px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
            {normalized.map((o) => (
              <button
                key={o.value}
                onClick={() => { onValueChange(o.value); setOpen(false); }}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                  value === o.value ? "bg-primary/10 text-primary" : "text-foreground hover:bg-foreground/5"
                }`}
              >
                <span>{o.label}</span>
                {value === o.value && <Check className="h-4 w-4 text-primary" strokeWidth={2} />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}