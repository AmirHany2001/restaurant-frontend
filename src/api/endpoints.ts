import { api } from './client'
import type {
  AuthResponse,
  AppUser,
  Category,
  Item,
  ItemSize,
  ItemStatus,
  CreateItemRequest,
  CreateOrderRequest,
  LoginRequest,
  MessageResponse,
  Order,
  OrderStatus,
  PageResponse,
  Role,
  RegisterRequest,
} from './types'

export const authApi = {
  login: (request: LoginRequest) => api<AuthResponse>('/auth/login', { method: 'POST', body: request }),
  register: (request: RegisterRequest) => api<AuthResponse>('/auth/register', { method: 'POST', body: request }),
}

export const orderApi = {
  create: (request: CreateOrderRequest) => api<Order>('/orders', { method: 'POST', body: request }),
  // the orders of one user, newest first (the backend only allows the user themselves or an admin)
  ofUser: (userId: number, page: number, size: number) =>
    api<PageResponse<Order>>(`/orders/user/${userId}`, { params: { page, size } }),
  // only possible while the order is still pending
  cancel: (orderId: number) => api<MessageResponse>(`/orders/${orderId}/cancel`, { method: 'POST' }),
}

// Everything below needs an ADMIN token; the backend answers 403 to anybody else.
export const adminApi = {
  // GET /items is public, so the same endpoint serves the admin list (it includes unavailable items)
  items: (page: number, size: number) => api<PageResponse<Item>>('/items', { params: { page, size } }),
  createItem: (request: CreateItemRequest) => api<Item>('/items', { method: 'POST', body: request }),
  // replaces ALL prices of the item: a size that is left out is no longer sold
  changePrice: (id: number, price: Partial<Record<ItemSize, number>>) =>
    api<MessageResponse>(`/items/${id}/price`, { method: 'PUT', body: price }),
  changeStatus: (id: number, status: ItemStatus) =>
    api<MessageResponse>(`/items/${id}/status/${status}`, { method: 'PUT' }),
  deleteItem: (id: number) => api<MessageResponse>(`/items/${id}`, { method: 'DELETE' }),

  // all orders of all customers, newest first; status = undefined means every status
  orders: (status: OrderStatus | undefined, page: number, size: number) =>
    api<PageResponse<Order>>('/orders', { params: { status, page, size } }),
  setOrderStatus: (id: number, status: OrderStatus) => api<Order>(`/orders/${id}/status/${status}`, { method: 'PUT' }),

  users: (page: number, size: number) => api<PageResponse<AppUser>>('/users', { params: { page, size } }),
  setRole: (id: number, role: Role) => api<AppUser>(`/users/${id}/role`, { method: 'PUT', body: { role } }),
  // the backend also deletes the user's orders
  deleteUser: (id: number) => api<MessageResponse>(`/users/${id}`, { method: 'DELETE' }),

  createCategory: (name: string) => api<Category>('/categories', { method: 'POST', body: { name } }),
  deleteCategory: (name: string) =>
    api<MessageResponse>(`/categories/${encodeURIComponent(name)}`, { method: 'DELETE' }),
}

export const menuApi = {
  // every category with its items inside (public, no login needed)
  categories: () => api<Category[]>('/categories'),
}
