import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { forwardRef, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';

/* ---------- Buttons ---------- */

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'quiet';

interface BtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  variant?: BtnVariant;
  size?: 'sm' | 'md' | 'lg';
  arrow?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  /** Looks disabled but stays focusable/clickable so the click can explain what's missing. */
  softDisabled?: boolean;
  block?: boolean;
}

export function Button({ variant = 'primary', size = 'md', arrow, loading, icon, softDisabled, block, className, children, disabled, ...rest }: BtnProps) {
  return (
    <motion.button
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      className={`btn btn-${variant} btn-${size} ${block ? 'btn-block' : ''} ${softDisabled ? 'is-soft-disabled' : ''} ${className ?? ''}`}
      disabled={disabled || loading}
      aria-disabled={softDisabled || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="spin" size={18} aria-hidden /> : icon}
      <span>{children}</span>
      {arrow && !loading && <ArrowRight className="btn-arrow" size={size === 'lg' ? 20 : 18} aria-hidden />}
    </motion.button>
  );
}

export function ButtonLink({ to, variant = 'primary', size = 'md', arrow, icon, className, children, ...rest }: { to: string; variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; arrow?: boolean; icon?: ReactNode; className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <Link to={to} className={`btn btn-${variant} btn-${size} ${className ?? ''}`} {...rest}>
      {icon}
      <span>{children}</span>
      {arrow && <ArrowRight className="btn-arrow" size={size === 'lg' ? 20 : 18} aria-hidden />}
    </Link>
  );
}

/* ---------- Fields ---------- */

export function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p id={id} className="field-error" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

interface FieldShellProps {
  label: string;
  optional?: boolean;
  error?: string;
  hint?: ReactNode;
  children: (ids: { inputId: string; describedBy?: string }) => ReactNode;
  className?: string;
}

export function FieldShell({ label, optional, error, hint, children, className }: FieldShellProps) {
  const base = useId();
  const inputId = `${base}-input`;
  const errId = `${base}-err`;
  const hintId = `${base}-hint`;
  const describedBy = [error ? errId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className ?? ''}`}>
      <label className="label" htmlFor={inputId}>
        {label}
        {optional && <span className="label-optional">Optional</span>}
      </label>
      {children({ inputId, describedBy })}
      {hint && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
      <FieldError id={errId} message={error} />
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  optional?: boolean;
  error?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  fieldClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField({ label, optional, error, hint, icon, fieldClassName, ...input }, ref) {
  return (
    <FieldShell label={label} optional={optional} error={error} hint={hint} className={fieldClassName}>
      {({ inputId, describedBy }) => (
        <div className={`input-wrap ${icon ? 'has-icon' : ''}`}>
          {icon && <span className="input-icon">{icon}</span>}
          <input ref={ref} id={inputId} className="input" aria-invalid={!!error || undefined} aria-describedby={describedBy} {...input} />
        </div>
      )}
    </FieldShell>
  );
});

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  optional?: boolean;
  error?: string;
  hint?: ReactNode;
  fieldClassName?: string;
}

export function TextArea({ label, optional, error, hint, fieldClassName, ...input }: TextAreaProps) {
  return (
    <FieldShell label={label} optional={optional} error={error} hint={hint} className={fieldClassName}>
      {({ inputId, describedBy }) => <textarea id={inputId} className="input textarea" aria-invalid={!!error || undefined} aria-describedby={describedBy} {...input} />}
    </FieldShell>
  );
}

/* ---------- Selectable pills ---------- */

export function PillGroup<T extends string>({ label, options, value, onChange, error }: { label: string; options: { value: T; label: string }[]; value: T | ''; onChange: (v: T) => void; error?: string }) {
  const id = useId();
  return (
    <fieldset className={`field ${error ? 'has-error' : ''}`} aria-describedby={error ? `${id}-err` : undefined}>
      <legend className="label">{label}</legend>
      <div className="pill-row" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={`pill ${value === o.value ? 'is-selected' : ''}`} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
      <FieldError id={`${id}-err`} message={error} />
    </fieldset>
  );
}

/* ---------- Selectable card ---------- */

export function SelectCard({ selected, onSelect, children, className, badge, label }: { selected: boolean; onSelect: () => void; children: ReactNode; className?: string; badge?: ReactNode; label?: string }) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      className={`select-card ${selected ? 'is-selected' : ''} ${className ?? ''}`}
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18 }}
    >
      {badge}
      <AnimatePresence>
        {selected && (
          <motion.span className="select-check" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 28 }} aria-hidden>
            <Check size={14} strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
      {children}
    </motion.button>
  );
}

/* ---------- Checkbox ---------- */

export function Checkbox({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId();
  return (
    <label className="checkbox" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="checkbox-box" aria-hidden>
        <Check size={14} strokeWidth={3} />
      </span>
      <span>
        <span className="checkbox-label">{label}</span>
        {description && <span className="checkbox-desc">{description}</span>}
      </span>
    </label>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className ?? ''}`}>{children}</p>;
}

export function PrototypeNote({ children }: { children: ReactNode }) {
  return (
    <p className="prototype-note">
      <span className="prototype-tag">Prototype</span>
      {children}
    </p>
  );
}
