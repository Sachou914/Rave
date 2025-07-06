import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import audioReducer from './slices/audioSlice';
import serverReducer from './slices/serverSlice';
import uiReducer from './slices/uiSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['audio', 'server'],
  blacklist: ['ui']
};

const rootReducer = combineReducers({
  audio: audioReducer,
  server: serverReducer,
  ui: uiReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['_persist']
      }
    }),
  devTools: __DEV__
});

export const persistor = persistStore(store);
