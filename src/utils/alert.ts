import { Alert, Platform } from 'react-native';

export function confirmDelete(message: string, onConfirm: () => void): void {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onConfirm();
  } else {
    Alert.alert('Remover', message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

export function showError(title: string, message: string): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}
