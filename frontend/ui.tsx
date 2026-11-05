// Adapted from shadcn/ui (MIT). See THIRD_PARTY_NOTICES.md.
// CSS classes replace Tailwind utilities to fit the application's existing styling.
import type { ComponentProps } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

function classes(...values: (string | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

export function Button({ className, variant = "default", size = "default", type = "button", ...props }:
  ComponentProps<"button"> & { variant?: "default" | "outline" | "ghost" | "secondary"; size?: "default" | "sm" | "icon" }) {
  return <button data-slot="button" data-variant={variant} data-size={size} type={type} className={classes("ui-button", className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card" className={classes("ui-card", className)} {...props} />;
}

export function Badge({ className, variant = "default", ...props }: ComponentProps<"span"> & { variant?: "default" | "outline" }) {
  return <span data-slot="badge" data-variant={variant} className={classes("ui-badge", className)} {...props} />;
}

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="skeleton" className={classes("ui-skeleton", className)} {...props} />;
}

export function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={classes("ui-tabs", className)} {...props} />;
}

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List data-slot="tabs-list" className={classes("ui-tabs-list", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return <TabsPrimitive.Trigger data-slot="tabs-trigger" className={classes("ui-tabs-trigger", className)} {...props} />;
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={classes("ui-tabs-content", className)} {...props} />;
}
