import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Vérifie la connexion à un serveur donné (IP + port)
export const pingServer = createAsyncThunk(
  'server/pingServer',
  async ({ ip, port }, { rejectWithValue }) => {
    try {
      const res = await fetch(`http://${ip}:${port}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      return { ip, port, serverInfo: { message: text } };
    } catch (err) {
      return rejectWithValue({
        message: err.message.includes('Network request failed')
          ? 'Connexion impossible. Vérifie l’adresse IP et le port.'
          : `Erreur serveur : ${err.message}`
      });
    }
  }
);

// Récupère la liste des modèles disponibles depuis le serveur
export const retrieveModels = createAsyncThunk(
  'server/retrieveModels',
  async (_, { getState, rejectWithValue }) => {
    const { server } = getState();
    if (!server.connected) {
      return rejectWithValue({ message: 'Serveur non connecté' });
    }

    try {
      const res = await fetch(`http://${server.ip}:${server.port}/getmodels`, {
        method: 'GET'
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.models || [];
    } catch (err) {
      return rejectWithValue({
        message: `Erreur récupération modèles : ${err.message}`
      });
    }
  }
);

const initialState = {
  ip: '192.168.1.100',
  port: '8000',
  connected: false,
  connecting: false,
  serverInfo: null,
  availableModels: [],
  error: null,
  lastConnectionAttempt: null
};

const serverSlice = createSlice({
  name: 'server',
  initialState,
  reducers: {
    updateServer: (state, { payload }) => {
      state.ip = payload.ip;
      state.port = payload.port;
      if (state.connected) {
        state.connected = false;
        state.serverInfo = null;
        state.availableModels = [];
      }
    },
    disconnectServer: (state) => {
      state.connected = false;
      state.serverInfo = null;
      state.availableModels = [];
      state.error = null;
    },
    resetServerError: (state) => {
      state.error = null;
    },
    setModelList: (state, { payload }) => {
      state.availableModels = payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(pingServer.pending, (state) => {
        state.connecting = true;
        state.error = null;
        state.lastConnectionAttempt = new Date().toISOString();
      })
      .addCase(pingServer.fulfilled, (state, { payload }) => {
        state.connecting = false;
        state.connected = true;
        state.ip = payload.ip;
        state.port = payload.port;
        state.serverInfo = payload.serverInfo;
      })
      .addCase(pingServer.rejected, (state, { payload }) => {
        state.connecting = false;
        state.connected = false;
        state.serverInfo = null;
        state.availableModels = [];
        state.error = payload.message;
      })
      .addCase(retrieveModels.fulfilled, (state, { payload }) => {
        state.availableModels = payload;
        state.error = null;
      })
      .addCase(retrieveModels.rejected, (state, { payload }) => {
        state.error = payload.message;
      });
  }
});

export const {
  updateServer,
  disconnectServer,
  resetServerError,
  setModelList
} = serverSlice.actions;

export default serverSlice.reducer;
