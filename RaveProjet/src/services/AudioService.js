import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

class AudioService {
  constructor() {
    this.recording = null;
    this.sound = null;

  }
  
  /**
   * Initialise l'audio (permissions, mode audio)
   */
  async initialize() {
    try {
      // Configure le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      
      // Demande les permissions
      const { granted } = await Audio.requestPermissionsAsync();
      
      if (!granted) {
        throw new Error('Permission audio refusée');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erreur initialisation audio:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Démarre l'enregistrement
   */
 async startRecording() {
  try {
    await this.stopSound();
    
    // Demande les permissions d'abord
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      throw new Error('Permission audio refusée');
    }
    
    this.recording = new Audio.Recording();
    await this.recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await this.recording.startAsync();
    
    return { success: true };
  } catch (error) {
    console.error('Erreur démarrage enregistrement:', error);
    return { success: false, error: error.message };
  }
}
  
  /**
   * Arrête l'enregistrement
   */
  async stopRecording() {
    try {
      if (!this.recording) {
        throw new Error('Aucun enregistrement en cours');
      }
      
      await this.recording.stopAndUnloadAsync();
      const status = await this.recording.getStatusAsync();
      const uri = this.recording.getURI();
      
      
      // Reset
      this.recording = null;
      
      return { 
        success: true, 
        uri,
        duration: status.durationMillis || 0
      };
    } catch (error) {
      console.error('Erreur arrêt enregistrement:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Joue un fichier audio
   */
  async playSound(uri, onStatusUpdate = null) {
    try {
      // Arrête le son actuel
      await this.stopSound();
      
      // Charge et joue le nouveau son
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: false },
        onStatusUpdate
      );
      
      this.sound = sound;
      return { success: true, sound };
    } catch (error) {
      console.error('Erreur lecture audio:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Met en pause/reprend la lecture
   */
  async togglePlayback() {
    try {
      if (!this.sound) {
        throw new Error('Aucun son chargé');
      }
      
      const status = await this.sound.getStatusAsync();
      
      if (status.isLoaded) {
        if (status.isPlaying) {
          await this.sound.pauseAsync();
        } else {
          await this.sound.playAsync();
        }
        return { success: true, isPlaying: !status.isPlaying };
      }
      
      throw new Error('Son non chargé');
    } catch (error) {
      console.error('Erreur toggle playback:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Arrête la lecture
   */
  async stopSound() {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }
      return { success: true };
    } catch (error) {
      console.error('Erreur arrêt son:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Sauvegarde un enregistrement avec métadonnées
   */

  async saveRecording(tempUri, name, duration = 0) {
  try {
    if (!tempUri || !name) {
      throw new Error('URI et nom requis');
    }
    
    // Crée le dossier recordings si nécessaire
    const recordingsDir = `${FileSystem.documentDirectory}recordings/`;
    const dirInfo = await FileSystem.getInfoAsync(recordingsDir);
    
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
    }
    
    // Génère un nom de fichier unique 
    const timestamp = Date.now();
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}.m4a`;
    const finalUri = `${recordingsDir}${fileName}`;
    
    await FileSystem.moveAsync({
      from: tempUri,
      to: finalUri
    });
    
    // Sauvegarde les métadonnées
    const metadata = {
      id: timestamp.toString(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      duration,
      fileName
    };
    
    const metadataUri = `${finalUri}.json`;
    await FileSystem.writeAsStringAsync(metadataUri, JSON.stringify(metadata));
    
    return { 
      success: true, 
      uri: finalUri,
      metadata 
    };
  } catch (error) {
    console.error('Erreur sauvegarde enregistrement:', error);
    return { success: false, error: error.message };
  }
}
  
  /**
   * Obtient la durée d'un fichier audio
   */
  async getAudioDuration(uri) {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();
      
      return {
        success: true,
        duration: status.durationMillis || 0
      };
    } catch (error) {
      console.error('Erreur obtention durée:', error);
      return { success: false, error: error.message, duration: 0 };
    }
  }
  
  /**
   * Nettoie les ressources audio
   */
  async cleanup() {
    try {
      await this.stopSound();
      
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erreur cleanup audio:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Vérifie si un enregistrement est en cours
   */
  isRecording() {
    return this.recording !== null;
  }
  
  /**
   * Vérifie si un son est en cours de lecture
   */
  isPlaying() {
    return this.sound !== null;
  }
}

// Instance singleton
const audioService = new AudioService();
export default audioService;