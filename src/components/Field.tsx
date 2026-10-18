import type { InputHTMLAttributes } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}

// A labelled input. The label is tied to the input with htmlFor/id, so clicking the label focuses
// the input and screen readers announce it.
export default function Field({ label, hint, id, ...inputProps }: FieldProps) {
  const inputId = id ?? inputProps.name
  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={inputId}
        {...inputProps}
        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-start outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
      />
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  )
}
