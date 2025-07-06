import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isRecording: false,
  recordingDuration: 0,

  playback: {
    isPlaying: false,
    currentTrack: null,
    duration: 0,
    position: 0
  },

  processing: {
    isProcessing: false,
    progress: 0,
    stage: '',
    eta: null
  },

  modals: {
    savePrompt: false,
    modelSelector: false,
    fileInput: false
  },

  toast: {
    visible: false,
    message: '',
    type: 'info'
  },

  activeTab: 'home'
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleRecording: (state, { payload }) => {
      state.isRecording = payload;
      if (!payload) state.recordingDuration = 0;
    },
    updateRecordingDuration: (state, { payload }) => {
      state.recordingDuration = payload;
    },
    updatePlayback: (state, { payload }) => {
      state.playback = { ...state.playback, ...payload };
    },
    resetPlayback: (state) => {
      state.playback = {
        isPlaying: false,
        currentTrack: null,
        duration: 0,
        position: 0
      };
    },
    updateProcessing: (state, { payload }) => {
      state.processing = { ...state.processing, ...payload };
    },
    clearProcessing: (state) => {
      state.processing = {
        isProcessing: false,
        progress: 0,
        stage: '',
        eta: null
      };
    },
    toggleModal: (state, { payload }) => {
      const { modal, visible } = payload;
      if (state.modals.hasOwnProperty(modal)) {
        state.modals[modal] = visible;
      }
    },
    closeModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key] = false;
      });
    },
    showToastMsg: (state, { payload }) => {
      state.toast = {
        visible: true,
        message: payload.message,
        type: payload.type || 'info'
      };
    },
    hideToastMsg: (state) => {
      state.toast.visible = false;
    },
    changeTab: (state, { payload }) => {
      state.activeTab = payload;
    },
    resetUIState: () => initialState
  }
});

export const {
  toggleRecording,
  updateRecordingDuration,
  updatePlayback,
  resetPlayback,
  updateProcessing,
  clearProcessing,
  toggleModal,
  closeModals,
  showToastMsg,
  hideToastMsg,
  changeTab,
  resetUIState
} = uiSlice.actions;

export default uiSlice.reducer;
