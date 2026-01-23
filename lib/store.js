import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './features/cart/cartSlice'
import productReducer from './features/product/productSlice'
import addressReducer from './features/address/addressSlice'
import ratingReducer from './features/rating/ratingSlice'

// Persist cart to localStorage after cart actions (runs on client only)
const cartPersistenceMiddleware = store => next => action => {
    const result = next(action);
    if (typeof window !== 'undefined' && action.type.startsWith('cart/')) {
        try {
            const cartState = store.getState().cart;
            localStorage.setItem('cartState', JSON.stringify(cartState));
        } catch (e) {
            console.warn('[cartMiddleware] failed to persist cartState', e);
        }
    }
    return result;
};

export const makeStore = () => configureStore({
    reducer: {
        cart: cartReducer,
        product: productReducer,
        address: addressReducer,
        rating: ratingReducer,
    },
    middleware: (getDefault) => getDefault().concat(cartPersistenceMiddleware),
    // No need to add thunk manually; it's included by default
});