/**
 * Repeated wherever documents or personal data are discussed. The claim
 * boundary matters for this project: only an integrity record is anchored.
 */
export default function OffChainNotice({ className = '' }) {
  return (
    <p className={'flex gap-2.5 rounded-lg border border-brass-500/25 bg-brass-100/50 px-4 py-3 text-sm text-brass-700 ' + className}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="mt-0.5 shrink-0" aria-hidden="true">
        <path d="M10 2.5 3.5 5.5v4c0 3.5 2.6 6.8 6.5 8 3.9-1.2 6.5-4.5 6.5-8v-4L10 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M7.5 10l1.8 1.8 3.2-3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>
        Sensitive documents and personal information are stored off-chain. Only a hash of the
        credential metadata is anchored as an integrity record.
      </span>
    </p>
  );
}
