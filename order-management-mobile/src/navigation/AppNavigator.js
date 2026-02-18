import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import CreateOrderScreen from '../screens/CreateOrderScreen';
import CustomersScreen from '../screens/CustomersScreen';
import PaymentConditionsScreen from '../screens/PaymentConditionsScreen';
import ApprovalQueueScreen from '../screens/ApprovalQueueScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }) {
  const icons = { Pedidos: '📋', Novo: '➕', Clientes: '👤', Pagamento: '💳', Fila: '⏳' };
  return <Text style={{ fontSize: focused ? 18 : 14 }}>{icons[label] || '📄'}</Text>;
}

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <TouchableOpacity onPress={logout} style={{ marginRight: 14 }}>
      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Sair</Text>
    </TouchableOpacity>
  );
}

function HomeTabs() {
  const { user, isAdmin } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#4338ca' },
        headerTintColor: '#fff',
        headerTitle: `Olá, ${user?.fullName || user?.username}`,
        headerRight: () => <LogoutButton />,
        tabBarActiveTintColor: '#4338ca',
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Pedidos" component={OrdersScreen} />
      <Tab.Screen name="Novo" component={CreateOrderScreen} options={{ title: 'Novo Pedido' }} />
      {isAdmin && (
        <Tab.Screen name="Fila" component={ApprovalQueueScreen} options={{ title: 'Fila Aprovação' }} />
      )}
      <Tab.Screen name="Clientes" component={CustomersScreen} />
      <Tab.Screen name="Pagamento" component={PaymentConditionsScreen} options={{ title: 'Cond. Pgto' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  // Renderização condicional: se não autenticado, mostra apenas Login; caso contrário, mostra as tabs protegidas
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#4338ca' }, headerTintColor: '#fff' }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Detalhes do Pedido' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
