/**
 * The mark: a seal ring around a registry glyph. Identity credentials are an
 * institutional artefact, so the wordmark reads as a registry rather than a
 * consumer app.
 */
export default function Logo({ size = 28, tone = 'light', showWord = true }) {
  const ring = tone === 'light' ? '#2E8078' : '#0E5A54';
  const face = tone === 'light' ? '#FFFFFF' : '#101418';

  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="14" stroke={ring} strokeWidth="2" />
        <circle cx="16" cy="16" r="9.5" stroke={ring} strokeWidth="1" strokeDasharray="2 2.6" />
        <path
          d="M12 16.4l2.9 2.9L20.5 13"
          stroke={face}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showWord ? (
        <span
          className="text-[0.975rem] font-semibold tracking-tight"
          style={{ color: tone === 'light' ? '#FFFFFF' : '#101418' }}
        >
          DecentraID
        </span>
      ) : null}
    </span>
  );
}
