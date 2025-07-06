import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { testServer, retrieveModels, defineServerDetails, purgeError } from '../store/slices/serverSlice';
import { triggerToast } from '../store/slices/uiSlice';
import apiService from '../services/ApiService';

const RaveScreen = () => {
  const dispatch = useDispatch();
  const config = useSelector(state => state.server);
  const [ip, setIp] = useState(config.ip);
  const [port, setPort] = useState(config.port);

  useEffect(() => {
    if (config.ip && config.port) apiService.setServerConfig(config.ip, config.port);
  }, [config.ip, config.port]);

  useEffect(() => {
    if (config.error) {
      const timer = setTimeout(() => dispatch(purgeError()), 5000);
      return () => clearTimeout(timer);
    }
  }, [config.error]);

  const connectToServer = async () => {
    if (!ip.trim() || !port.trim()) return Alert.alert('Champs manquants', 'Veuillez indiquer une IP et un port.');
    const ipFormat = /^\d{1,3}(\.\d{1,3}){3}$/;
    if (!ipFormat.test(ip.trim())) return Alert.alert('IP invalide', 'Format attendu : 192.168.0.10');

    const numericPort = parseInt(port.trim());
    if (isNaN(numericPort) || numericPort < 1 || numericPort > 65535) return Alert.alert('Port invalide', 'Valeur autorisée : 1 à 65535.');

    try {
      dispatch(defineServerDetails({ ip: ip.trim(), port: port.trim() }));
      const response = await dispatch(testServer({ ip: ip.trim(), port: port.trim() }));
      if (testServer.fulfilled.match(response)) {
        dispatch(triggerToast({ message: 'Connecté au serveur !', type: 'success' }));
        dispatch(retrieveModels());
      } else {
        Alert.alert('Connexion échouée', response.payload?.message || 'Erreur inconnue.');
      }
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  const disconnect = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'OK', style: 'destructive', onPress: () => {
          dispatch({ type: 'server/disconnect' });
          dispatch(triggerToast({ message: 'Déconnecté.', type: 'info' }));
        }
      }
    ]);
  };

  const refreshModels = () => {
    if (config.connected) {
      dispatch(retrieveModels());
      dispatch(triggerToast({ message: 'Chargement des modèles...', type: 'info' }));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.header}>
        <Ionicons name="server-outline" size={40} color="#00B2FF" style={styles.icon} />
        <Text style={styles.title}>Serveur Audio</Text>
        <Text style={styles.subtitle}>Renseignez votre IP locale pour activer la conversion</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.sectionTitle}>Adresse du serveur</Text>

        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>IP</Text>
          <TextInput
            style={styles.input}
            value={ip}
            onChangeText={setIp}
            placeholder="192.168.0.10"
            placeholderTextColor="#8E8E93"
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!config.connecting}
          />
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Port</Text>
          <TextInput
            style={styles.input}
            value={port}
            onChangeText={setPort}
            placeholder="8000"
            placeholderTextColor="#8E8E93"
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!config.connecting}
          />
        </View>

        <TouchableOpacity
          style={[styles.button,
            config.connected && styles.connected,
            config.connecting && styles.disabled]}
          onPress={config.connected ? disconnect : connectToServer}
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
          <Text style={styles.buttonText}>
            {config.connecting ? 'Connexion...' : config.connected ? 'Déconnexion' : 'Connexion'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.block}>
        <View style={[styles.statusBox, config.connected ? styles.online : styles.offline]}>
          <Ionicons
            name={config.connected ? "wifi" : "wifi-outline"}
            size={24}
            color={config.connected ? "#28CD41" : "#8E8E93"}
          />
          <Text style={[styles.statusText, config.connected ? styles.txtOn : styles.txtOff]}>
            {config.connected ? 'Connecté' : 'Non connecté'}
          </Text>
        </View>

        {config.connected && config.serverInfo && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Serveur</Text>
            <Text style={styles.infoLine}>Version : {config.serverInfo.version || 'N/A'}</Text>
            <Text style={styles.infoLine}>Testé à : {new Date(config.lastConnectionAttempt).toLocaleTimeString()}</Text>
          </View>
        )}
      </View>

      {config.connected && (
        <View style={styles.block}>
          <View style={styles.modelHeader}>
            <Text style={styles.sectionTitle}>Modèles RAVE</Text>
            <TouchableOpacity onPress={refreshModels}>
              <Ionicons name="refresh" size={20} color="#00B2FF" />
            </TouchableOpacity>
          </View>

          {config.availableModels.length > 0 ? (
            <View style={styles.modelList}>
              {config.availableModels.map((model, i) => (
                <View key={i} style={styles.modelItem}>
                  <Ionicons name="musical-note" size={16} color="#28CD41" />
                  <Text style={styles.modelText}>{model}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Aucun modèle disponible</Text>
          )}
        </View>
      )}

      {config.error && (
        <View style={styles.errorBox}>
          <Ionicons name="warning" size={20} color="#FF3B30" />
          <Text style={styles.errorText}>{config.error}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  inner: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  icon: { marginBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8E8E93', textAlign: 'center', lineHeight: 22 },
  block: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#FFF', marginBottom: 15 },
  inputWrap: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#8E8E93', marginBottom: 8 },
  input: { backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#38383A', borderRadius: 10, padding: 15, fontSize: 16, color: '#FFF' },
  button: { backgroundColor: '#00B2FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 10, marginTop: 10 },
  connected: { backgroundColor: '#28CD41' },
  disabled: { backgroundColor: '#8E8E93' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  statusBox: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 10, borderWidth: 1 },
  online: { backgroundColor: '#1E2E1E', borderColor: '#28CD41' },
  offline: { backgroundColor: '#1C1C1E', borderColor: '#38383A' },
  statusText: { fontSize: 16, fontWeight: '500', marginLeft: 12 },
  txtOn: { color: '#28CD41' },
  txtOff: { color: '#8E8E93' },
  infoBox: { marginTop: 15, padding: 15, backgroundColor: '#1C1C1E', borderRadius: 10 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#FFF', marginBottom: 8 },
  infoLine: { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  modelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modelList: { backgroundColor: '#1C1C1E', borderRadius: 10, padding: 15 },
  modelItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  modelText: { fontSize: 14, color: '#FFF', marginLeft: 10 },
  emptyText: { fontSize: 14, color: '#8E8E93', textAlign: 'center', fontStyle: 'italic' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3A1F1F', borderColor: '#FF3B30', borderWidth: 1, borderRadius: 10, padding: 15, marginBottom: 20 },
  errorText: { fontSize: 14, color: '#FF3B30', marginLeft: 10, flex: 1 },
});

export default RaveScreen;
