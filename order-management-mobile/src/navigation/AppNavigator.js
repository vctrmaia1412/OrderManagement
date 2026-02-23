import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
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

const RootStack = createNativeStackNavigator();
const ContentStack = createNativeStackNavigator();

const SIDEBAR_BREAKPOINT = 768;

const menuScreens = [
  { key: 'Pedidos', icon: '📋', roles: ['Admin', 'Manager', 'User'] },
  { key: 'Novo', icon: '➕', roles: ['Admin', 'Manager', 'User'] },
  { key: 'Fila', icon: '⏳', roles: ['Admin', 'Manager'] },
  { key: 'Clientes', icon: '👤', roles: ['Admin', 'Manager', 'User'] },
  { key: 'Pagamento', icon: '💳', roles: ['Admin', 'Manager', 'User'] },
  { key: 'Usuarios', icon: '🔐', roles: ['Admin'] },
];

const menuLabelKeys = {
  Pedidos: 'menuMyOrders',
  Novo: 'menuNewOrder',
  Fila: 'menuApprovalQueue',
  Clientes: 'menuCustomers',
  Pagamento: 'menuPaymentConditions',
  Usuarios: 'menuUsers',
};

function ContentNavigator() {
  return (
    <ContentStack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
      <ContentStack.Screen name="Pedidos" component={OrdersScreen} />
      <ContentStack.Screen name="Novo" component={CreateOrderScreen} />
      <ContentStack.Screen name="Fila" component={ApprovalQueueScreen} />
      <ContentStack.Screen name="Clientes" component={CustomersScreen} />
      <ContentStack.Screen name="Pagamento" component={PaymentConditionsScreen} />
      <ContentStack.Screen name="Usuarios" component={UsersScreen} />
      <ContentStack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </ContentStack.Navigator>
  );
}

function SidebarLayout() {
  const { user, logout } = useAuth();
  const { t, locale, changeLanguage, languages } = useI18n();
  const [activeScreen, setActiveScreen] = useState('Pedidos');
  const [pendingCount, setPendingCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { width } = useWindowDimensions();
  const contentNavRef = useRef(null);

  const role = user?.role || 'User';
  const isWideScreen = width >= SIDEBAR_BREAKPOINT;
  const isAdminOrManager = role === 'Admin' || role === 'Manager';

  useEffect(() => {
    if (!isAdminOrManager) return;
    const fetchCount = async () => {
      try {
        const { data } = await orderService.getPending();
        setPendingCount(data.length);
      } catch { /* badge count is non-critical */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, [isAdminOrManager]);

  const visibleItems = menuScreens
    .filter(item => item.roles.includes(role))
    .map(item => ({ ...item, label: t(menuLabelKeys[item.key]) }));

  const handleMenuPress = useCallback((key) => {
    contentNavRef.current?.navigate(key);
    setActiveScreen(key);
    if (!isWideScreen) setDrawerOpen(false);
  }, [isWideScreen]);

  const handleNavStateChange = useCallback((state) => {
    if (!state) return;
    const currentRoute = state.routes[state.index]?.name;
    if (currentRoute && currentRoute !== 'OrderDetail') {
      setActiveScreen(currentRoute);
    }
  }, []);

  const currentLabel = visibleItems.find(i => i.key === activeScreen)?.label || t('menuMyOrders');

  const renderSidebar = () => (
    <View style={[styles.sidebar, !isWideScreen && styles.sidebarMobile]}>
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
            onPress={() => handleMenuPress(item.key)}
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
  );

  return (
    <View style={styles.layout}>
      {!isWideScreen && drawerOpen && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setDrawerOpen(false)}>
          {renderSidebar()}
        </TouchableOpacity>
      )}

      {isWideScreen && renderSidebar()}

      <View style={styles.content}>
        <View style={styles.contentHeader}>
          {!isWideScreen && (
            <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.hamburger}>
              <Text style={styles.hamburgerText}>☰</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.contentTitle}>{currentLabel}</Text>
        </View>
        <View style={styles.contentBody}>
          <NavigationIndependentTree>
            <NavigationContainer ref={contentNavRef} onStateChange={handleNavStateChange}>
              <ContentNavigator />
            </NavigationContainer>
          </NavigationIndependentTree>
        </View>
      </View>
    </View>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Login" component={LoginScreen} />
        ) : (
          <RootStack.Screen name="Home" component={SidebarLayout} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    backgroundColor: '#1e1b4b',
    paddingTop: Platform.OS === 'web' ? 0 : 44,
    justifyContent: 'space-between',
  },
  sidebarMobile: {
    width: 280,
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 101,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  hamburger: {
    marginRight: 16,
  },
  hamburgerText: {
    color: '#fff',
    fontSize: 24,
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
