import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { orderService } from '../services/api';

import LoginScreen from '../screens/LoginScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import CreateOrderScreen from '../screens/CreateOrderScreen';
import CustomersScreen from '../screens/CustomersScreen';
import PaymentConditionsScreen from '../screens/PaymentConditionsScreen';
import ApprovalQueueScreen from '../screens/ApprovalQueueScreen';
import UsersScreen from '../screens/UsersScreen';

const Stack = createNativeStackNavigator();

const screens = {
  Pedidos: OrdersScreen,
  Novo: CreateOrderScreen,
  Fila: ApprovalQueueScreen,
  Clientes: CustomersScreen,
  Pagamento: PaymentConditionsScreen,
  Usuarios: UsersScreen,
};

function SidebarLayout({ navigation }) {
  const { user, isAdmin, logout } = useAuth();
  const { t, locale, changeLanguage, languages } = useI18n();
  const [activeScreen, setActiveScreen] = useState('Pedidos');
  const [pendingCount, setPendingCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const role = user?.role || 'User';

  const isAdminOrManager = role === 'Admin' || role === 'Manager';

  const menuItems = [
    { key: 'Pedidos', label: t('menuMyOrders'), icon: '📋', roles: ['Admin', 'Manager', 'User'] },
    { key: 'Novo', label: t('menuNewOrder'), icon: '➕', roles: ['Admin', 'Manager', 'User'] },
    { key: 'Fila', label: t('menuApprovalQueue'), icon: '⏳', roles: ['Admin', 'Manager'] },
    { key: 'Clientes', label: t('menuCustomers'), icon: '👤', roles: ['Admin', 'Manager', 'User'] },
    { key: 'Pagamento', label: t('menuPaymentConditions'), icon: '💳', roles: ['Admin', 'Manager', 'User'] },
    { key: 'Usuarios', label: t('menuUsers'), icon: '🔐', roles: ['Admin'] },
  ];

  useEffect(() => {
    if (!isAdminOrManager) return;
    const fetchCount = async () => {
      try {
        const { data } = await orderService.getPending();
        setPendingCount(data.length);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, [isAdminOrManager, activeScreen]);

  const visibleItems = menuItems.filter(item => item.roles.includes(role));
  const ActiveComponent = screens[activeScreen] || OrdersScreen;

  return (
    <View style={styles.layout}>
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.appTitle}>{t('appTitle')}</Text>
          <Text style={styles.userName}>{user?.fullName || user?.username}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{role === 'Admin' ? t('administrator') : role === 'Manager' ? t('manager') : t('user')}</Text>
          </View>
        </View>

        <View style={styles.menuList}>
          {visibleItems.map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.menuItem, activeScreen === item.key && styles.menuItemActive]}
              onPress={() => setActiveScreen(item.key)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={[styles.menuLabel, activeScreen === item.key && styles.menuLabelActive]}>
                {item.label}
              </Text>
              {item.key === 'Fila' && pendingCount > 0 && (
                <View style={styles.menuBadge}><Text style={styles.menuBadgeText}>{pendingCount}</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sidebarFooter}>
          <TouchableOpacity style={styles.settingsToggle} onPress={() => setSettingsOpen(!settingsOpen)}>
            <Text style={styles.settingsIcon}>⚙️</Text>
            <Text style={styles.settingsLabel}>{t('settings')}</Text>
            <Text style={styles.settingsArrow}>{settingsOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {settingsOpen && (
            <View style={styles.settingsPanel}>
              <View style={styles.settingsItem}>
                <Text style={styles.settingsItemIcon}>👤</Text>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemLabel}>{t('profile')}</Text>
                  <Text style={styles.settingsItemValue}>{user?.fullName || user?.username}</Text>
                  <Text style={styles.settingsItemSub}>{role === 'Admin' ? t('administrator') : role === 'Manager' ? t('manager') : t('user')}</Text>
                </View>
              </View>

              <View style={styles.settingsItem}>
                <Text style={styles.settingsItemIcon}>🌐</Text>
                <View style={styles.settingsItemContent}>
                  <Text style={styles.settingsItemLabel}>{t('language')}</Text>
                  <View style={styles.langRow}>
                    {languages.map(lang => (
                      <TouchableOpacity
                        key={lang.code}
                        style={[styles.langBtn, locale === lang.code && styles.langBtnActive]}
                        onPress={() => changeLanguage(lang.code)}
                      >
                        <Text style={[styles.langText, locale === lang.code && styles.langTextActive]}>
                          {lang.short}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                <Text style={styles.logoutIcon}>🚪</Text>
                <Text style={styles.logoutText}>{t('logout')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle}>
            {visibleItems.find(i => i.key === activeScreen)?.label || t('menuMyOrders')}
          </Text>
        </View>
        <View style={styles.contentBody}>
          <ActiveComponent navigation={{
            navigate: (screen, params) => {
              if (screen === 'OrderDetail') {
                navigation.navigate('OrderDetail', params);
              } else if (screens[screen]) {
                setActiveScreen(screen);
              }
            },
            goBack: () => setActiveScreen('Pedidos'),
          }} />
        </View>
      </View>
    </View>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useI18n();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#4338ca' }, headerTintColor: '#fff' }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Home" component={SidebarLayout} options={{ headerShown: false }} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: `${t('orderTitle')}` }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
  },
  sidebar: {
    width: 260,
    backgroundColor: '#1e1b4b',
    paddingTop: Platform.OS === 'web' ? 0 : 44,
    justifyContent: 'space-between',
  },
  sidebarHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#312e81',
  },
  appTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userName: {
    color: '#c7d2fe',
    fontSize: 14,
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: '#4338ca',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#e0e7ff',
    fontSize: 11,
    fontWeight: '600',
  },
  menuList: {
    flex: 1,
    paddingTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 24,
    marginHorizontal: 8,
    borderRadius: 10,
    marginBottom: 2,
  },
  menuItemActive: {
    backgroundColor: '#4338ca',
  },
  menuIcon: {
    fontSize: 16,
    marginRight: 14,
  },
  menuLabel: {
    color: '#a5b4fc',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  menuLabelActive: {
    color: '#fff',
    fontWeight: '700',
  },
  menuBadge: {
    backgroundColor: '#f59e0b',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#312e81',
  },
  settingsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    cursor: 'pointer',
  },
  settingsIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  settingsLabel: {
    color: '#a5b4fc',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  settingsArrow: {
    color: '#6366f1',
    fontSize: 10,
  },
  settingsPanel: {
    backgroundColor: '#252262',
    marginHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#312e81',
  },
  settingsItemIcon: {
    fontSize: 14,
    marginRight: 10,
    marginTop: 2,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemLabel: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  settingsItemValue: {
    color: '#e0e7ff',
    fontSize: 14,
    fontWeight: '500',
  },
  settingsItemSub: {
    color: '#818cf8',
    fontSize: 11,
    marginTop: 2,
  },
  langRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4338ca',
  },
  langBtnActive: {
    backgroundColor: '#4338ca',
  },
  langText: {
    fontSize: 13,
    color: '#a5b4fc',
    fontWeight: '500',
  },
  langTextActive: {
    color: '#fff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  logoutIcon: {
    fontSize: 14,
    marginRight: 10,
  },
  logoutText: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  contentHeader: {
    backgroundColor: '#4338ca',
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  contentTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contentBody: {
    flex: 1,
  },
});
