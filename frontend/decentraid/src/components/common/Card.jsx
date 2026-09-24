import { cn } from '../../utils/cn';

export function Card({ className, children, as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={cn('rounded-xl border border-line bg-white shadow-card', className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-line px-5 py-4', className)}>
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-ink-soft">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}

/** Overview statistic. The figure leads; the label stays quiet beneath it. */
export function StatCard({ label, value, hint, tone = 'neutral', loading = false }) {
  const accent = {
    neutral: 'text-ink',
    ok: 'text-ok-700',
    bad: 'text-bad-700',
    warn: 'text-warn-700',
    seal: 'text-seal-600',
  }[tone];

  return (
    <Card className="p-5">
      <p className="text-sm text-ink-soft">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-16 animate-pulse rounded bg-canvas" />
      ) : (
        <p className={cn('mt-1 text-3xl font-semibold tabular-nums tracking-tight', accent)}>{value}</p>
      )}
      {hint ? <p className="mt-1.5 text-xs text-ink-soft">{hint}</p> : null}
    </Card>
  );
}

export default Card;
