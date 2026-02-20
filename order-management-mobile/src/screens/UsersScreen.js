import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { userService } from '../services/api';
import { useI18n } from '../context/I18nContext';

const roleBadgeColors = { Admin: '#dc2626', Manager: '#d97706', User: '#2563eb' };

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '', role: 'User' });
  const [newPassword, setNewPassword] = useState('');
  const [changingPwdFor, setChangingPwdFor] = useState(null);
  const { t } = useI18n();

  const fetchUsers = async () => { try { const { data } = await userService.getAll(); setUsers(data); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetchUsers(); }, []);

  const showError = (msg) => { if (Platform.OS === 'web') window.alert(msg); };
  const showSuccess = (msg) => { if (Platform.OS === 'web') window.alert(msg); };

  const resetForm = () => {
    setForm({ username: '', password: '', fullName: '', email: '', role: 'User' });
    setEditingUser(null);
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!form.username || !form.password || !form.fullName || !form.email) { showError(t('fillAllFields')); return; }
    try {
      setSubmitting(true);
      await userService.create(form);
      resetForm();
      fetchUsers();
    } catch (e) { showError(e.response?.data?.message || t('createError')); } finally { setSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!form.fullName || !form.email) { showError(t('fillAllFields')); return; }
    try {
      setSubmitting(true);
      await userService.update(editingUser.userId, { fullName: form.fullName, email: form.email, role: form.role, isActive: editingUser.isActive });
      resetForm();
      fetchUsers();
    } catch (e) { showError(e.response?.data?.message || t('createError')); } finally { setSubmitting(false); }
  };

  const handleToggleActive = async (user) => {
    if (Platform.OS === 'web' && !window.confirm(`${user.isActive ? t('usersDeactivate') : t('usersActivate')} ${user.fullName}?`)) return;
    try {
      await userService.update(user.userId, { fullName: user.fullName, email: user.email, role: user.role, isActive: !user.isActive });
      fetchUsers();
    } catch (e) { showError(e.response?.data?.message || t('error')); }
  };

  const handleChangePassword = async (userId) => {
    if (!newPassword || newPassword.length < 6) { showError(t('usersPasswordMin')); return; }
    try {
      await userService.changePassword(userId, newPassword);
      showSuccess(t('usersPasswordChanged'));
      setChangingPwdFor(null);
      setNewPassword('');
    } catch (e) { showError(e.response?.data?.message || t('error')); }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setForm({ username: user.username, password: '', fullName: user.fullName, email: user.email, role: user.role });
    setShowForm(true);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4338ca" /></View>;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => { if (showForm) resetForm(); else setShowForm(true); }}>
        <Text style={styles.addText}>{showForm ? t('cancel') : t('usersNew')}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editingUser ? t('usersEdit') : t('usersNew')}</Text>
          {!editingUser && (
            <>
              <TextInput style={styles.input} placeholder={t('usersUsername')} value={form.username} onChangeText={v => setForm({...form, username: v})} autoCapitalize="none" />
              <TextInput style={styles.input} placeholder={t('usersPassword')} value={form.password} onChangeText={v => setForm({...form, password: v})} secureTextEntry />
            </>
          )}
          <TextInput style={styles.input} placeholder={t('usersFullName')} value={form.fullName} onChangeText={v => setForm({...form, fullName: v})} />
          <TextInput style={styles.input} placeholder={t('usersEmail')} value={form.email} onChangeText={v => setForm({...form, email: v})} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.fieldLabel}>{t('usersRole')}</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.role} onValueChange={v => setForm({...form, role: v})} style={styles.picker}>
              <Picker.Item label="Admin" value="Admin" />
              <Picker.Item label={t('manager')} value="Manager" />
              <Picker.Item label={t('user')} value="User" />
            </Picker>
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={editingUser ? handleUpdate : handleCreate} disabled={submitting}>
            <Text style={styles.saveText}>{submitting ? t('saving') : t('save')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={users}
        keyExtractor={(u) => String(u.userId)}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.isActive && styles.cardInactive]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.fullName}</Text>
                <Text style={styles.cardUsername}>@{item.username} • {item.email}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: roleBadgeColors[item.role] || '#6b7280' }]}>
                <Text style={styles.roleText}>{item.role === 'Manager' ? t('manager') : item.role}</Text>
              </View>
              {!item.isActive && (
                <View style={styles.inactiveBadge}><Text style={styles.inactiveText}>{t('usersInactive')}</Text></View>
              )}
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => startEdit(item)}>
                <Text style={styles.actionText}>✏️ {t('usersEdit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setChangingPwdFor(changingPwdFor === item.userId ? null : item.userId); setNewPassword(''); }}>
                <Text style={styles.actionText}>🔑 {t('usersChangePwd')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: item.isActive ? '#dc2626' : '#059669' }]} onPress={() => handleToggleActive(item)}>
                <Text style={[styles.actionText, { color: item.isActive ? '#dc2626' : '#059669' }]}>
                  {item.isActive ? `⛔ ${t('usersDeactivate')}` : `✅ ${t('usersActivate')}`}
                </Text>
              </TouchableOpacity>
            </View>
            {changingPwdFor === item.userId && (
              <View style={styles.pwdSection}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder={t('usersNewPassword')} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
                <TouchableOpacity style={styles.pwdBtn} onPress={() => handleChangePassword(item.userId)}>
                  <Text style={styles.pwdBtnText}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t('usersEmpty')}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addBtn: { backgroundColor: '#4338ca', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 12 },
  addText: { color: '#fff', fontWeight: '600' },
  form: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  formTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginTop: 8, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8, fontSize: 14 },
  pickerWrap: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, overflow: 'hidden', marginBottom: 10 },
  picker: { height: 44 },
  saveBtn: { backgroundColor: '#4338ca', borderRadius: 8, padding: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, elevation: 1 },
  cardInactive: { opacity: 0.6, backgroundColor: '#f9fafb' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  cardUsername: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginLeft: 8 },
  roleText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  inactiveBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginLeft: 6 },
  inactiveText: { color: '#991b1b', fontSize: 10, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, cursor: 'pointer' },
  actionText: { fontSize: 12, color: '#374151' },
  pwdSection: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  pwdBtn: { backgroundColor: '#4338ca', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  pwdBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 30 },
});
