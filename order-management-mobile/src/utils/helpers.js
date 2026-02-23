import { Alert, Platform } from 'react-native';

export const statusColors = {
  Criado: '#e5e7eb',
  Pago: '#d1fae5',
  Cancelado: '#fee2e2',
};

export const statusTextColors = {
  Criado: '#374151',
  Pago: '#065f46',
  Cancelado: '#991b1b',
};

export function formatCurrency(value, locale = 'pt-BR') {
  return `R$ ${Number(value).toLocaleString(locale, { minimumFractionDigits: 2 })}`;
}

export function formatDate(dateString, locale = 'pt-BR') {
  return new Date(dateString).toLocaleDateString(locale);
}

export function showAlert(title, message) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export function showConfirm(message, { cancelLabel = 'Cancelar', confirmLabel = 'Confirmar' } = {}) {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      resolve(window.confirm(message));
    } else {
      Alert.alert(
        '',
        message,
        [
          { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
          { text: confirmLabel, onPress: () => resolve(true) },
        ],
        { cancelable: false }
      );
    }
  });
}
