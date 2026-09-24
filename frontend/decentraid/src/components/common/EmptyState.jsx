import Button from './Button';

/** An empty screen is an invitation to act, so it carries the next action. */
export default function EmptyState({ title, description, action, icon = 'records' }) {
  const glyph = {
    records: (
      <path d="M8 10h16M8 16h16M8 22h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    ),
    inbox: (
      <path
        d="M6 18h6l2 4h4l2-4h6M6 18l3-9h14l3 9v6H6v-6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
    check: (
      <path d="M10 16.5l4.5 4.5L23 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ),
  }[icon];

  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-canvas text-ink-soft">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          {glyph}
        </svg>
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{description}</p>
      ) : null}
      {action ? (
        <div className="mt-5">
          {typeof action === 'object' && action.label ? (
            <Button onClick={action.onClick}>{action.label}</Button>
          ) : (
            action
          )}
        </div>
      ) : null}
    </div>
  );
}
