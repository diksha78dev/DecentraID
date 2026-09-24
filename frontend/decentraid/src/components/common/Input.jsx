import { useId } from 'react';
import { cn } from '../../utils/cn';

const base =
  'w-full rounded-md border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70 ' +
  'transition-colors disabled:cursor-not-allowed disabled:bg-canvas';

export function Input({ label, hint, error, className, mono = false, id, ...props }) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={fieldId} className="field-label">
          {label}
          {props.required ? <span className="ml-0.5 text-bad-500">*</span> : null}
        </label>
      ) : null}
      <input
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? fieldId + '-err' : hint ? fieldId + '-hint' : undefined}
        className={cn(base, mono && 'font-mono text-[0.8125rem]', error ? 'border-bad-500' : 'border-line')}
        {...props}
      />
      {error ? (
        <p id={fieldId + '-err'} className="mt-1 text-sm text-bad-700">
          {error}
        </p>
      ) : hint ? (
        <p id={fieldId + '-hint'} className="mt-1 text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Select({ label, hint, error, options = [], placeholder, className, id, children, ...props }) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={fieldId} className="field-label">
          {label}
          {props.required ? <span className="ml-0.5 text-bad-500">*</span> : null}
        </label>
      ) : null}
      <select
        id={fieldId}
        aria-invalid={Boolean(error)}
        className={cn(base, 'appearance-none pr-8', error ? 'border-bad-500' : 'border-line')}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5 6 6.5l5-5' stroke='%236B7684' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
        }}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) =>
          typeof o === 'string' ? (
            <option key={o} value={o}>
              {o}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ),
        )}
        {children}
      </select>
      {error ? (
        <p className="mt-1 text-sm text-bad-700">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}

export function Textarea({ label, hint, error, className, id, rows = 3, ...props }) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={fieldId} className="field-label">
          {label}
        </label>
      ) : null}
      <textarea
        id={fieldId}
        rows={rows}
        className={cn(base, 'resize-y', error ? 'border-bad-500' : 'border-line')}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-sm text-bad-700">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}

export default Input;
