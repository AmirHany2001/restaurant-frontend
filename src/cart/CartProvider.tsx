import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ITEM_SIZES, type Item, type ItemSize } from '../api/types'
import { CartContext, MAX_QUANTITY, type CartContextValue, type CartLine } from './useCart'

const KEY = 'cart'

// The cart lives in localStorage so it survives a refresh. Anything read back is checked, because
// the stored text could be old (from an earlier version of the app) or edited by hand.
function loadCart(): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (line): line is CartLine =>
        typeof line === 'object' &&
        line !== null &&
        typeof line.itemId === 'number' &&
        typeof line.itemName === 'string' &&
        ITEM_SIZES.includes(line.size) &&
        typeof line.unitPrice === 'number' &&
        Number.isInteger(line.quantity) &&
        line.quantity >= 1,
    ).map((line) => ({ ...line, notes: typeof line.notes === 'string' ? line.notes : '' }))
  } catch {
    return []
  }
}

const sameLine = (line: CartLine, itemId: number, size: ItemSize) => line.itemId === itemId && line.size === size

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadCart)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines))
    } catch {
      // not critical: the cart just is not remembered
    }
  }, [lines])

  const add = useCallback((item: Item, size: ItemSize) => {
    const unitPrice = item.price[size]
    if (unitPrice === undefined) return
    setLines((current) => {
      const existing = current.find((line) => sameLine(line, item.id, size))
      if (existing) {
        return current.map((line) =>
          line === existing ? { ...line, quantity: Math.min(line.quantity + 1, MAX_QUANTITY) } : line,
        )
      }
      return [...current, { itemId: item.id, itemName: item.name, size, unitPrice, quantity: 1, notes: '' }]
    })
  }, [])

  const setQuantity = useCallback((itemId: number, size: ItemSize, quantity: number) => {
    setLines((current) =>
      quantity < 1
        ? current.filter((line) => !sameLine(line, itemId, size))
        : current.map((line) =>
            sameLine(line, itemId, size) ? { ...line, quantity: Math.min(quantity, MAX_QUANTITY) } : line,
          ),
    )
  }, [])

  const setNotes = useCallback((itemId: number, size: ItemSize, notes: string) => {
    setLines((current) => current.map((line) => (sameLine(line, itemId, size) ? { ...line, notes } : line)))
  }, [])

  const remove = useCallback((itemId: number, size: ItemSize) => {
    setLines((current) => current.filter((line) => !sameLine(line, itemId, size)))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<CartContextValue>(() => {
    // money is summed in cents (whole numbers) so 0.1 + 0.2 style rounding errors cannot appear
    const cents = lines.reduce((sum, line) => sum + Math.round(line.unitPrice * 100) * line.quantity, 0)
    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      total: cents / 100,
      add,
      setQuantity,
      setNotes,
      remove,
      clear,
    }
  }, [lines, add, setQuantity, setNotes, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
