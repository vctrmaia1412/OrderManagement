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

const Stack = createNativeStackNavigator();

const screens = {
  Pedidos: OrdersScreen,
  Novo: CreateOrderScreen,
  Fila: ApprovalQueueScreen,
  Clientes: CustomersScreen,
  Pagamento: PaymentConditionsScreen,
};

function SidebarLayout({ navigation }) {
  const { user, isAdmin, logout } = useAuth();
  const { t, locale, changeLanguage, languages } = useI18n();
  const [activeScreen, setActiveScreen] = useState('Pedidos');
  const [pendingCount, setPendingCount] = useState(0);
  const role = user?.role || 'User';

  const menuItems = [
    { key: 'Pedidos', label: t('menuMyOrders'), icon: '📋', roles: ['Admin', 'User'] },
    { key: 'Novo', label: t('menuNewOrder'), icon: '➕', roles: ['Admin', 'User'] },
    { key: 'Fila', label: t('menuApprovalQueue'), icon: '⏳', roles: ['Admin'] },
    { key: 'Clientes', label: t('menuCustomers'), icon: '👤', roles: ['Admin', 'User'] },
    { key: 'Pagamento', label: t('menuPaymentConditions'), icon: '💳', roles: ['Admin', 'User'] },
  ];

  useEffect(() => {
    if (!isAdmin) return;
    const fetchCount = async () => {
      try {
        const { data } = await orderService.getPending();
        setPendingCount(data.length);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, [isAdmin, activeScreen]);

  const visibleItems = menuItems.filter(item => item.roles.includes(role));
  const ActiveComponent = screens[activeScreen] || OrdersScreen;

  return (
    <View style={styles.layout}>
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.appTitle}>{t('appTitle')}</Text>
          <Text style={styles.userName}>{user?.fullName || user?.username}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{isAdmin ? t('administrator') : t('user')}</Text>
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
          <View style={styles.langSection}>
            <Text style={styles.langTitle}>🌐 {t('language')}</Text>
            <View style={styles.langRow}>
              {languages.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langBtn, locale === lang.code && styles.langBtnActive]}
                  onPress={() => changeLanguage(lang.code)}
                >
                  <Text style={[styles.langText, locale === lang.code && styles.langTextActive]}>
                    {lang.label.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
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
  langSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  langTitle: {
    color: '#a5b4fc',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  langRow: {
    flexDirection: 'row',
    gap: 6,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4338ca',
  },
  langBtnActive: {
    backgroundColor: '#4338ca',
  },
  langText: {
    fontSize: 14,
    color: '#a5b4fc',
  },
  langTextActive: {
    color: '#fff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 12,
  },
  logoutIcon: {
    fontSize: 16,
    marginRight: 12,
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
