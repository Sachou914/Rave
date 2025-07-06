import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

// Crée un répertoire et récupère un fichier depuis le serveur
export const fetchConvertedAudio = async (baseUrl) => {
  try {
    const targetFolder = FileSystem.documentDirectory + 'converted_files/';
    const folderInfo = await FileSystem.getInfoAsync(targetFolder);
    if (!folderInfo.exists) {
      await FileSystem.makeDirectoryAsync(targetFolder, { intermediates: true });
    }

    const fileUri = targetFolder + 'result.wav';
    const response = await FileSystem.downloadAsync(`${baseUrl}/download`, fileUri);
    return response.uri;
  } catch (err) {
    console.error('Erreur lors du téléchargement :', err.message);
    throw err;
  }
};

// Précharge un fichier audio local depuis les assets
export const preloadAssetAudio = async (assetPath) => {
  try {
    const [asset] = await Asset.loadAsync(assetPath);
    return asset.localUri || asset.uri;
  } catch (err) {
    console.error('Erreur de chargement de l’asset :', err.message);
    throw err;
  }
};

// Envoie un fichier audio vers le serveur
export const uploadAudioFile = async (fileUri, baseUrl) => {
  try {
    const response = await FileSystem.uploadAsync(`${baseUrl}/upload`, fileUri, {
      fieldName: 'file',
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      headers: { filename: 'audio_to_convert.wav' }
    });

    return response.body;
  } catch (err) {
    console.error('Erreur upload :', err.message);
    throw err;
  }
};
