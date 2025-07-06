import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as FileSystem from 'expo-file-system';

export const loadRecordings = createAsyncThunk(
  'audio/loadRecordings',
  async () => {
    try {
      const dir = `${FileSystem.documentDirectory}recordings/`;
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        return [];
      }
      const files = await FileSystem.readDirectoryAsync(dir);
      const result = [];

      for (const file of files) {
        if (file.endsWith('.m4a') || file.endsWith('.wav')) {
          const metaUri = `${dir}${file}.json`;
          const metaInfo = await FileSystem.getInfoAsync(metaUri);
          if (metaInfo.exists) {
            const meta = JSON.parse(await FileSystem.readAsStringAsync(metaUri));
            result.push({
              id: meta.id,
              name: meta.name,
              uri: `${dir}${file}`,
              createdAt: meta.createdAt,
              duration: meta.duration
            });
          }
        }
      }

      return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (err) {
      console.error('Load error:', err);
      return [];
    }
  }
);

export const deleteRecording = createAsyncThunk(
  'audio/deleteRecording',
  async (id, { getState }) => {
    const { audio } = getState();
    const target = audio.recordings.find(r => r.id === id);
    if (target) {
      await FileSystem.deleteAsync(target.uri, { idempotent: true });
      await FileSystem.deleteAsync(`${target.uri}.json`, { idempotent: true });
    }
    return id;
  }
);

const initialState = {
  recordings: [],
  currentAudio: {
    selectedFile: null,
    originalAudio: null,
    transformedAudio: null,
    selectedModel: null
  },
  loading: {
    recordings: false,
    deleting: false
  },
  error: null
};

const audioSlice = createSlice({
  name: 'audio',
  initialState,
  reducers: {
    addRecording: (state, { payload }) => {
      state.recordings.unshift({
        id: payload.id || Date.now().toString(),
        name: payload.name,
        uri: payload.uri,
        createdAt: payload.createdAt || new Date().toISOString(),
        duration: payload.duration || 0
      });
    },
    setSelectedFile: (state, { payload }) => {
      state.currentAudio.selectedFile = payload;
      state.currentAudio.transformedAudio = null;
    },
    setSelectedModel: (state, { payload }) => {
      state.currentAudio.selectedModel = payload;
    },
    setOriginalAudio: (state, { payload }) => {
      state.currentAudio.originalAudio = payload;
    },
    setTransformedAudio: (state, { payload }) => {
      state.currentAudio.transformedAudio = payload;
    },
    resetCurrentAudio: (state) => {
      state.currentAudio = {
        selectedFile: null,
        originalAudio: null,
        transformedAudio: null,
        selectedModel: state.currentAudio.selectedModel
      };
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadRecordings.pending, (state) => {
        state.loading.recordings = true;
        state.error = null;
      })
      .addCase(loadRecordings.fulfilled, (state, { payload }) => {
        state.loading.recordings = false;
        state.recordings = payload;
      })
      .addCase(loadRecordings.rejected, (state, { error }) => {
        state.loading.recordings = false;
        state.error = error.message;
      })
      .addCase(deleteRecording.pending, (state) => {
        state.loading.deleting = true;
      })
      .addCase(deleteRecording.fulfilled, (state, { payload }) => {
        state.loading.deleting = false;
        state.recordings = state.recordings.filter(r => r.id !== payload);
      })
      .addCase(deleteRecording.rejected, (state, { error }) => {
        state.loading.deleting = false;
        state.error = error.message;
      });
  }
});

export const {
  addRecording,
  setSelectedFile,
  setSelectedModel,
  setOriginalAudio,
  setTransformedAudio,
  resetCurrentAudio,
  clearError
} = audioSlice.actions;

export default audioSlice.reducer;
