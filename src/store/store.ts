/**
 * @file src/store/store.ts
 * @description Redux Toolkit Store configuration.
 *
 * ARCHITECTURAL ROLE:
 * Serves as the single source of truth for the entire application.
 * By combining `chatSlice` and `uiSlice` with `configureStore()`, we get:
 * 1. Automatic Redux DevTools integration.
 * 2. Built-in Redux Thunk middleware for asynchronous orchestration.
 * 3. Runtime serializability and immutability checks via Immer.
 *
 * UNIDIRECTIONAL DATA FLOW:
 * View (React Component)
 *    │
 *    ▼ (User interaction triggers event handler)
 * dispatch(action or asyncThunk)
 *    │
 *    ▼ (Thunk executes side effects: API, SSE stream)
 * Reducers (Pure functions producing next state via Immer)
 *    │
 *    ▼
 * Store (Updates state tree)
 *    │
 *    ▼ (useAppSelector subscribes components to slices)
 * View Re-renders with updated state
 */

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import chatReducer from './chatSlice';
import uiReducer from './uiSlice';

/**
 * Configure and initialize the centralized Redux store.
 */
export const store = configureStore({
  reducer: {
    chat: chatReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // We enforce strict serializability checks to ensure no raw File objects,
      // AbortControllers, or DOM promises enter the Redux state tree.
      serializableCheck: {
        ignoredActions: [],
        ignoredPaths: [],
      },
    }),
});

/**
 * Infer the `RootState` and `AppDispatch` types directly from the store definition.
 * This ensures full type safety across components without manual type synchronization.
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/**
 * Pre-typed hooks for use throughout the application instead of plain `useDispatch` and `useSelector`.
 * - `useAppDispatch`: Knows the exact thunk return types and action creators.
 * - `useAppSelector`: Automatically infers the entire state shape with autocomplete.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
