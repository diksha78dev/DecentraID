import { cn } from '../../utils/cn';

/**
 * Table that becomes a card list below the md breakpoint. Each column declares
 * a header and a cell renderer once; both layouts read from the same
 * definition so the two never drift apart.
 *
 * columns: [{ key, header, cell(row), className, primary?, hideOnCard? }]
 */
export default function Table({ columns, rows, keyField = 'id', empty = null, onRowClick, caption }) {
  if (!rows?.length) return empty;

  return (
    <>
      {/* Desktop and tablet */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-line text-left">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn('whitespace-nowrap px-5 py-3 font-medium text-ink-soft', c.className)}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row[keyField]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-line/70 last:border-0',
                  onRowClick && 'cursor-pointer hover:bg-canvas',
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-5 py-3.5 align-middle text-ink', c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: one card per record */}
      <ul className="divide-y divide-line md:hidden">
        {rows.map((row) => {
          const primary = columns.find((c) => c.primary) || columns[0];
          const rest = columns.filter((c) => c !== primary && !c.hideOnCard);
          return (
            <li key={row[keyField]} className="px-4 py-4">
              <div className="mb-3 font-medium text-ink">{primary.cell(row)}</div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                {rest.map((c) => (
                  <div key={c.key} className="contents">
                    <dt className="text-ink-soft">{c.header}</dt>
                    <dd className="text-right text-ink">{c.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>
    </>
  );
}
