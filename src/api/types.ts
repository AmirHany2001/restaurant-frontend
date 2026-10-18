// These types mirror the JSON of the Spring Boot backend (its DTO classes).

export type Role = 'USER' | 'ADMIN'
export type ItemSize = 'small' | 'medium' | 'large'
export type ItemStatus = 'available' | 'not_available'
export type OrderStatus = 'pending' | 'approved' | 'completed' | 'cancelled'

export const ITEM_SIZES: ItemSize[] = ['small', 'medium', 'large']
export const ORDER_STATUSES: OrderStatus[] = ['pending', 'approved', 'completed', 'cancelled']

// The moves the backend allows (Order.Status.canChangeTo). completed and cancelled are final.
// The admin screen only offers these, but the backend checks them again.
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ['approved', 'cancelled'],
  approved: ['completed'],
  completed: [],
  cancelled: [],
}

export interface Item {
  id: number
  name: string
  description: string
  // only the sizes the item is sold in are present
  price: Partial<Record<ItemSize, number>>
  status: ItemStatus
  categoryName: string | null
}

export interface Category {
  id: number
  name: string
  items: Item[]
}

export interface PageResponse<T> {
  content: T[]
  page: number // starts at 0
  size: number
  totalElements: number
  totalPages: number
}

export interface AuthResponse {
  token: string
  tokenType: string
  userId: number
  fullName: string
  email: string
  role: Role
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  phoneNumber: string
  address: string
}

// What an admin sends to create an item. price: only the sizes that are sold, e.g. { small: 50 }
export interface CreateItemRequest {
  name: string
  description: string
  price: Partial<Record<ItemSize, number>>
  categoryId: number
  status: ItemStatus
}

// One line of an order, as the backend returns it (unitPriceAtOrder = the price when it was ordered)
export interface OrderLine {
  itemName: string
  size: ItemSize
  quantity: number
  notes: string | null
  unitPriceAtOrder: number | null
}

export interface Order {
  orderId: number
  orderDate: string // ISO date-time
  orderItems: OrderLine[]
  totalPrice: number // calculated by the server from the current prices
  status: OrderStatus
  // who ordered and where to deliver (optional: an older backend does not send them)
  userId?: number
  customerName?: string
  customerPhone?: string
  deliveryAddress?: string
}

// A user account as the backend returns it (never contains the password)
export interface AppUser {
  id: number
  fullName: string
  email: string
  phoneNumber: string
  address: string
  role: Role
}

// What the client sends: no prices and no user. The server takes prices from the database and the user from the token.
export interface CreateOrderRequest {
  orderItems: { itemName: string; size: ItemSize; quantity: number; notes?: string }[]
}

// The answer of actions that return no data (cancel, delete, ...): the text is already translated
export interface MessageResponse {
  message: string
}

// What the backend answers when something is wrong: { status, message, errors? }
export interface ErrorBody {
  status: number
  message: string
  errors?: Record<string, string> // field name -> message (validation errors)
}
