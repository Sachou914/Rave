import * as FileSystem from 'expo-file-system';

class ApiService {
  constructor() {
    this.baseUrl = null;
    this.timeout = 10000; // 10 secondes par défaut
  }
  
  /**
   * Configure l'URL du serveur
   */
  setServerConfig(ip, port) {
    this.baseUrl = `http://${ip}:${port}`;
  }
  

  async makeRequest(endpoint, options = {}) {
    if (!this.baseUrl) {
      throw new Error('Configuration serveur manquante');
    }
    
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    
    // Timeout
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      // Tente de parser en JSON, sinon retourne le texte
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Timeout - Serveur trop lent');
      }
      
      throw error;
    }
  }
  
  /**
   * Test de connexion au serveur
   */
  async testConnection() {
    try {
      const data = await this.makeRequest('/');
      return { 
        success: true, 
        data,
        message: 'Connexion réussie !'
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        message: `Connexion échouée: ${error.message}`
      };
    }
  }
  
  /**
   * Récupère la liste des modèles disponibles
   */
  async getModels() {
    try {
      const data = await this.makeRequest('/getmodels');
      
      const models = Array.isArray(data) ? data : (data.models || []);
      
      return { 
        success: true, 
        models,
        message: `${models.length} modèles disponibles`
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        models: []
      };
    }
  }
  

  /**
   * Upload et transformation
   */
  async transformAudio(audioUri, modelName, onProgress = null) {
    try {
      if (!audioUri || !modelName) {
        throw new Error('URI audio et nom du modèle requis');
      }
      
      // Vérifie que le fichier existe
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Fichier audio introuvable');
      }
      
      console.log('Fichier à envoyer:', audioUri);
      console.log('Info fichier:', fileInfo);
      
      const selectResponse = await this.makeRequest(`/selectModel/${modelName}`);
      console.log('Modèle sélectionné:', selectResponse);
      
      if (onProgress) {
        onProgress({ stage: 'uploading', progress: 0 });
      }
      
      const uploadResult = await FileSystem.uploadAsync(
        `${this.baseUrl}/upload`,
        audioUri,
        {
          fieldName: 'file',
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          headers: { 
            filename: 'received_audio.m4a'  
          }
        }
      );
      
      console.log('Status upload:', uploadResult.status);
      console.log('Response body:', uploadResult.body);
      
      if (uploadResult.status !== 200) {
        throw new Error(`Upload failed: ${uploadResult.status} - ${uploadResult.body}`);
      }
      
      if (!uploadResult.body.includes('Computation done')) {
        throw new Error(`Erreur serveur: ${uploadResult.body}`);
      }
      
      // Callback progress pour processing
      if (onProgress) {
        onProgress({ stage: 'processing', progress: 50 });
      }
      
      // Télécharge le fichier transformé
      const downloadUrl = `${this.baseUrl}/download`;
      const downloadUri = `${FileSystem.documentDirectory}transformed_${Date.now()}.wav`;
      
      if (onProgress) {
        onProgress({ stage: 'downloading', progress: 75 });
      }
      
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, downloadUri);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed: ${downloadResult.status}`);
      }
      
      if (onProgress) {
        onProgress({ stage: 'completed', progress: 100 });
      }
      
      return {
        success: true,
        transformedUri: downloadResult.uri,
        originalModel: modelName,
        message: 'Transformation réussie !'
      };
      
    } catch (error) {
      console.error('Erreur transformation audio:', error);
      return {
        success: false,
        error: error.message,
        message: `Transformation échouée: ${error.message}`
      };
    }
  }
  
  /**
   * Télécharge un fichier depuis le serveur
   */
  async downloadFile(fileId, localPath = null) {
    try {
      const downloadUrl = `${this.baseUrl}/download/${fileId}`;
      const finalPath = localPath || `${FileSystem.documentDirectory}download_${Date.now()}.wav`;
      
      const result = await FileSystem.downloadAsync(downloadUrl, finalPath);
      
      if (result.status !== 200) {
        throw new Error(`Download failed: ${result.status}`);
      }
      
      return {
        success: true,
        uri: result.uri,
        message: 'Téléchargement réussi'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Téléchargement échoué: ${error.message}`
      };
    }
  }
  
  /**
   * Supprime un fichier temporaire du serveur
   */
  async cleanupServerFile(fileId) {
    try {
      await this.makeRequest(`/cleanup/${fileId}`, {
        method: 'DELETE'
      });
      
      return { success: true };
    } catch (error) {
      console.warn('Cleanup serveur échoué:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Obtient les informations sur le serveur
   */
  async getServerInfo() {
    try {
      const data = await this.makeRequest('/info');
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Vérifie le statut d'une tâche de transformation
   */
  async getTaskStatus(taskId) {
    try {
      const data = await this.makeRequest(`/status/${taskId}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Instance singleton
const apiService = new ApiService();
export default apiService;