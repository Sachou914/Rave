// --- Écran de Configuration Serveur ---
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { testServer, retrieveModels, defineServerDetails, purgeError } from '../store/slices/serverSlice';
import { triggerToast } from '../store/slices/uiSlice';
import apiService from '../services/ApiService';

const DashboardScreen = () => {
  const dispatch = useDispatch();
  const config = useSelector(state => state.server);

  const [ipInput, setIpInput] = useState(config.ip);
  const [portInput, setPortInput] = useState(config.port);

  useEffect(() => {
    if (config.ip && config.port) {
      apiService.setServerConfig(config.ip, config.port);
    }
  }, [config.ip, config.port]);

  useEffect(() => {
    if (config.error) {
      const timer = setTimeout(() => dispatch(purgeError()), 5000);
      return () => clearTimeout(timer);
    }
  }, [config.error]);

  const handleConnection = async () => {
    if (!ipInput.trim() || !portInput.trim()) {
      Alert.alert('Champ requis', 'Merci de fournir une IP et un port.');
      return;
    }

    const validIP = /^\d{1,3}(\.\d{1,3}){3}$/;
    if (!validIP.test(ipInput.trim())) {
      Alert.alert('Format invalide', 'Exemple valide : 192.168.0.10');
      return;
    }

    const parsedPort = parseInt(portInput.trim());
    if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      Alert.alert('Port incorrect', 'Valeur autorisée entre 1 et 65535.');
      return;
    }

    try {
      dispatch(defineServerDetails({ ip: ipInput.trim(), port: portInput.trim() }));
      const outcome = await dispatch(testServer({ ip: ipInput.trim(), port: portInput.trim() }));

      if (testServer.fulfilled.match(outcome)) {
        dispatch(triggerToast({ message: 'Serveur connecté !', type: 'success' }));
        dispatch(retrieveModels());
      } else {
        Alert.alert('Échec de connexion', outcome.payload?.message || 'Erreur inconnue.');
      }
    } catch (err) {
      Alert.alert('Erreur critique', err.message);
    }
  };

  const disconnectHandler = () => {
    Alert.alert('Déconnexion', 'Confirmer la déconnexion du serveur ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: () => {
          dispatch({ type: 'server/disconnect' });
          dispatch(triggerToast({ message: 'Déconnecté', type: 'info' }));
        }
      }
    ]);
  };

  const updateModelList = () => {
    if (config.connected) {
      dispatch(retrieveModels());
      dispatch(triggerToast({ message: 'Mise à jour des modèles...', type: 'info' }));
    }
  };

  return (
    <ScrollView style={s.base} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Ionicons name="server-outline" size={40} color="#00B2FF" style={s.icon} />
        <Text style={s.title}>Connexion au Serveur</Text>
        <Text style={s.desc}>Indiquez l'adresse de votre instance pour démarrer</Text>
      </View>

      <View style={s.section}>
        <Text style={s.label}>Coordonnées du serveur</Text>

        <View style={s.inputBox}>
          <Text style={s.inputLabel}>Adresse IP</Text>
          <TextInput
            style={s.input}
            value={ipInput}
            onChangeText={setIpInput}
            placeholder="192.168.0.10"
            placeholderTextColor="#8E8E93"
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!config.connecting}
          />
        </View>

        <View style={s.inputBox}>
          <Text style={s.inputLabel}>Port</Text>
          <TextInput
            style={s.input}
            value={portInput}
            onChangeText={setPortInput}
            placeholder="8000"
            placeholderTextColor="#8E8E93"
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!config.connecting}
          />
        </View>

        <TouchableOpacity
          style={[s.btn,
            config.connected && s.green,
            config.connecting && s.gray]}
          onPress={config.connected ? disconnectHandler : handleConnection}
          disabled={config.connecting}
        >
          {config.connecting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Ionicons
              name={config.connected ? "checkmark-circle" : "play-circle"}
              size={24}
              color="white"
            />
          )}
          <Text style={s.btnText}>
            {config.connecting ? 'Connexion...' : config.connected ? 'Se déconnecter' : 'Connexion'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={s.status}>
        <View style={[s.statusBox, config.connected ? s.online : s.offline]}>
          <Ionicons
            name={config.connected ? "wifi" : "wifi-outline"}
            size={24}
            color={config.connected ? "#28CD41" : "#8E8E93"}
          />
          <Text style={[s.statusText, config.connected ? s.txtOn : s.txtOff]}>
            {config.connected ? 'Connecté' : 'Déconnecté'}
          </Text>
        </View>

        {config.connected && config.serverInfo && (
          <View style={s.infoBox}>
            <Text style={s.infoTitle}>Détails du serveur</Text>
            <Text style={s.infoLine}>Version : {config.serverInfo.version || 'N/A'}</Text>
            <Text style={s.infoLine}>Dernier test : {new Date(config.lastConnectionAttempt).toLocaleTimeString()}</Text>
          </View>
        )}
      </View>

      {config.connected && (
        <View style={s.modelWrap}>
          <View style={s.modelHeader}>
            <Text style={s.label}>Modèles RAVE disponibles</Text>
            <TouchableOpacity onPress={updateModelList}>
              <Ionicons name="refresh" size={20} color="#00B2FF" />
            </TouchableOpacity>
          </View>

          {config.availableModels.length > 0 ? (
            <View style={s.modelList}>
              {config.availableModels.map((model, idx) => (
                <View key={idx} style={s.modelItem}>
                  <Ionicons name="musical-note" size={16} color="#28CD41" />
                  <Text style={s.modelName}>{model}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={s.empty}>Aucun modèle détecté</Text>
          )}
        </View>
      )}

      {config.error && (
        <View style={s.errorBox}>
          <Ionicons name="warning" size={20} color="#FF3B30" />
          <Text style={s.error}>{config.error}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  base: { flex: 1, backgroundColor: '#000' },
  content: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  icon: { marginBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  desc: { fontSize: 16, color: '#8E8E93', textAlign: 'center', lineHeight: 22 },
  section: { marginBottom: 25 },
  label: { fontSize: 18, fontWeight: '600', color: '#FFF', marginBottom: 15 },
  inputBox: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#8E8E93', marginBottom: 8 },
  input: { backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#38383A', borderRadius: 10, padding: 15, fontSize: 16, color: '#FFF' },
  btn: { backgroundColor: '#00B2FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 10, marginTop: 10 },
  green: { backgroundColor: '#28CD41' },
  gray: { backgroundColor: '#8E8E93' },
  btnText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  status: { marginBottom: 25 },
  statusBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 10, borderWidth: 1 },
  online: { backgroundColor: '#1E2E1E', borderColor: '#28CD41' },
  offline: { backgroundColor: '#1C1C1E', borderColor: '#38383A' },
  statusText: { fontSize: 16, fontWeight: '500', marginLeft: 12 },
  txtOn: { color: '#28CD41' },
  txtOff: { color: '#8E8E93' },
  infoBox: { marginTop: 15, padding: 15, backgroundColor: '#1C1C1E', borderRadius: 10 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#FFF', marginBottom: 8 },
  infoLine: { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  modelWrap: { marginBottom: 25 },
  modelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modelList: { backgroundColor: '#1C1C1E', borderRadius: 10, padding: 15 },
  modelItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  modelName: { fontSize: 14, color: '#FFF', marginLeft: 10 },
  empty: { fontSize: 14, color: '#8E8E93', textAlign: 'center', fontStyle: 'italic' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3A1F1F', borderColor: '#FF3B30', borderWidth: 1, borderRadius: 10, padding: 15, marginBottom: 20 },
  error: { fontSize: 14, color: '#FF3B30', marginLeft: 10, flex: 1 },
});

export default DashboardScreen;