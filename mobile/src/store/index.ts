import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import petsReducer from './petsSlice';

const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
    whitelist: ['pets', 'groups', 'dailyActions'], // Only persist these fields
};

const persistedReducer = persistReducer(persistConfig, petsReducer);

export const store = configureStore({
    reducer: {
        pets: persistedReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;