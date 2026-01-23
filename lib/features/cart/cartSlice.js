import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

let debounceTimer = null

export const uploadCart = createAsyncThunk('cart/uploadCart', 
    async ({ getToken }, thunkAPI) => {
        try {
            const { cartItems } = thunkAPI.getState().cart;
            const token = await getToken();
            
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            await axios.post('/api/cart', {cart: cartItems}, config)
            return { success: true }
        } catch (error) {
            console.error('[uploadCart] error:', error.response?.data || error.message);
            return thunkAPI.rejectWithValue(error.response?.data || { error: 'Failed to upload cart' })
        }
    }
)

export const fetchCart = createAsyncThunk('cart/fetchCart', 
    async ({ getToken }, thunkAPI) => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/cart', {headers: { Authorization: `Bearer ${token}` }})
            return data
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data)
        }
    }
)


const cartSlice = createSlice({
    name: 'cart',
    initialState: (() => {
        // Guard against SSR: only read localStorage in the browser
        if (typeof window === 'undefined') {
            return { total: 0, cartItems: {} };
        }
        let saved = null;
        try {
            saved = JSON.parse(localStorage.getItem('cartState'));
        } catch {}
        return saved || { total: 0, cartItems: {} };
    })(),
    reducers: {
        rehydrateCart: (state) => {
            if (typeof window === 'undefined') {
                return;
            }
            let saved = null;
            const raw = localStorage.getItem('cartState');
            try {
                saved = JSON.parse(raw);
            } catch (e) {
                console.error('[cartSlice] Failed to parse cartState:', e);
            }
            
            // ONLY rehydrate if localStorage has items AND current state is empty
            const hasLocalItems = saved && saved.cartItems && Object.keys(saved.cartItems).length > 0;
            const currentIsEmpty = Object.keys(state.cartItems).length === 0;
            
            if (hasLocalItems && currentIsEmpty) {
                state.cartItems = saved.cartItems;
                state.total = saved.total || 0;
            }
        },
        addToCart: (state, action) => {
            const { productId } = action.payload
            const existing = state.cartItems[productId] || 0
            const nextQty = existing + 1
            state.cartItems[productId] = nextQty
            state.total += 1
        },
        removeFromCart: (state, action) => {
            const { productId } = action.payload
            const existing = state.cartItems[productId]
            if (!existing) return
            const nextQty = existing - 1
            if (nextQty <= 0) {
                delete state.cartItems[productId]
            } else {
                state.cartItems[productId] = nextQty
            }
            state.total = Math.max(0, state.total - 1)
        },
        deleteItemFromCart: (state, action) => {
            const { productId } = action.payload || {}
            const existing = state.cartItems[productId]
            const qty = existing || 0
            state.total = Math.max(0, state.total - qty)
            delete state.cartItems[productId]
        },
        clearCart: (state) => {
            state.cartItems = {}
            state.total = 0
        },
    },
    extraReducers: (builder)=>{
        builder.addCase(fetchCart.fulfilled, (state, action)=>{
            state.cartItems = action.payload.cart || {}
            state.total = Object.values(state.cartItems).reduce((acc, qty) => acc + (qty || 0), 0)
        })
    }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart } = cartSlice.actions

export default cartSlice.reducer
