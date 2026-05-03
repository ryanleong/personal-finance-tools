'use client';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

export function SliderInput({
  label,
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
}: SliderInputProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const displayValue = format ? format(value) : String(value);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">
          {label}
        </label>
        <span className="text-sm font-mono font-semibold text-foreground tabular-nums">
          {displayValue}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={[
          'w-full h-0.75 rounded-full appearance-none cursor-pointer outline-none',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-4',
          '[&::-webkit-slider-thumb]:h-4',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:bg-[#ff2d78]',
          '[&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(255,45,120,0.25)]',
          '[&::-webkit-slider-thumb]:transition-shadow',
          '[&::-webkit-slider-thumb:hover]:shadow-[0_0_0_6px_rgba(255,45,120,0.2)]',
          '[&::-moz-range-thumb]:w-4',
          '[&::-moz-range-thumb]:h-4',
          '[&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:bg-[#ff2d78]',
          '[&::-moz-range-thumb]:border-0',
          '[&::-moz-range-thumb]:cursor-pointer',
          '[&::-moz-range-thumb]:shadow-[0_0_0_3px_rgba(255,45,120,0.25)]',
        ].join(' ')}
        style={{
          background: `linear-gradient(to right, #ff2d78 0%, #ff2d78 ${pct}%, var(--color-border) ${pct}%, var(--color-border) 100%)`,
          // --color-border adapts between light and dark themes
        }}
      />

      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>{format ? format(min) : min}</span>
        <span>{format ? format(max) : max}</span>
      </div>
    </div>
  );
}
