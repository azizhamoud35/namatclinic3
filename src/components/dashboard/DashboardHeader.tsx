import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  heading: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function DashboardHeader({
  heading,
  description,
  children,
  className,
}: DashboardHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-2 pb-8", className)}>
      <h2 className="text-3xl font-bold tracking-tight">{heading}</h2>
      {description && (
        <p className="text-muted-foreground">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}