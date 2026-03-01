import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/70 bg-white/70 p-5 shadow-[0_16px_36px_color-mix(in_srgb,var(--ink-primary)_12%,transparent)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
};

export const CardHeader = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("mb-4 flex flex-col gap-1", className)} {...props} />;
};

export const CardTitle = ({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h3
      className={cn("text-base font-bold tracking-tight text-(--ink-primary)", className)}
      {...props}
    />
  );
};

export const CardContent = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("space-y-3", className)} {...props} />;
};
