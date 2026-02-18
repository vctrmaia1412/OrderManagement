import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../i18n/translations';

const I18nContext = createContext(null);

const STORAGE_KEY = 'app_language';
const AVAILABLE_LANGUAGES = [
  { code: 'pt-BR', label: '🇧🇷 Português' },
  { code: 'en-US', label: '🇺🇸 English' },
  { code: 'es-ES', label: '🇪🇸 Español' },
];

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState('pt-BR');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved && translations[saved]) setLocale(saved);
      setReady(true);
    });
  }, []);

  const changeLanguage = async (code) => {
    setLocale(code);
    await AsyncStorage.setItem(STORAGE_KEY, code);
  };

  const t = (key) => translations[locale]?.[key] || translations['pt-BR']?.[key] || key;

  const statusLabel = (status) => {
    const map = {
      Criado: t('statusCriado'),
      AguardandoAprovacao: t('statusAguardandoAprovacao'),
      Aprovado: t('statusAprovado'),
      Processando: t('statusProcessando'),
      Pago: t('statusPago'),
      Cancelado: t('statusCancelado'),
    };
    return map[status] || status;
  };

  if (!ready) return null;

  return (
    <I18nContext.Provider value={{ locale, changeLanguage, t, statusLabel, languages: AVAILABLE_LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
