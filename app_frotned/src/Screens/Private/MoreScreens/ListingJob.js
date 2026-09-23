import {
  StyleSheet,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Modal,
  Alert,
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import { GET_WITH_TOKEN, POST_WITH_TOKEN, API } from '../../../Backend/Backend';
import { ApplicantsList, ApplicantsStatus } from '../../../Backend/api_routes';
import { ImageConstant } from '../../../Constants/ImageConstant';
import { useIsFocused } from '@react-navigation/native';
import SimpleToast from 'react-native-simple-toast';
import LocalizedStrings from '../../../Constants/localization';
import EmptyView from '../../../Component/UI/EmptyView';
import moment from 'moment';

const getProfileImage = (img) => {
  if (!img || img.includes('noimage')) return null;
  if (img.startsWith('http')) return img;
  const baseUrl = API.replace('/api/', '');
  return `${baseUrl}${img}`;
};

export default function ListingJob({ navigation, route }) {
  const [listAppJob, setListAppList] = useState([]);
  const [detailItem, setDetailItem] = useState(null);
  const id = route?.params?.id;
  const isFocused = useIsFocused();

  const reviews = detailItem?.user?.reviews_received || detailItem?.user?.reviewsReceived || [];
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => {
        const rate = Number(r.rating);
        return sum + (isNaN(rate) ? 0 : rate);
      }, 0) / totalReviews).toFixed(1)
    : 'No ratings';

  const getPresentAddress = () => {
    const addresses = detailItem?.user?.addresses || [];
    if (addresses.length > 0) {
      const presAddr = addresses.find(a => a.address_type === 'present' || a.address_type === 'present_address') || addresses.find(a => a.is_primary) || addresses[0];
      if (presAddr) {
        const formatted = [presAddr.street, presAddr.area_locality, presAddr.city, presAddr.state, presAddr.pincode].filter(Boolean).join(', ');
        if (formatted) return formatted;
      }
    }
    const fallback = [detailItem?.user?.street_address || detailItem?.user?.street, detailItem?.user?.locality, detailItem?.user?.city, detailItem?.user?.state, detailItem?.user?.pincode]
      .filter(Boolean).join(', ');
    return fallback || null;
  };

  const getPermanentAddress = () => {
    const addresses = detailItem?.user?.addresses || [];
    if (addresses.length > 0) {
      const permAddr = addresses.find(a => a.address_type === 'permanent' || a.address_type === 'permanent_address') || (addresses.length > 1 ? addresses[1] : null);
      if (permAddr) {
        const formatted = [permAddr.street, permAddr.area_locality, permAddr.city, permAddr.state, permAddr.pincode].filter(Boolean).join(', ');
        if (formatted) return formatted;
      }
    }
    const userPerm = [detailItem?.user?.perm_street, detailItem?.user?.perm_locality, detailItem?.user?.perm_city, detailItem?.user?.perm_state, detailItem?.user?.perm_pincode]
      .filter(Boolean).join(', ');
    return userPerm || null;
  };

  const handleCall = phoneNumber => {
    if (!phoneNumber) {
      SimpleToast.show('Phone number not available', SimpleToast.SHORT);
      return;
    }
    const phone = String(phoneNumber).replace(/\D/g, '');
    const fullPhone = phone.startsWith('91') && phone.length >= 12 ? phone : `91${phone}`;
    Linking.openURL(`tel:+${fullPhone}`);
  };

  const handleWhatsApp = async phoneNumber => {
    if (!phoneNumber) {
      SimpleToast.show('Phone number not available', SimpleToast.SHORT);
      return;
    }
    const phone = phoneNumber.replace(/\D/g, '');
    const fullPhone = phone.startsWith('91') && phone.length >= 12 ? phone : `91${phone}`;
    const url = `whatsapp://send?phone=${fullPhone}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      SimpleToast.show('WhatsApp not installed', SimpleToast.SHORT);
      return;
    }
    Linking.openURL(url);
  };

  const JobList = useCallback(() => {
    console.log('[JobList] Fetching applications for job ID:', id);
    GET_WITH_TOKEN(
      `${ApplicantsList}/${id}/applications`,
      success => {
        console.log('[JobList] Success response:', JSON.stringify(success));
        const apps = success?.data ?? [];
        setListAppList(Array.isArray(apps) ? apps : []);
      },
      error => {
        console.log('[JobList] Error response:', JSON.stringify(error));
        console.log('[JobList] Error status:', error?.status, error?.data?.message);
      },
      fail => {
        console.log('[JobList] Network fail:', JSON.stringify(fail));
      },
    );
  }, [id]);

  useEffect(() => {
    if (isFocused) {
      JobList();
    }
  }, [isFocused, JobList]);

  // API call for approve/reject
  const handelapplication = (status, jobID, item) => {
    if (status === 'rejected') {
      // Reject immediately — no OTP needed
      POST_WITH_TOKEN(
        `${ApplicantsStatus}/${jobID}/status`,
        { application_status: status },
        success => {
          SimpleToast.show(success?.message || 'Success', SimpleToast.SHORT);
          JobList();
        },
        error => {
          SimpleToast.show(
            error?.data?.message || error?.message || 'Something went wrong',
            SimpleToast.SHORT,
          );
        },
        fail => {
          SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
        },
      );
      return;
    }

    if (status === 'accepted' && item?.user) {
      // MANDATORY OTP & WORK CONTRACT SETUP FOR ALL APPLICANT APPROVALS!
      // Navigates to StaffVerifection OTP screen -> sends OTP to staff's registered mobile number!
      navigation.navigate('StaffVerifection', {
        adharNumber: item?.user?.aadhar_number || item?.user?.aadhaar_number || item?.user?.phone,
        userData: item?.user,
        pendingApproval: true,
        applicationId: jobID,
        job_id: item?.job_id || item?.job?.id,
        job_compensation: item?.job?.expected_compensation || item?.job?.compensation,
        job_title: item?.job?.title,
        job_compensation_type: item?.job?.compensation_type,
      });
    }
  };

  return (
    <CommanView>
      <HeaderForUser
        title={
          LocalizedStrings.MyJobPostings.job_applications || 'Job Applications'
        }
        source_logo={ImageConstant?.notification}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation?.goBack()}
        onPressRightIcon={() => navigation.navigate('Notification')}
        style_title={{ fontSize: 18 }}
      />
      {listAppJob.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <EmptyView
            title={
              LocalizedStrings.MyJobPostings?.no_applicants || 'No Applicants'
            }
            description={
              LocalizedStrings.MyJobPostings?.no_applicants_desc ||
              'No one has applied for this job yet. Share the job posting to get applicants.'
            }
            icon={ImageConstant?.Users}
            iconColor="#D98579"
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 16 }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <Typography type={Font.Poppins_SemiBold} style={{ fontSize: 17 }}>
              {LocalizedStrings.LeaveApplications.Subtitle || 'Recent Requests'}
            </Typography>
            <Typography type={Font.Poppins_Regular}>
              {listAppJob.length}
            </Typography>
          </View>
          {listAppJob.map(item => {
            const avatarUri = getProfileImage(item.user?.image);
            return (
            <View key={item.id} style={styles.card}>
              <View style={styles.headerRow}>
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Typography
                      type={Font.Poppins_SemiBold}
                      style={styles.avatarText}
                    >
                      {item.user?.first_name?.charAt(0) || '?'}
                    </Typography>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Typography type={Font.Poppins_SemiBold} style={styles.name}>
                    {item.user?.first_name} {item.user?.last_name}
                  </Typography>
                  <Typography type={Font.Poppins_Regular} style={styles.type}>
                    {item.user?.phone_number}
                  </Typography>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9E6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 }}>
                      <Typography size={11} color="#F5B041" type={Font?.Poppins_Medium || 'System'}>
                        ★ {Number(item.user?.rating || item.user?.average_rating || 0).toFixed(1)}
                      </Typography>
                    </View>
                    <Typography size={11} color="gray" style={{ marginLeft: 6 }}>
                      ({item.user?.review_count || item.user?.reviews_count || 0} Reviews)
                    </Typography>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusTag,
                    {
                      backgroundColor:
                        item?.application_status == 'accepted'
                          ? '#A7F3D0'
                          : item?.application_status == 'pending'
                          ? '#FEF3C7'
                          : '#FECACA',
                    },
                  ]}
                >
                  <Typography
                    type={Font.Poppins_SemiBold}
                    style={[
                      styles.statusText,
                      {
                        color:
                          item?.application_status == 'accepted'
                            ? '#047857'
                            : item?.application_status == 'pending'
                            ? '#B45309'
                            : '#B91C1C',
                      },
                    ]}
                  >
                    {item?.application_status == 'accepted'
                      ? LocalizedStrings.LeaveApplications.Approved
                      : item?.application_status == 'pending'
                      ? LocalizedStrings.LeaveApplications.Pending
                      : item?.application_status == 'rejected'
                      ? LocalizedStrings.LeaveApplications.Rejected
                      : item?.application_status}
                  </Typography>
                </View>
              </View>
              <View style={styles.row}>
                <Image
                  source={ImageConstant.lines}
                  style={styles.icon}
                  resizeMode="contain"
                />
                <Typography type={Font.Poppins_Regular} style={styles.dates}>
                  {LocalizedStrings.LeaveApplications.DatesRequested}:{' '}
                  {item?.available_from ? moment(item?.available_from).format('DD-MM-YYYY') : 'N/A'}
                </Typography>
              </View>
              <View style={styles.contactRow}>
                <TouchableOpacity
                  style={styles.contactBtn}
                  onPress={() => handleCall(item.user?.phone_number)}
                >
                  <Image
                    source={ImageConstant.phone}
                    style={[styles.icon, { tintColor: '#D98579' }]}
                    resizeMode="contain"
                  />
                  <Typography
                    type={Font.Poppins_Regular}
                    style={{ color: '#D98579', fontSize: 12, marginLeft: 4 }}
                  >
                    Call
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactBtn}
                  onPress={() => handleWhatsApp(item.user?.phone_number)}
                >
                  <Image
                    source={ImageConstant.WhatsApp}
                    style={[styles.icon, { tintColor: '#25D366' }]}
                    resizeMode="contain"
                  />
                  <Typography
                    type={Font.Poppins_Regular}
                    style={{ color: '#25D366', fontSize: 12, marginLeft: 4 }}
                  >
                    WhatsApp
                  </Typography>
                </TouchableOpacity>
              </View>

              {/* Show action buttons for pending or accepted */}
              {item?.application_status == 'accepted' && item?.user?.is_staff_added != 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F5E9', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginTop: 12 }}>
                  <Image source={ImageConstant?.correct} style={{ width: 14, height: 14, tintColor: '#2E7D32', marginRight: 6 }} />
                  <Typography type={Font.Poppins_SemiBold} color="#2E7D32" size={13}>
                    Confirmed & Added as Staff
                  </Typography>
                </View>
              ) : (
                (item?.application_status == 'pending' || item?.application_status == 'accepted') && (
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: 'white',
                          borderWidth: 1,
                          borderColor: '#D98579',
                        },
                      ]}
                      onPress={() => {
                        if (item?.application_status == 'accepted') {
                          Alert.alert(
                            'Reject Staff',
                            'This staff member is currently active. Rejecting will remove them from your staff and stop their salary. Are you sure?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Reject', style: 'destructive', onPress: () => handelapplication('rejected', item?.id, item) },
                            ],
                          );
                        } else {
                          handelapplication('rejected', item?.id, item);
                        }
                      }}
                    >
                      <Image
                        source={ImageConstant.X}
                        style={styles.icon}
                        resizeMode="contain"
                      />
                      <Typography
                        type={Font.Poppins_Regular}
                        style={{ color: '#D98579', fontSize: 13, marginLeft: 4 }}
                      >
                        {LocalizedStrings.LeaveApplications.Reject}
                      </Typography>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: '#D98579' },
                      ]}
                      onPress={() => handelapplication('accepted', item?.id, item)}
                    >
                      <Image
                        source={ImageConstant.correct}
                        style={styles.icon}
                        resizeMode="contain"
                      />
                      <Typography
                        type={Font.Poppins_Regular}
                        style={{ color: '#FFFFFF', fontSize: 13, marginLeft: 4 }}
                      >
                        {item?.application_status == 'accepted' && item?.user?.is_staff_added == 0
                          ? 'Add Staff Again'
                          : LocalizedStrings.LeaveApplications.Approve}
                      </Typography>
                    </TouchableOpacity>
                  </View>
                )
              )}

              <TouchableOpacity
                style={styles.viewDetailsBtn}
                onPress={() => setDetailItem(item)}
              >
                <Typography
                  type={Font.Poppins_Medium}
                  style={styles.viewDetailsBtnText}
                >
                  View Details
                </Typography>
              </TouchableOpacity>
            </View>
          );
          })}
        </ScrollView>
      )}
      {/* Applicant Detail Modal */}
      <Modal
        visible={!!detailItem}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity
              onPress={() => setDetailItem(null)}
              style={styles.modalCloseBtn}
            >
              <Typography size={18} color="#D98579">{'\u2715'}</Typography>
            </TouchableOpacity>

            <Typography
              type={Font.Poppins_SemiBold}
              size={17}
              style={{ textAlign: 'center', marginBottom: 16 }}
            >
              Applicant Details
            </Typography>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Profile */}
              <View style={styles.modalProfileRow}>
                {getProfileImage(detailItem?.user?.image) ? (
                  <Image
                    source={{ uri: getProfileImage(detailItem?.user?.image) }}
                    style={styles.modalProfileImage}
                  />
                ) : (
                  <View style={styles.modalProfileFallback}>
                    <Typography type={Font.Poppins_SemiBold} style={{ fontSize: 22, color: '#555' }}>
                      {detailItem?.user?.first_name?.charAt(0) || '?'}
                    </Typography>
                  </View>
                )}
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Typography type={Font.Poppins_SemiBold} size={16}>
                    {detailItem?.user?.first_name} {detailItem?.user?.last_name}
                  </Typography>
                  <Typography type={Font.Poppins_Regular} size={13} color="#666">
                    {detailItem?.user?.phone_number || 'Phone not available'}
                  </Typography>
                  {detailItem?.user?.email ? (
                    <Typography type={Font.Poppins_Regular} size={12} color="#888">
                      {String(detailItem.user.email).replace(/_deleted_\d+$/, '')}
                    </Typography>
                  ) : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Typography type={Font.Poppins_SemiBold} size={13} color="#D98579">
                      {totalReviews > 0 ? `${avgRating} \u2605` : 'No Ratings'}
                    </Typography>
                    {totalReviews > 0 && (
                      <Typography type={Font.Poppins_Regular} size={12} color="#888" style={{ marginLeft: 6 }}>
                        ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                      </Typography>
                    )}
                  </View>
                </View>
              </View>

              {/* Application Status */}
              <View style={styles.modalSection}>
                <Typography type={Font.Poppins_SemiBold} size={14} style={styles.modalSectionTitle}>
                  Application Info
                </Typography>
                <DetailRow label="Status" value={
                  detailItem?.application_status === 'accepted' ? 'Approved' :
                  detailItem?.application_status === 'pending' ? 'Pending' :
                  detailItem?.application_status === 'rejected' ? 'Rejected' :
                  detailItem?.application_status || 'N/A'
                } />
                <DetailRow label="Applied On" value={
                  detailItem?.created_at ? moment(detailItem.created_at).format('DD-MM-YYYY') : 'N/A'
                } />
                <DetailRow label="Available From" value={
                  detailItem?.available_from ? moment(detailItem.available_from).format('DD-MM-YYYY') : 'N/A'
                } />
              </View>

              {/* Personal Details */}
              <View style={styles.modalSection}>
                <Typography type={Font.Poppins_SemiBold} size={14} style={styles.modalSectionTitle}>
                  Personal Details
                </Typography>
                <DetailRow label="Gender" value={detailItem?.user?.gender} />
                <DetailRow label="Date of Birth" value={detailItem?.user?.dob} />
                <DetailRow label="Location" value={detailItem?.user?.city || detailItem?.user?.location} />
                <DetailRow label="Present Address" value={getPresentAddress()} />
                <DetailRow label="Permanent Address" value={getPermanentAddress()} />
              </View>

              {/* Work Expectations */}
              <View style={styles.modalSection}>
                <Typography type={Font.Poppins_SemiBold} size={14} style={styles.modalSectionTitle}>
                  Work Expectations
                </Typography>
                <DetailRow label="Expected Role" value={
                  detailItem?.expected_role
                    ? detailItem.expected_role
                    : detailItem?.user?.user_work_info?.primary_role
                      ? (Array.isArray(detailItem.user.user_work_info.primary_role)
                        ? detailItem.user.user_work_info.primary_role.join(', ')
                        : detailItem.user.user_work_info.primary_role)
                      : null
                } />
                <DetailRow label="Expected Salary" value={
                  detailItem?.expected_salary
                    ? `₹${Number(detailItem.expected_salary).toLocaleString('en-IN')}`
                    : detailItem?.user?.user_work_info?.salary
                      ? `₹${Number(detailItem.user.user_work_info.salary).toLocaleString('en-IN')}`
                      : null
                } />
                <DetailRow label="Pay Frequency" value={
                  detailItem?.pay_frequency ||
                  detailItem?.user?.user_work_info?.pay_frequency ||
                  null
                } />
                <DetailRow label="Working Days" value={
                  (() => {
                    const wd = detailItem?.working_days ||
                      detailItem?.user?.user_work_info?.working_days;
                    if (!wd) return null;
                    if (Array.isArray(wd)) return wd.join(', ');
                    return wd;
                  })()
                } />
                <DetailRow label="Experience" value={
                  (() => {
                    const exp = detailItem?.user?.user_work_info?.total_experience ||
                      detailItem?.user?.user_work_info?.experience ||
                      detailItem?.experience;
                    return exp ? `${exp} Years` : '';
                  })()
                } />
              </View>

              {/* Verification */}
              <View style={styles.modalSection}>
                <Typography type={Font.Poppins_SemiBold} size={14} style={styles.modalSectionTitle}>
                  Verification
                </Typography>
                <DetailRow label="Aadhaar Verified" value={
                  detailItem?.user?.aadhar__verify == 1 ? 'Yes' : 'No'
                } />
              </View>

              {/* Previous Employer Reviews */}
              <View style={styles.modalSection}>
                <Typography type={Font.Poppins_SemiBold} size={14} style={styles.modalSectionTitle}>
                  Previous Employer Reviews
                </Typography>
                {reviews.length === 0 ? (
                  <Typography type={Font.Poppins_Regular} size={13} color="#888" style={{ fontStyle: 'italic', paddingVertical: 4 }}>
                    No reviews from previous employers yet.
                  </Typography>
                ) : (
                  reviews.map((rev, index) => (
                    <View key={rev.id || index} style={styles.reviewCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography type={Font.Poppins_SemiBold} size={13} color="#333">
                          {rev.given_by?.first_name 
                            ? `${rev.given_by.first_name} ${rev.given_by.last_name || ''}`.trim()
                            : 'Previous Employer'}
                        </Typography>
                        <Typography type={Font.Poppins_Bold} size={12} color="#D98579">
                          {Array(Math.max(1, Math.min(5, Number(rev.rating || 5)))).fill('\u2605').join('')}
                        </Typography>
                      </View>
                      {rev.review ? (
                        <Typography type={Font.Poppins_Regular} size={12} color="#555" style={{ marginTop: 4, lineHeight: 18 }}>
                          "{rev.review}"
                        </Typography>
                      ) : null}
                    </View>
                  ))
                )}
              </View>

              {/* Contact Buttons */}
              <View style={[styles.contactRow, { marginTop: 16, marginBottom: 10 }]}>
                <TouchableOpacity
                  style={[styles.contactBtn, { flex: 1, justifyContent: 'center' }]}
                  onPress={() => handleCall(detailItem?.user?.phone_number)}
                >
                  <Image
                    source={ImageConstant.phone}
                    style={[styles.icon, { tintColor: '#D98579' }]}
                    resizeMode="contain"
                  />
                  <Typography
                    type={Font.Poppins_Regular}
                    style={{ color: '#D98579', fontSize: 12, marginLeft: 4 }}
                  >
                    Call
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contactBtn, { flex: 1, justifyContent: 'center' }]}
                  onPress={() => handleWhatsApp(detailItem?.user?.phone_number)}
                >
                  <Image
                    source={ImageConstant.WhatsApp}
                    style={[styles.icon, { tintColor: '#25D366' }]}
                    resizeMode="contain"
                  />
                  <Typography
                    type={Font.Poppins_Regular}
                    style={{ color: '#25D366', fontSize: 12, marginLeft: 4 }}
                  >
                    WhatsApp
                  </Typography>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </CommanView>
  );
}

const DetailRow = ({ label, value }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.detailRow}>
      <Typography type={Font.Poppins_Regular} style={styles.detailLabel}>
        {label}
      </Typography>
      <Typography type={Font.Poppins_Medium} style={styles.detailValue}>
        {value}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 13, color: '#333' },
  name: { fontSize: 14, color: '#111' },
  type: { fontSize: 12, color: '#666' },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  statusText: { fontSize: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  icon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  dates: { fontSize: 12, color: '#555' },
  reason: { fontSize: 12, color: '#777' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 36,
    marginHorizontal: 5,
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBEBEA',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  viewDetailsBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D98579',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewDetailsBtnText: {
    color: '#D98579',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 14,
    zIndex: 10,
    padding: 4,
  },
  modalProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEA',
  },
  modalProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  modalProfileFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    marginBottom: 8,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
  },
  detailLabel: {
    fontSize: 13,
    color: '#888',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    flex: 1.5,
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  reviewCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
});
