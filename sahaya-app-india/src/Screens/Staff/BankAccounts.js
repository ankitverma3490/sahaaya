import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import React, { useState, useCallback } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import { POST_WITH_TOKEN, GET_WITH_TOKEN } from '../../Backend/Backend';
import {
  BankAccountList,
  BankAccountAdd,
  BankAccountUpdate,
  BankAccountDelete,
  BankAccountSetDefault,
} from '../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import { useIsFocused } from '@react-navigation/native';
import Button from '../../Component/Button';

const EMPTY_FORM = { bank_name: '', account_number: '', ifsc_code: '', bank_type: 'saving' };

const BankAccounts = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAccounts = useCallback(() => {
    setLoading(true);
    GET_WITH_TOKEN(
      BankAccountList,
      success => {
        setLoading(false);
        setAccounts(success?.data || []);
      },
      () => { setLoading(false); },
      () => { setLoading(false); SimpleToast.show('Network error. Please check connection.', SimpleToast.SHORT); },
    );
  }, []);

  React.useEffect(() => {
    if (isFocused) fetchAccounts();
  }, [isFocused, fetchAccounts]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      bank_name: item.bank_name || '',
      account_number: item.account_number || '',
      ifsc_code: item.ifsc_code || '',
      bank_type: item.bank_type || 'saving',
    });
    setShowForm(true);
  };

  const handleSave = () => {
    const cleanBankName = form.bank_name.trim();
    const cleanAccountNum = form.account_number.trim();
    const cleanIfsc = form.ifsc_code.trim().toUpperCase();

    if (!cleanBankName) {
      SimpleToast.show('Please enter bank name', SimpleToast.SHORT);
      return;
    }
    if (!cleanAccountNum || cleanAccountNum.length < 9 || cleanAccountNum.length > 18 || !/^[0-9]+$/.test(cleanAccountNum)) {
      SimpleToast.show('Account number must be between 9 and 18 digits', SimpleToast.SHORT);
      return;
    }
    if (!cleanIfsc || cleanIfsc.length !== 11 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      SimpleToast.show('Please enter a valid 11-character IFSC code (e.g. SBIN0001234)', SimpleToast.SHORT);
      return;
    }

    setSaving(true);
    const body = {
      bank_name: cleanBankName,
      account_number: cleanAccountNum,
      ifsc_code: cleanIfsc,
      bank_type: form.bank_type,
    };

    if (editingId) {
      POST_WITH_TOKEN(
        `${BankAccountUpdate}/${editingId}`,
        body,
        success => {
          setSaving(false);
          setShowForm(false);
          SimpleToast.show('Bank account updated successfully', SimpleToast.SHORT);
          fetchAccounts();
        },
        error => {
          setSaving(false);
          SimpleToast.show(error?.data?.message || 'Failed to update bank account', SimpleToast.SHORT);
        },
        () => { setSaving(false); SimpleToast.show('Network error', SimpleToast.SHORT); },
      );
    } else {
      POST_WITH_TOKEN(
        BankAccountAdd,
        body,
        success => {
          setSaving(false);
          setShowForm(false);
          SimpleToast.show('Bank account added successfully', SimpleToast.SHORT);
          fetchAccounts();
        },
        error => {
          setSaving(false);
          SimpleToast.show(error?.data?.message || 'Failed to add bank account', SimpleToast.SHORT);
        },
        () => { setSaving(false); SimpleToast.show('Network error', SimpleToast.SHORT); },
      );
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Remove Bank Account',
      `Are you sure you want to remove ${item.bank_name} (****${(item.account_number || '').slice(-4)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setDeletingId(item.id);
            POST_WITH_TOKEN(
              `${BankAccountDelete}/${item.id}`,
              {},
              () => {
                setDeletingId(null);
                SimpleToast.show('Bank account removed', SimpleToast.SHORT);
                fetchAccounts();
              },
              error => {
                setDeletingId(null);
                SimpleToast.show(error?.data?.message || 'Failed to remove', SimpleToast.SHORT);
              },
              () => { setDeletingId(null); SimpleToast.show('Network error', SimpleToast.SHORT); },
            );
          },
        },
      ],
    );
  };

  const handleSetDefault = (item) => {
    POST_WITH_TOKEN(
      `${BankAccountSetDefault}/${item.id}`,
      {},
      () => {
        SimpleToast.show('Default bank account set', SimpleToast.SHORT);
        fetchAccounts();
      },
      error => {
        SimpleToast.show(error?.data?.message || 'Failed to set default account', SimpleToast.SHORT);
      },
      () => { SimpleToast.show('Network error', SimpleToast.SHORT); },
    );
  };

  const formatMaskedAccount = (num) => {
    if (!num) return '•••• •••• ••••';
    const clean = String(num).trim();
    if (clean.length <= 4) return `•••• •••• ${clean}`;
    const last4 = clean.slice(-4);
    return `•••• •••• ${last4}`;
  };

  const renderItem = ({ item }) => {
    const isDefault = item.is_set === 1 || item.is_set === true || item.is_default === 1 || item.is_default === true;
    return (
      <View style={[styles.cardContainer, isDefault && styles.cardContainerDefault]}>
        <LinearGradient
          colors={isDefault ? ['#FFFFFF', '#FFF8F7'] : ['#FFFFFF', '#FAF9F8']}
          style={styles.cardGradient}
        >
          {/* Card Top Row */}
          <View style={styles.cardTopRow}>
            <View style={styles.bankHeaderLeft}>
              <View style={[styles.bankIconChip, isDefault && styles.bankIconChipDefault]}>
                <Image
                  source={ImageConstant.Salary || ImageConstant.bank}
                  style={styles.bankIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Typography type={Font?.Poppins_Bold} size={15} color="#1E293B">
                  {item.bank_name}
                </Typography>
                <View style={styles.typeBadge}>
                  <Typography type={Font?.Poppins_Medium} size={11} color="#64748B">
                    {item.bank_type === 'saving' ? 'Savings Account' : 'Current Account'}
                  </Typography>
                </View>
              </View>
            </View>

            {isDefault ? (
              <View style={styles.defaultBadge}>
                <Typography type={Font?.Poppins_Bold} size={10} color="#FFFFFF">
                  ★ DEFAULT
                </Typography>
              </View>
            ) : null}
          </View>

          {/* Account Number Display */}
          <View style={styles.accountNumberBox}>
            <Typography type={Font?.Poppins_Regular} size={11} color="#94A3B8" style={{ marginBottom: 2 }}>
              ACCOUNT NUMBER
            </Typography>
            <Typography type={Font?.Poppins_Bold} size={17} color="#0F172A" style={{ letterSpacing: 1.5 }}>
              {formatMaskedAccount(item.account_number)}
            </Typography>
          </View>

          {/* Details Row */}
          <View style={styles.cardDetailsRow}>
            <View>
              <Typography type={Font?.Poppins_Regular} size={10} color="#94A3B8">
                IFSC CODE
              </Typography>
              <Typography type={Font?.Poppins_SemiBold} size={13} color="#334155">
                {item.ifsc_code}
              </Typography>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Typography type={Font?.Poppins_Regular} size={10} color="#94A3B8">
                STATUS
              </Typography>
              <Typography type={Font?.Poppins_SemiBold} size={12} color={isDefault ? '#16A34A' : '#64748B'}>
                {isDefault ? 'Active Payout' : 'Verified'}
              </Typography>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.cardActionsRow}>
            {!isDefault && (
              <TouchableOpacity
                style={styles.setDefaultBtn}
                onPress={() => handleSetDefault(item)}
              >
                <Typography type={Font?.Poppins_SemiBold} size={12} color="#D98579">
                  Set Default
                </Typography>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => openEdit(item)}
            >
              <Typography type={Font?.Poppins_Medium} size={12} color="#3B82F6">
                Edit
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item)}
              disabled={deletingId === item.id}
            >
              <Typography type={Font?.Poppins_Medium} size={12} color="#EF4444">
                {deletingId === item.id ? 'Deleting...' : 'Remove'}
              </Typography>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <CommanView style={{ backgroundColor: '#F8FAFC' }}>
      <HeaderForUser
        title="My Bank Accounts"
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation?.goBack()}
        style_title={{ fontSize: 18, fontFamily: Font?.Poppins_SemiBold }}
      />

      <View style={styles.container}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Image
            source={ImageConstant.Salary || ImageConstant.bank}
            style={styles.infoBannerIcon}
            resizeMode="contain"
          />
          <Typography type={Font?.Poppins_Regular} size={12} color="#64748B" style={{ flex: 1, marginLeft: 10 }}>
            Add your bank account to receive salary payments directly.
          </Typography>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#D98579" />
            <Typography type={Font?.Poppins_Medium} size={13} color="#64748B" style={{ marginTop: 12 }}>
              Loading bank accounts...
            </Typography>
          </View>
        ) : (
          <FlatList
            data={accounts}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Image
                    source={ImageConstant.Salary || ImageConstant.bank}
                    style={styles.emptyIcon}
                    resizeMode="contain"
                  />
                </View>
                <Typography type={Font?.Poppins_Bold} size={16} color="#1E293B" style={{ marginTop: 16 }}>
                  No bank accounts added yet
                </Typography>
                <Typography type={Font?.Poppins_Regular} size={13} color="#64748B" style={{ textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }}>
                  Link your bank account to receive direct salary payouts safely into your account.
                </Typography>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>

      {/* Bottom Sticky Add Button */}
      <View style={styles.bottomBar}>
        <Button
          title="+ Add Bank Account"
          onPress={openAdd}
          style={styles.addBtnStyle}
        />
      </View>

      {/* Add/Edit Modal */}
      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Typography type={Font?.Poppins_Bold} size={18} color="#1E293B">
                {editingId ? 'Edit Bank Account' : 'Add Bank Account'}
              </Typography>
              <TouchableOpacity onPress={() => setShowForm(false)} style={styles.closeBtn}>
                <Typography type={Font?.Poppins_Bold} size={16} color="#64748B">
                  ✕
                </Typography>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Bank Name */}
              <Typography type={Font?.Poppins_SemiBold} size={13} color="#334155" style={{ marginBottom: 6 }}>
                Bank Name *
              </Typography>
              <TextInput
                style={styles.input}
                placeholder="e.g. State Bank of India, HDFC Bank, ICICI"
                placeholderTextColor="#94A3B8"
                maxLength={50}
                value={form.bank_name}
                onChangeText={t => setForm(f => ({ ...f, bank_name: t }))}
              />

              {/* Account Number */}
              <Typography type={Font?.Poppins_SemiBold} size={13} color="#334155" style={{ marginBottom: 6, marginTop: 14 }}>
                Account Number *
              </Typography>
              <TextInput
                style={styles.input}
                placeholder="Enter 9 to 18 digit account number"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={18}
                value={form.account_number}
                onChangeText={t => setForm(f => ({ ...f, account_number: t.replace(/[^0-9]/g, '') }))}
              />

              {/* IFSC Code */}
              <Typography type={Font?.Poppins_SemiBold} size={13} color="#334155" style={{ marginBottom: 6, marginTop: 14 }}>
                IFSC Code *
              </Typography>
              <TextInput
                style={styles.input}
                placeholder="e.g. SBIN0001234"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                maxLength={11}
                value={form.ifsc_code}
                onChangeText={t => setForm(f => ({ ...f, ifsc_code: t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() }))}
              />

              {/* Account Type */}
              <Typography type={Font?.Poppins_SemiBold} size={13} color="#334155" style={{ marginBottom: 8, marginTop: 14 }}>
                Account Type
              </Typography>
              <View style={styles.typeRow}>
                {[
                  { key: 'saving', label: 'Savings Account' },
                  { key: 'current', label: 'Current Account' },
                ].map(typeObj => (
                  <TouchableOpacity
                    key={typeObj.key}
                    style={[styles.typeBtn, form.bank_type === typeObj.key && styles.typeBtnActive]}
                    onPress={() => setForm(f => ({ ...f, bank_type: typeObj.key }))}
                  >
                    <Typography
                      type={Font?.Poppins_SemiBold}
                      size={13}
                      color={form.bank_type === typeObj.key ? '#FFFFFF' : '#475569'}
                    >
                      {typeObj.label}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Modal Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowForm(false)}
                >
                  <Typography type={Font?.Poppins_SemiBold} size={14} color="#64748B">
                    Cancel
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Typography type={Font?.Poppins_Bold} size={14} color="#FFFFFF">
                      {editingId ? 'Update Account' : 'Save Account'}
                    </Typography>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </CommanView>
  );
};

export default BankAccounts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F4',
    borderWidth: 1,
    borderColor: '#FDE8E5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoBannerIcon: {
    width: 24,
    height: 24,
    tintColor: '#D98579',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  cardContainer: {
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardContainerDefault: {
    borderColor: '#D98579',
    borderWidth: 1.5,
  },
  cardGradient: {
    padding: 16,
    borderRadius: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  bankHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bankIconChip: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankIconChipDefault: {
    backgroundColor: '#FFF0ED',
  },
  bankIcon: {
    width: 22,
    height: 22,
    tintColor: '#D98579',
  },
  typeBadge: {
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#D98579',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  accountNumberBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    gap: 12,
  },
  setDefaultBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFF0ED',
    borderWidth: 1,
    borderColor: '#FCDCD7',
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 40,
    height: 40,
    tintColor: '#D98579',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  addBtnStyle: {
    height: 50,
    borderRadius: 25,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    padding: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: Font?.Poppins_Regular,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  typeBtnActive: {
    backgroundColor: '#D98579',
    borderColor: '#D98579',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#D98579',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
