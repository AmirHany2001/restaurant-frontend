import { ITEM_SIZES, type ItemSize } from '../api/types'

export type PriceInputs = Record<ItemSize, string>

export const emptyPriceInputs = (): PriceInputs => ({ small: '', medium: '', large: '' })

// Turns what was typed in the three price boxes into the { size: price } object the backend wants.
//  - an empty box means "this size is not sold"
//  - a filled box must be a positive number with at most 2 decimals (the backend checks the same)
//  - at least one size is required
export type ParsedPrices =
  | { ok: true; prices: Partial<Record<ItemSize, number>> }
  | { ok: false; reason: 'invalid' | 'required' }

export function parsePrices(inputs: PriceInputs): ParsedPrices {
  const prices: Partial<Record<ItemSize, number>> = {}

  for (const size of ITEM_SIZES) {
    const text = inputs[size].trim().replace(',', '.') // some keyboards type a decimal comma
    if (text === '') continue
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(text)) return { ok: false, reason: 'invalid' }
    const value = Number(text)
    if (value <= 0) return { ok: false, reason: 'invalid' }
    prices[size] = value
  }

  return Object.keys(prices).length === 0 ? { ok: false, reason: 'required' } : { ok: true, prices }
}

// the opposite: an item's current prices -> text for the boxes
export function toPriceInputs(price: Partial<Record<ItemSize, number>>): PriceInputs {
  const inputs = emptyPriceInputs()
  for (const size of ITEM_SIZES) {
    if (price[size] !== undefined) inputs[size] = String(price[size])
  }
  return inputs
}
