import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { I18nProvider } from './src/context/I18nContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <StatusBar style="light" backgroundColor="#4338ca" />
        <AppNavigator />
      </AuthProvider>
    </I18nProvider>
  );
}
