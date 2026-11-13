'use client';

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Icon } from '../Icon';

/**
 * C30 TextField family. Label above, hint below, error replaces nothing (both can show). `aria-invalid` and
 * `aria-describedby` are wired so screen readers announce the error with the field.
 */
type Common = { label: ReactNode; hint?: ReactNode; error?: string | null; optional?: boolean; className?: string };

function Wrap({ id, label, hint, error, optional, className = '', children, counter }: Common & { id: string; children: ReactNode; counter?: ReactNode }) {
  return (
    <div className={`ui-field ${className}`}>
      <div className="field-labelrow">
        <label className="ui-field__label" htmlFor={id}>
          {label}
          {optional && <span className="text-secondary t-caption"> (optional)</span>}
        </label>
        {counter}
      </div>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="ui-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="ui-field__error" role="alert">
          <Icon name="alert" size={14} strokeWidth={2} />
          {error}
        </p>
      )}
    </div>
  );
}

const described = (id: string, hint?: ReactNode, error?: string | null) => [hint ? `${id}-hint` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined;

export function TextField({ label, hint, error, optional, className, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const id = rest.id ?? auto;
  const max = typeof rest.maxLength === 'number' && typeof rest.value === 'string' ? rest.maxLength : null;
  return (
    <Wrap
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
      counter={max ? <span className="t-caption text-secondary">{`${(rest.value as string).length}/${max}`}</span> : undefined}
    >
      <input {...rest} id={id} className="ui-input neu-field" aria-invalid={error ? true : undefined} aria-describedby={described(id, hint, error)} />
    </Wrap>
  );
}

export function TextArea({ label, hint, error, optional, className, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const id = rest.id ?? auto;
  const max = typeof rest.maxLength === 'number' && typeof rest.value === 'string' ? rest.maxLength : null;
  return (
    <Wrap
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
      counter={max ? <span className="t-caption text-secondary">{`${(rest.value as string).length}/${max}`}</span> : undefined}
    >
      <textarea {...rest} id={id} className="ui-input ui-textarea neu-field" aria-invalid={error ? true : undefined} aria-describedby={described(id, hint, error)} />
    </Wrap>
  );
}

export function SelectField({ label, hint, error, optional, className, children, ...rest }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const id = rest.id ?? auto;
  return (
    <Wrap id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <div className="ui-select">
        <select {...rest} id={id} className="ui-input neu-field" aria-invalid={error ? true : undefined} aria-describedby={described(id, hint, error)}>
          {children}
        </select>
        <Icon name="chev" className="ui-select__chev" />
      </div>
    </Wrap>
  );
}

/** Checkbox row (neumorphic box with crimson check when checked). */
export function Checkbox({ label, checked, onChange, hint, name, value }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; hint?: ReactNode; name?: string; value?: string }) {
  const id = useId();
  return (
    <label className="ui-checkbox" htmlFor={id}>
      <input id={id} type="checkbox" name={name} value={value} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="ui-checkbox__box" aria-hidden="true">
        <Icon name="check" strokeWidth={2.5} />
      </span>
      <span className="ui-checkbox__label">
        {label}
        {hint && <span className="ui-field__hint" style={{ display: 'block' }}>{hint}</span>}
      </span>
    </label>
  );
}

/** C43 Toggle (switch role). */
export function Switch({ label, checked, onChange, hint }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; hint?: ReactNode }) {
  return (
    <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-1)' }}>
      <button type="button" role="switch" aria-checked={checked} className="ui-switch" onClick={() => onChange(!checked)}>
        <span className="ui-switch__track">
          <span className="ui-switch__thumb" />
        </span>
        {label}
      </button>
      {hint && <p className="ui-field__hint">{hint}</p>}
    </div>
  );
}

/** Chip input for tags/skills: Enter or comma adds, Backspace on empty removes the last chip. */
export function ChipInput({
  label,
  values,
  onChange,
  max,
  hint,
  error,
  placeholder,
  normalise = (s) => s.trim(),
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  max: number;
  hint?: ReactNode;
  error?: string | null;
  placeholder?: string;
  normalise?: (s: string) => string;
}) {
  const id = useId();
  const add = (raw: string) => {
    const v = normalise(raw);
    if (!v || values.includes(v) || values.length >= max) return;
    onChange([...values, v]);
  };
  return (
    <div className="ui-field">
      <div className="field-labelrow">
        <label className="ui-field__label" htmlFor={id}>
          {label}
        </label>
        <span className="t-caption text-secondary">{`${values.length}/${max}`}</span>
      </div>
      <div className="chip-input neu-field" aria-invalid={error ? true : undefined}>
        <ul className="ui-chip-row" aria-label={`${label} added`}>
          {values.map((v) => (
            <li key={v} className="ui-chip ui-chip--removable">
              {v}
              <button type="button" className="ui-chip__remove" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((x) => x !== v))}>
                <Icon name="x" />
              </button>
            </li>
          ))}
        </ul>
        <input
          id={id}
          className="chip-input__field"
          placeholder={values.length >= max ? `Limit of ${max} reached` : placeholder}
          disabled={values.length >= max}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onKeyDown={(e) => {
            const el = e.currentTarget;
            if ((e.key === 'Enter' || e.key === ',') && el.value.trim()) {
              e.preventDefault();
              add(el.value);
              el.value = '';
            } else if (e.key === 'Backspace' && !el.value && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={(e) => {
            if (e.currentTarget.value.trim()) {
              add(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
      </div>
      {hint && (
        <p id={`${id}-hint`} className="ui-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p className="ui-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
