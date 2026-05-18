interface Option<V extends string> {
  value: V;
  label: string;
}

interface Props<V extends string> {
  label: string;
  value: V;
  options: Option<V>[];
  onChange: (v: V) => void;
}

export default function RadioGroup<V extends string>({ label, value, options, onChange }: Props<V>) {
  return (
    <div className="form-section">
      <label className="form-label">{label}</label>
      <div className="chip-group">
        {options.map((o) => (
          <button
            type="button"
            key={o.value}
            className={`chip ${value === o.value ? 'active' : ''}`}
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
