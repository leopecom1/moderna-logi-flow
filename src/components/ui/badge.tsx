import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        pending:
          "border-transparent bg-[hsl(var(--status-pending))] text-white hover:bg-[hsl(var(--status-pending))]/80",
        progress:
          "border-transparent bg-[hsl(var(--status-in-progress))] text-white hover:bg-[hsl(var(--status-in-progress))]/80",
        completed:
          "border-transparent bg-[hsl(var(--status-completed))] text-white hover:bg-[hsl(var(--status-completed))]/80",
        cancelled:
          "border-transparent bg-[hsl(var(--status-cancelled))] text-white hover:bg-[hsl(var(--status-cancelled))]/80",
        assigned:
          "border-transparent bg-[hsl(var(--status-assigned))] text-white hover:bg-[hsl(var(--status-assigned))]/80",
        payment:
          "border-transparent bg-[hsl(var(--status-payment))] text-white hover:bg-[hsl(var(--status-payment))]/80",
        waiting:
          "border-transparent bg-[hsl(var(--status-waiting))] text-white hover:bg-[hsl(var(--status-waiting))]/80",
        ready:
          "border-transparent bg-[hsl(var(--status-ready))] text-white hover:bg-[hsl(var(--status-ready))]/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
