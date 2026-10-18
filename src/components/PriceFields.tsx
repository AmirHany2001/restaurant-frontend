import { useTranslation } from 'react-i18next'
import { ITEM_SIZES } from '../api/types'
import type { PriceInputs } from '../utils/prices'

interface PriceFieldsProps {
  values: PriceInputs
  onChange: (values: PriceInputs) => void
}

// Three boxes, one per size. Shared by "add product" and "edit prices".
export default function PriceFields({ values, onChange }: PriceFieldsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-3 gap-2">
      {ITEM_SIZES.map((size) => (
        <label key={size} className="block text-sm">
          <span className="mb-1 block text-stone-600">{t(`menu.size.${size}`)}</span>
          <input
            type="text"
            inputMode="decimal"
            dir="ltr" // numbers are always typed left-to-right
            value={values[size]}
            onChange={(e) => onChange({ ...values, [size]: e.target.value })}
            className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 outline-none focus:border-amber-500"
          />
        </label>
      ))}
    </div>
  )
}
