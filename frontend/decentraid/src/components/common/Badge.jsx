import { cn } from '../../utils/cn';

const TONES = {
  neutral: 'bg-canvas text-ink-muted border-line',
  ok: 'bg-ok-50 text-ok-700 border-ok-500/25',
  bad: 'bg-bad-50 text-bad-700 border-bad-500/25',
  warn: 'bg-warn-50 text-warn-700 border-warn-500/25',
  seal: 'bg-seal-50 text-seal-700 border-seal-200',
  brass: 'bg-brass-100 text-brass-700 border-brass-500/25',
};

export default function Badge({ tone = 'neutral', className, children, dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
