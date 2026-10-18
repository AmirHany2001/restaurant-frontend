import { createContext, useContext } from 'react'
import type { Item, ItemSize } from '../api/types'

export interface CartLine {
  itemId: number
  itemName: string
  size: ItemSize
  unitPrice: number // only for showing; the server recalculates the real price
  quantity: number
  notes: string
}

export interface CartContextValue {
  lines: CartLine[]
  count: number // total number of pieces (for the badge in the header)
  total: number // estimated total
  add: (item: Item, size: ItemSize) => void
  setQuantity: (itemId: number, size: ItemSize, quantity: number) => void
  setNotes: (itemId: number, size: ItemSize, notes: string) => void
  remove: (itemId: number, size: ItemSize) => void
  clear: () => void
}

export const MAX_QUANTITY = 99

export const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside <CartProvider>')
  return context
}
