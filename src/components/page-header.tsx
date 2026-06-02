import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="space-y-2">
        <div className="h-1 w-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
        <h1 className="text-2xl font-bold tracking-tight text-amber-950 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actionLabel && actionHref && (
        <Button
          className="w-full bg-amber-500 text-white shadow-md hover:bg-amber-600 sm:w-auto"
          render={<Link href={actionHref} />}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
