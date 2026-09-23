import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Linking, ScrollView, Modal } from 'react-native';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import { ImageConstant } from '../../../Constants/ImageConstant';
import LocalizedStrings from '../../../Constants/localization';
import SimpleToast from 'react-native-simple-toast';
import { API, POST_WITH_TOKEN } from '../../../Backend/Backend';
import { ReactivateStaff } from '../../../Backend/api_routes';
import { isPlaceholderImage } from '../../../Utils/ImageUtils';

const getProfileImage = (img) => {
  if (!img || isPlaceholderImage(img)) return null;
  if (typeof img === 'string' && img.startsWith('http')) return img;
  const baseUrl = (API && typeof API === 'string') ? API.replace('/api/', '') : '';
  return `${baseUrl}${img}`;
};

const StaffActionScreen = ({ navigation, route }) => {
  const staff = route?.params?.staff || {};
  const itemStatus = (staff.status || staff.application_status || '').toLowerCase();
  const isInactive = itemStatus === 'inactive' || itemStatus === 'terminated' || itemStatus === 'absent';
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleReactivate = () => {
    setShowConfirm(true);
  };

  const confirmReactivate = () => {
    setShowConfirm(false);
    const staffId = staff?.id || staff?.staff?.id;
    if (!staffId) return;
    setLoading(true);

    POST_WITH_TOKEN(
      ReactivateStaff(staffId),
      {},
      res => {
        setLoading(false);
        SimpleToast.show('Staff reactivated successfully', SimpleToast.SHORT);
        navigation.goBack();
      },
      err => {
        setLoading(false);
        SimpleToast.show(err?.data?.message || 'Failed to reactivate staff', SimpleToast.SHORT);
      },
      () => {
        setLoading(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };
  
  // Resolve image and name exactly like HouseHoldStaffProfile
  const profileImageUrl = getProfileImage(staff?.image) || getProfileImage(staff?.staff?.image) || getProfileImage(staff?.user?.image);
  const fullName = `${staff?.first_name || ''} ${staff?.last_name || ''}`.trim() || staff?.name || 'Staff';
  
  const workInfo = staff?.user_work_info || staff?.work_info || staff?.staff?.user_work_info || {};
  let displayRole = 'Staff';
  if (Array.isArray(workInfo?.primary_role) && workInfo.primary_role.length > 0) {
    displayRole = workInfo.primary_role.join(', ');
  } else if (typeof workInfo?.primary_role === 'string') {
    displayRole = workInfo.primary_role;
  } else if (staff?.role) {
    displayRole = staff.role;
  }

  const handleCall = () => {
    const number = staff?.phone_number || staff?.staff?.phone_number;
    if (!number) {
      SimpleToast.show('Phone number not available', SimpleToast.SHORT);
      return;
    }
    Linking.openURL(`tel:+91${number}`);
  };

  const openWhatsApp = async () => {
    const number = staff?.phone_number || staff?.staff?.phone_number;
    if (!number) {
      SimpleToast.show('Phone number not available', SimpleToast.SHORT);
      return;
    }
    const phone = number.replace(/\D/g, '');
    const url = `whatsapp://send?phone=91${phone}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      SimpleToast.show('WhatsApp not installed', SimpleToast.SHORT);
      return;
    }
    Linking.openURL(url);
  };

  const navigateToProfile = () => {
    navigation.navigate('HouseHoldStaffProfile', { item: staff });
  };

  const navigateToSalary = () => {
    const staffId = staff?.id || staff?.staff?.id;
    const name = fullName;
    navigation.navigate('Salary', { staffId: staffId, staffName: name });
  };

  const navigateToAttendance = () => {
    const staffId = staff?.id || staff?.staff?.id;
    const name = fullName;
    navigation.navigate('AttendanceScreen', { staffId: staffId, staffName: name });
  };

  const navigateToTerminate = () => {
    navigation.navigate('HouseHoldStaffProfile', { item: staff, autoOpenTerminate: true });
  };

  return (
    <CommanView>
      <HeaderForUser
        title="Staff Options"
        style_title={{ fontSize: 18, fontFamily: Font.Poppins_SemiBold }}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
        source_logo={ImageConstant?.notification}
        onPressRightIcon={() => navigation.navigate('Notification')}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.viewProfileBadge} onPress={navigateToProfile} activeOpacity={0.7}>
            <Typography size={12} color="#D98579" type={Font.Poppins_Medium}>View Profile</Typography>
          </TouchableOpacity>

          <View style={styles.avatarWrapper}>
            <Image 
              source={profileImageUrl ? { uri: profileImageUrl } : ImageConstant.user} 
              style={styles.avatar} 
            />
          </View>
          
          <Typography size={20} type={Font.Poppins_Bold} color="#1A1A1A" style={{ marginTop: 12, textAlign: 'center' }}>
            {fullName}
          </Typography>

          <View style={styles.roleBadge}>
            <Typography size={12} type={Font.Poppins_Medium} color="#D98579">
              {displayRole}
            </Typography>
          </View>

          {/* Call & WhatsApp Communication Buttons */}
          <View style={styles.communicationRow}>
            <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.8}>
              <Image source={ImageConstant.phone} style={styles.callIcon} />
              <Typography size={13} type={Font.Poppins_Medium} color="#D98579" style={{ marginLeft: 6 }}>
                Call
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity style={styles.waBtn} onPress={openWhatsApp} activeOpacity={0.8}>
              <Image source={ImageConstant.WhatsApp} style={styles.waIcon} />
              <Typography size={13} type={Font.Poppins_Medium} color="#16A34A" style={{ marginLeft: 6 }}>
                WhatsApp
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.actionSection}>
          <Typography size={16} type={Font.Poppins_Bold} color="#1A1A1A" style={styles.sectionHeading}>
            Quick Actions
          </Typography>

          {/* Pay Salary Card */}
          <TouchableOpacity style={styles.actionCard} onPress={navigateToSalary} activeOpacity={0.75}>
            <View style={[styles.iconCircle, { backgroundColor: '#F0F9FF' }]}>
              <Typography size={18} color="#0284C7" type={Font.Poppins_Bold}>₹</Typography>
            </View>
            <View style={styles.actionTextWrapper}>
              <Typography size={15} type={Font.Poppins_SemiBold} color="#1A1A1A">Pay Salary</Typography>
              <Typography size={12} type={Font.Poppins_Regular} color="#777" style={{ marginTop: 2 }}>
                Manage advances and monthly pay
              </Typography>
            </View>
            <Typography size={20} color="#BBB" type={Font.Poppins_Regular}>›</Typography>
          </TouchableOpacity>

          {/* Attendance Statistics Card */}
          <TouchableOpacity style={styles.actionCard} onPress={navigateToAttendance} activeOpacity={0.75}>
            <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
              <Image source={ImageConstant.date} style={[styles.actionIcon, { tintColor: '#16A34A' }]} />
            </View>
            <View style={styles.actionTextWrapper}>
              <Typography size={15} type={Font.Poppins_SemiBold} color="#1A1A1A">Attendance Statistics</Typography>
              <Typography size={12} type={Font.Poppins_Regular} color="#777" style={{ marginTop: 2 }}>
                View and mark daily attendance
              </Typography>
            </View>
            <Typography size={20} color="#BBB" type={Font.Poppins_Regular}>›</Typography>
          </TouchableOpacity>

          {/* Terminate Staff Card — hidden when staff is inactive */}
          {!isInactive && (
          <TouchableOpacity style={styles.actionCard} onPress={navigateToTerminate} activeOpacity={0.75}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF2F2' }]}>
              <Image source={ImageConstant.close} style={[styles.actionIcon, { tintColor: '#DC2626' }]} />
            </View>
            <View style={styles.actionTextWrapper}>
              <Typography size={15} type={Font.Poppins_SemiBold} color="#DC2626">Terminate Staff</Typography>
              <Typography size={12} type={Font.Poppins_Regular} color="#777" style={{ marginTop: 2 }}>
                Remove staff and settle dues
              </Typography>
            </View>
            <Typography size={20} color="#BBB" type={Font.Poppins_Regular}>›</Typography>
          </TouchableOpacity>
          )}

          {/* Reactivate Staff Card — shown only when staff is inactive */}
          {isInactive && (
          <TouchableOpacity style={styles.actionCard} onPress={handleReactivate} activeOpacity={0.75} disabled={loading}>
            <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
              <Typography size={18} color="#16A34A" type={Font.Poppins_Bold}>✓</Typography>
            </View>
            <View style={styles.actionTextWrapper}>
              <Typography size={15} type={Font.Poppins_SemiBold} color="#16A34A">Reactivate Staff</Typography>
              <Typography size={12} type={Font.Poppins_Regular} color="#777" style={{ marginTop: 2 }}>
                Re-add staff to your household
              </Typography>
            </View>
            <Typography size={20} color="#BBB" type={Font.Poppins_Regular}>›</Typography>
          </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Reactivate Confirmation Modal */}
      <Modal visible={showConfirm} transparent animationType="fade" onRequestClose={() => setShowConfirm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Typography size={17} type={Font.Poppins_SemiBold} color="#1A1A1A" style={{ textAlign: 'center' }}>
              Reactivate Staff
            </Typography>
            <Typography size={14} type={Font.Poppins_Regular} color="#555" style={{ textAlign: 'center', marginTop: 12 }}>
              Are you sure you want to reactivate this staff member?
            </Typography>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalNoBtn} onPress={() => setShowConfirm(false)}>
                <Typography size={14} type={Font.Poppins_Medium} color="#666">No</Typography>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalYesBtn} onPress={confirmReactivate}>
                <Typography size={14} type={Font.Poppins_Medium} color="#fff">Yes, Reactivate</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </CommanView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0E5E2',
    shadowColor: '#D98579',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
  },
  viewProfileBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFF5F3',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D98579',
  },
  avatarWrapper: {
    marginTop: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F0F0F0',
    borderWidth: 2.5,
    borderColor: '#D98579',
  },
  roleBadge: {
    backgroundColor: '#FFF5F3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  communicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
    width: '100%',
  },
  callBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D98579',
    backgroundColor: '#FFF5F3',
  },
  callIcon: {
    width: 18,
    height: 18,
    tintColor: '#D98579',
    resizeMode: 'contain',
  },
  waBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#25D366',
    backgroundColor: '#F0FDF4',
  },
  waIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  actionSection: {
    marginTop: 5,
  },
  sectionHeading: {
    marginBottom: 12,
    marginLeft: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  actionTextWrapper: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '82%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
  },
  modalNoBtn: {
    flex: 1,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCC',
    marginRight: 10,
  },
  modalYesBtn: {
    flex: 1,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#16A34A',
    marginLeft: 10,
  },
});

export default StaffActionScreen;
