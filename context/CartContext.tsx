import { createContext, useReducer, useCallback, useContext } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, CartAddon } from '@/types';

interface CartState {
  items: CartItem[];
  tableId: number | null;
  tableName: string | null;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  notes: string;
}

type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'UPDATE_QTY'; id: string; quantity: number }
  | { type: 'SET_TABLE'; tableId: number | null; tableName: string | null }
  | { type: 'SET_ORDER_TYPE'; orderType: 'DINE_IN' | 'TAKEAWAY' }
  | { type: 'SET_NOTES'; notes: string }
  | { type: 'CLEAR' };

interface CartContextType {
  items: CartItem[];
  tableId: number | null;
  tableName: string | null;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  notes: string;
  itemCount: number;
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, quantity: number) => void;
  setTable: (tableId: number | null, tableName: string | null) => void;
  setOrderType: (type: 'DINE_IN' | 'TAKEAWAY') => void;
  setNotes: (notes: string) => void;
  clear: () => void;
}

const initialState: CartState = {
  items: [],
  tableId: null,
  tableName: null,
  orderType: 'DINE_IN',
  notes: '',
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Check if same product+variant+addons already exists
      const existing = state.items.find(i =>
        i.productId === action.item.productId &&
        i.variantId === action.item.variantId &&
        i.notes === action.item.notes &&
        JSON.stringify(i.addons) === JSON.stringify(action.item.addons)
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === existing.id ? { ...i, quantity: i.quantity + action.item.quantity } : i
          ),
        };
      }
      return { ...state, items: [...state.items, action.item] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case 'UPDATE_QTY':
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter(i => i.id !== action.id) };
      }
      return {
        ...state,
        items: state.items.map(i => i.id === action.id ? { ...i, quantity: action.quantity } : i),
      };
    case 'SET_TABLE':
      return { ...state, tableId: action.tableId, tableName: action.tableName };
    case 'SET_ORDER_TYPE':
      return { ...state, orderType: action.orderType };
    case 'SET_NOTES':
      return { ...state, notes: action.notes };
    case 'CLEAR':
      return initialState;
    default:
      return state;
  }
}

export const CartContext = createContext<CartContextType>({
  items: [],
  tableId: null,
  tableName: null,
  orderType: 'DINE_IN',
  notes: '',
  itemCount: 0,
  total: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  setTable: () => {},
  setOrderType: () => {},
  setNotes: () => {},
  clear: () => {},
});

function calcItemTotal(item: CartItem): number {
  const addonsTotal = item.addons.reduce((sum, a) => sum + a.price * a.quantity, 0);
  return (item.unitPrice + addonsTotal) * item.quantity;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const total = state.items.reduce((sum, i) => sum + calcItemTotal(i), 0);

  const addItem = useCallback((item: CartItem) => dispatch({ type: 'ADD_ITEM', item }), []);
  const removeItem = useCallback((id: string) => dispatch({ type: 'REMOVE_ITEM', id }), []);
  const updateQty = useCallback((id: string, quantity: number) => dispatch({ type: 'UPDATE_QTY', id, quantity }), []);
  const setTable = useCallback((tableId: number | null, tableName: string | null) => dispatch({ type: 'SET_TABLE', tableId, tableName }), []);
  const setOrderType = useCallback((orderType: 'DINE_IN' | 'TAKEAWAY') => dispatch({ type: 'SET_ORDER_TYPE', orderType }), []);
  const setNotes = useCallback((notes: string) => dispatch({ type: 'SET_NOTES', notes }), []);
  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  return (
    <CartContext.Provider value={{
      ...state, itemCount, total,
      addItem, removeItem, updateQty, setTable, setOrderType, setNotes, clear,
    }}>
      {children}
    </CartContext.Provider>
  );
}
