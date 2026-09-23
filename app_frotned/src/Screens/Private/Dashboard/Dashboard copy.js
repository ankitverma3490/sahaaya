import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Button from '../../../Component/Button';
import moment from 'moment';
import SimpleModal from '../../../Component/UI/SimpleModal';
import DropdownComponent from '../../../Component/DropdownComponent';
import Input from '../../../Component/Input';
import { useSelector } from 'react-redux';
import LocalizedStrings from '../../../Constants/localization';
import { validators } from '../../../Backend/Validator';
import { isValidForm } from '../../../Backend/Utility';
import SimpleToast from 'react-native-simple-toast';
import { useIsFocused } from '@react-navigation/native';
import { GET_WITH_TOKEN, POST_FORM_DATA } from '../../../Backend/Backend';
import {
  ActiveTodayUser,
  HousersoldAttendance,
  LeaveList,
} from '../../../Backend/api_routes';
import EmptyView from '../../../Component/UI/EmptyView';

const Dashboard = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [status, setStatus] = useState({});
  const [Verify, setVerify] = useState(false);
  const userDetails = useSelector(state => state?.userDetails);
  const [leaveList, setLeaveList] = useState([]);

  const [leaveModal, setLeaveModal] = useState({
    visible: false,
    type: null,
    staff: null,
    remarks: '',
    leaveType: null,
    lateDuration: null,
  });
  const [modalErrors, setModalErrors] = useState({});
  const [activeStaff, setActiveStaff] = useState([]);

  useEffect(() => {
    getaAtiveStaff();
    fetchLeaveTypes();
  }, [isFocused]);

  const getaAtiveStaff = () => {
    GET_WITH_TOKEN(
      ActiveTodayUser,
      success => {
        console.log('success?.data-----',success?.data);
        setActiveStaff(success?.data);
      },
      error => {
        SimpleToast.show('Failed to load profile', SimpleToast.SHORT);
      },
      fail => {
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const fetchLeaveTypes = () => {
    GET_WITH_TOKEN(
      LeaveList,
      success => {
        const leaveTypes = success?.data?.map(item => ({
          value: item.id,
          label: item.name,
        }));
        setLeaveList(leaveTypes || []);
      },
      error => {
        console.log('error----', error);
        SimpleToast.show('Failed to load leave types', SimpleToast.SHORT);
      },
      fail => {
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const handleStatusChange = (data, newStatus) => {
    setStatus(prev => ({ ...prev, [data?.id]: newStatus }));
    const date = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const time = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // 24-hour format
    });

    const formdata = new FormData();
    formdata?.append('staff_id', data?.staff?.id);
    formdata?.append('date', date);
    formdata?.append('status', newStatus);
    formdata?.append('check_in_time', time);
    newStatus == 'absent'
      ? formdata?.append('leave_id', leaveModal.leaveType?.value)
      : formdata?.append('late_minutes', leaveModal.leaveType?.value);
    formdata?.append('description', leaveModal?.remarks);
    console.log('formdata', formdata);

    POST_FORM_DATA(
      HousersoldAttendance,
      formdata,
      success => {
        getaAtiveStaff();
        SimpleToast.show(
          `Your profile status is now ${newStatus}`,
          SimpleToast.SHORT,
        );
      },
      error => {
        console.log('error---', error);
      },
      fail => {},
    );
  };

  const renderStaff = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.profileRow}>
        <Image source={{ uri: item.image }} style={styles.avatar} />
        <View>
          <Typography type={Font?.Poppins_SemiBold} size={16}>
            {item.name}
          </Typography>

          <Typography type={Font?.Poppins_Regular} size={14}>
            {item?.staff?.user_work_info?.primary_role}
          </Typography>
        </View>
      </View>
      <View style={[styles.dot, { backgroundColor: '#16A34A' }]} />
      <View style={styles.statusRow}>
        <TouchableOpacity
          style={[
            styles.statusBtn,
            (status[item.id] == 'present' ||
              item?.attendance_details?.status == 'present') &&
              styles.presentBtn,
          ]}
          onPress={() => handleStatusChange(item, 'present')}
        >
          <Image
            source={ImageConstant?.present}
            tintColor={
              status[item.id] == 'present' ||
              item?.attendance_details?.status == 'present'
                ? '#fff'
                : '#000'
            }
            style={{ width: 16, height: 16, marginRight: 10 }}
          />
          <Typography
            type={Font?.Poppins_Medium}
            color={
              status[item.id] == 'present' ||
              item?.attendance_details?.status == 'present'
                ? '#fff'
                : '#000'
            }
          >
            {LocalizedStrings.Dashboard.Present}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statusBtn,
            (status[item.id] == 'absent' ||
              item?.attendance_details?.status == 'absent') &&
              styles.absentBtn,
          ]}
          onPress={() => {
            setLeaveModal({
              visible: true,
              type: 'absent',
              staff: item,
              remarks: '',
              leaveType: null,
              lateDuration: null,
            });
            setModalErrors({});
          }}
        >
          <Image
            tintColor={
              status[item.id] == 'absent' ||
              item?.attendance_details?.status == 'absent'
                ? '#fff'
                : '#000'
            }
            source={ImageConstant?.absent}
            style={{ width: 16, height: 16, marginRight: 10 }}
          />
          <Typography
            type={Font?.Poppins_Medium}
            color={
              status[item.id] == 'absent' ||
              item?.attendance_details?.status == 'absent'
                ? '#fff'
                : '#000'
            }
          >
            {LocalizedStrings.Dashboard.Absent}
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusBtn,
            (status[item.id] == 'late' ||
              item?.attendance_details?.status == 'late') &&
              styles.lateBtn,
          ]}
          onPress={() => {
            setLeaveModal({
              visible: true,
              type: 'late',
              staff: item,
              remarks: '',
              leaveType: null,
              lateDuration: null,
            });
            setModalErrors({});
          }}
        >
          <Image
            source={ImageConstant?.late}
            style={{ width: 16, height: 16 }}
            tintColor={
              status[item.id] == 'late' ||
              item?.attendance_details?.status == 'late'
                ? '#fff'
                : '#000'
            }
          />
          <Typography
            type={Font?.Poppins_Medium}
            color={
              status[item.id] == 'late' ||
              item?.attendance_details?.status == 'late'
                ? '#fff'
                : '#000'
            }
          >
            {LocalizedStrings.Dashboard.Late}
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.Dashboard.title}
        source_logo={ImageConstant?.notification}
        Profile_icon={userDetails?.image}
        style_title={{ fontSize: 18 }}
        onPressRightIcon={() => navigation.navigate('Notification')}
        onPressProfileIcon={() => navigation.navigate('ProfileManagement')}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Typography
          type={Font?.Poppins_Medium}
          color="#171A1F"
          lineHeight={30}
          size={20}
          style={{ paddingVertical: 20 }}
        >
          {LocalizedStrings.Dashboard.Active_staf}
        </Typography>
        <Typography
          type={Font?.Poppins_Regular}
          color="#171A1F"
          lineHeight={30}
          size={14}
          style={{ paddingVertical: 20 }}
        >
          {moment(activeStaff?.status?.date).format('DD/MM/YYYY')} (Today)
        </Typography>
      </View>
      <FlatList
        data={activeStaff?.active_staff}
        keyExtractor={item => item.id}
        renderItem={renderStaff}
        ListEmptyComponent={() => (
          <EmptyView
            title={'No active staff'}
            description={'No active staff are available right now.'}
            icon={ImageConstant?.Users}
            iconColor="#D98579"
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <SimpleModal
        visible={leaveModal.visible}
        onClose={() => {
          setLeaveModal({ ...leaveModal, visible: false });
          setModalErrors({});
        }}
      >
        <View style={styles.modalBox}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              setLeaveModal({ ...leaveModal, visible: false });
              setModalErrors({});
            }}
          >
            <Typography size={15} type={Font?.Poppins_Bold} color="#C77166">
              ✕
            </Typography>
          </TouchableOpacity>

          <Typography
            size={18}
            type={Font?.Poppins_SemiBold}
            style={{ marginBottom: 25, textAlign: 'center' }}
          >
            {leaveModal.type == 'Absent'
              ? LocalizedStrings.Dashboard_model.Mark_Absent
              : LocalizedStrings.Dashboard_model.Mark_late}
          </Typography>

          {leaveModal.staff && (
            <View style={styles.staffInfo}>
              <Image
                source={{ uri: leaveModal.staff.image }}
                style={styles.staffAvatar}
              />
              <View>
                <Typography size={16} type={Font?.Poppins_SemiBold}>
                  {leaveModal.staff.name}
                </Typography>
                <Typography size={14} type={Font?.Poppins_Regular}>
                  {leaveModal.staff.role}
                </Typography>
              </View>
            </View>
          )}

          {leaveModal.type == 'absent' ? (
            <DropdownComponent
              title={LocalizedStrings.Dashboard_model.Leave_Type}
              placeholder="Select Type"
              width={'100%'}
              style_dropdown={{ marginHorizontal: 0 }}
              selectedTextStyleNew={{
                marginLeft: 10,
                fontFamily: Font.Poppins_Regular,
              }}
              marginHorizontal={0}
              style_title={{
                textAlign: 'left',
                fontFamily: Font.Poppins_Regular,
              }}
              value={leaveModal.leaveType?.value}
              data={leaveList}
              onChange={item => {
                setLeaveModal(prev => ({ ...prev, leaveType: item || null }));
                if (modalErrors?.leaveType) {
                  setModalErrors({ ...modalErrors, leaveType: null });
                }
              }}
              error={modalErrors?.leaveType}
            />
          ) : (
            <DropdownComponent
              title={LocalizedStrings.Dashboard_model.late_Short}
              placeholder="Select Hours"
              width={'100%'}
              style_dropdown={{ marginHorizontal: 0 }}
              selectedTextStyleNew={{
                marginLeft: 10,
                fontFamily: Font.Poppins_Regular,
              }}
              marginHorizontal={0}
              style_title={{
                textAlign: 'left',
                fontFamily: Font.Poppins_Regular,
              }}
              value={leaveModal.leaveType?.value}
              data={[
                { value: 1, label: '1' },
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 4, label: '4' },
                { value: 5, label: '5' },
                { value: 6, label: '6' },
                { value: 7, label: '7 ' },
              ]}
              onChange={item => {
                setLeaveModal(prev => ({ ...prev, leaveType: item || null }));
                if (modalErrors?.leaveType) {
                  setModalErrors({ ...modalErrors, leaveType: null });
                }
              }}
              error={modalErrors?.leaveType}
            />
          )}

          <Input
            title={LocalizedStrings.Dashboard_model.Remarks}
            placeholder="Enter remarks"
            value={leaveModal.remarks}
            onChange={text => {
              setLeaveModal(prev => ({ ...prev, remarks: text }));
              if (modalErrors?.remarks) {
                setModalErrors({ ...modalErrors, remarks: null });
              }
            }}
            multiline
            error={modalErrors?.remarks}
          />

          <Button
            title={LocalizedStrings.Dashboard_model.Done}
            onPress={() => {
              const errors = {};
              if (leaveModal.type == 'absent') {
                errors.leaveType = validators.checkRequire(
                  LocalizedStrings.Dashboard_model.Leave_Type || 'Leave Type',
                  leaveModal.leaveType?.value,
                );
              }
              setModalErrors(errors);
              if (isValidForm(errors)) {
                setLeaveModal({ ...leaveModal, visible: false });
                setModalErrors({});
                // setVerify(true);
                handleStatusChange(leaveModal?.staff, leaveModal.type);
              }
            }}
            main_style={{ width: '100%', marginTop: 20 }}
          />
        </View>
      </SimpleModal>

      <SimpleModal visible={Verify}>
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ padding: 40 }}>
            <Image
              source={ImageConstant?.ic_success}
              style={{ width: 60, height: 60, resizeMode: 'contain' }}
            />
          </View>
          <Typography
            size={20}
            type={Font?.Poppins_SemiBold}
            textAlign="center"
          >
            {LocalizedStrings.Dashboard_model.Staff_Leave_Updated ||
              'Staff Leave Updated!'}
          </Typography>
          <Typography
            size={16}
            type={Font?.Poppins_Regular}
            textAlign="center"
            color="#8C8D8B"
            style={{ marginTop: 30 }}
          >
            {leaveModal.staff?.name || 'Staff'}'s {leaveModal.type} has been
            recorded successfully.
          </Typography>
          <Button
            title={'Done'}
            onPress={() => {
              setVerify(false);
              navigation.navigate('TabNavigation');
            }}
            main_style={{ marginTop: 20, width: '100%' }}
            icon={ImageConstant?.Arrow}
          />
        </View>
      </SimpleModal>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <View
          style={{
            position: 'absolute',
            bottom: 70,
            alignItems: 'flex-end',
            flex: 1,
            width: '70%',
          }}
        >
          <Button
            onPress={() => {
              navigation.navigate('AllStaff');
            }}
            linerColor={['#379AE6', '#3737E6']}
            title={LocalizedStrings.Dashboard.find_staf}
            main_style={{ width: '100%' }}
          />
        </View>
      </View>
    </CommanView>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 5,
    marginVertical: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
    marginRight: 12,
  },
  dot: {
    width: 10,
    height: 10,
    position: 'absolute',
    borderRadius: 10,
    right: 10,
    top: 10,
    backgroundColor: '#ccc',
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusBtn: {
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 10,
    justifyContent: 'space-evenly',
  },
  presentBtn: {
    backgroundColor: '#1DD75B',
  },
  absentBtn: {
    backgroundColor: '#BE615B',
  },
  lateBtn: {
    backgroundColor: '#EFB034',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderRadius: '50%',
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#C77166',
    color: '#C77166',
    paddingHorizontal: 4.5,
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  staffAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
    marginRight: 12,
  },
});
