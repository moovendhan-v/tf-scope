import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[5px] border px-[7px] py-0.5 text-[10px] font-bold tracking-[0.4px] uppercase transition-colors',
  {
    variants: {
      variant: {
        tf:      'bg-[rgba(155,143,255,0.12)] text-[var(--tv-purple)] border-[rgba(155,143,255,0.3)]',
        state:   'bg-[rgba(77,184,255,0.1)]   text-[var(--tv-purple)]   border-[rgba(77,184,255,0.3)]',
        plan:    'bg-[rgba(255,107,107,0.12)] text-[var(--tv-red)]    border-[rgba(255,107,107,0.3)]',
        aws:     'bg-[rgba(245,166,35,0.12)]  text-[var(--tv-amber)]  border-[rgba(245,166,35,0.3)]',
        purple:   'bg-[rgba(0,224,144,0.1)]    text-[var(--tv-purple)]  border-[rgba(0,224,144,0.3)]',
        ws:      'bg-[rgba(0,212,232,0.1)]    text-[var(-tv-blue)]   border-[rgba(0,212,232,0.3)]',
        amber:   'bg-[rgba(245,166,35,0.12)]  text-[var(--tv-amber)]  border-[rgba(245,166,35,0.3)]',
        red:     'bg-[rgba(255,107,107,0.12)] text-[var(--tv-red)]    border-[rgba(255,107,107,0.3)]',
        blue:    'bg-[rgba(77,184,255,0.1)]   text-[var(--tv-purple)]   border-[rgba(77,184,255,0.3)]',
        muted:   'bg-[var(--tv-bg5)] text-[var(--tv-text3)] border-[var(--tv-border2)]',
      },
    },
    defaultVariants: { variant: 'tf' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
