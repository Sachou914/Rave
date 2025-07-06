# RAVE Audio Transformer App

Application mobile **React Native** permettant d’enregistrer un son, le transformer avec un modèle **RAVE** hébergé sur un serveur local, puis écouter le résultat.

## ✨ Fonctionnalités principales

* Enregistrement audio via le micro du téléphone  
* Connexion à un serveur local (IP + port)  
* Sélection et chargement d’un modèle RAVE  
* Upload du fichier, traitement sur le serveur, téléchargement du fichier transformé  
* Lecture des fichiers audio (original et transformé)  
* Sauvegarde des enregistrements avec métadonnées  

## 🛠️ Technologies utilisées

* **React Native** (Expo)  
* **Redux Toolkit**  
* `expo-av` pour la gestion de l’audio  
* `expo-file-system` pour la gestion des fichiers  
* `fetch` / `FileSystem.uploadAsync` pour communiquer avec l’API locale  

## 🚀 Utilisation

1. Lancer votre serveur RAVE en local  
2. Ouvrir l’application sur le téléphone  
3. Renseigner l’IP et le port du serveur dans l’écran **"Serveur Audio"**  
4. Enregistrer un son via l’écran **"Enregistrement"**  
5. Choisir un modèle RAVE  
6. Lancer la transformation et écouter le résultat  

## 📁 Organisation du code

* `src/screens/` : écrans principaux (connexion, enregistrement, lecture…)  
* `src/services/` : gestion API, audio, fichiers  
* `src/store/` : configuration Redux  
