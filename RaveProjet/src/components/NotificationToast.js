import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { dismissToast } from '../store/slices/uiSlice';

const { width: screenW } = Dimensions.get('window');

const NotificationToast = () => {
  const dispatch = useDispatch();
  const { toast } = useSelector(state => state.ui);

  const slideY = useRef(new Animated.Value(-120)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast.visible) {
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const hideTimer = setTimeout(() => {
        closeToast();
      }, 3000);

      return () => clearTimeout(hideTimer);
    } else {
      closeToast();
    }
  }, [toast.visible]);

  const closeToast = () => {
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dispatch(dismissToast());
    });
  };

  const resolveStyle = (category) => {
    switch (category) {
      case 'success':
        return {
          bgColor: '#1E3B1E',
          border: '#28CD41',
          icon: 'checkmark-circle',
          iconShade: '#28CD41'
        };
      case 'error':
        return {
          bgColor: '#3B1E1E',
          border: '#FF453A',
          icon: 'close-circle',
          iconShade: '#FF453A'
        };
      case 'warning':
        return {
          bgColor: '#3B2F1E',
          border: '#FF9F0A',
          icon: 'warning',
          iconShade: '#FF9F0A'
        };
      default:
        return {
          bgColor: '#1E2B3B',
          border: '#00B2FF',
          icon: 'information-circle',
          iconShade: '#00B2FF'
        };
    }
  };

  if (!toast.visible) return null;

  const toastStyle = resolveStyle(toast.type);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideY }],
          opacity: fade,
        }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.toastBox,
          {
            backgroundColor: toastStyle.bgColor,
            borderColor: toastStyle.border,
          }
        ]}
        onPress={closeToast}
        activeOpacity={0.9}
      >
        <Ionicons
          name={toastStyle.icon}
          size={20}
          color={toastStyle.iconShade}
        />
        <Text style={styles.toastText} numberOfLines={2}>
          {toast.message}
        </Text>
        <TouchableOpacity style={styles.dismissIcon} onPress={closeToast}>
          <Ionicons name="close" size={16} color="#888" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 9999,
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 10,
  },
  dismissIcon: {
    padding: 4,
  },
});

export default NotificationToast;