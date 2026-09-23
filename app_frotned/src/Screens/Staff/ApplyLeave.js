import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Image, ActivityIndicator } from 'react-native';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import Button from '../../Component/Button';
import Input from '../../Component/Input';
import DropdownComponent from '../../Component/DropdownComponent';
import Date_Picker from '../../Component/Date_Picker';
import { ImageConstant } from '../../Constants/ImageConstant';
import LocalizedStrings from '../../Constants/localization';
import { useIsFocused } from '@react-navigation/native';
import { GET_WITH_TOKEN, POST_WITH_TOKEN } from '../../Backend/Backend';
import {
  LeaveList,
  ApplyLeave as ApplyLeaveRoute,
  myWork,
  ApprovedJobs,
} from '../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import moment from 'moment';
import { useSelector } from 'react-redux';

const buildName = (obj) => {
  if (!obj) return null;
  const first = (obj?.first_name || obj?.employer_first_name || obj?.fname || '').trim();
  const last = (obj?.last_name || obj?.employer_last_name || obj?.lname || '').trim();
  const name = (obj?.name || '').trim();
  let full = (first || last) ? `${first} ${last}`.trim() : name;
  if (!full || full === 'null' || full === 'undefined' || full.toLowerCase() === 'user') {
    return null;
  }
  return full;
};

const ApplyLeave = ({ navigation, route }) => {
  const isFocused = useIsFocused();
  const userDetail = useSelector(store => store?.userDetails);
  const [leaveList, setLeaveList] = useState([]);
  const paramHouseownerId = route?.params?.houseownerId;

  // Form state variables
  const [leaveType, setLeaveType] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [houseownerId, setHouseownerId] = useState(paramHouseownerId || null);
  const [activeLeave, setActiveLeave] = useState(null);
  const [pendingLeave, setPendingLeave] = useState(null);
  const [checkingLeave, setCheckingLeave] = useState(true);

  // Employer selection for multi-job / single-job staff
  const [employers, setEmployers] = useState([]);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [hasMultipleEmployers, setHasMultipleEmployers] = useState(false);
  const [isNotEmployed, setIsNotEmployed] = useState(false);
  const [checkingEmployers, setCheckingEmployers] = useState(true);
  const [singleJobId, setSingleJobId] = useState(null);

  // Error states
  const [errors, setErrors] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    employer: '',
  });

  const hasLoadedRef = React.useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isFocused && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchLeaveTypes();
      checkActiveLeave(true);
      fetchEmployers(true);
    }
  }, [isFocused]);

  const checkActiveLeave = (showLoader = false) => {
    if (showLoader) setCheckingLeave(true);
    GET_WITH_TOKEN(
      myWork,
      success => {
        const leaves = success?.data?.leave_requests || [];
        const today = moment().startOf('day');

        const blockingLeave = leaves.find(leave => {
          const status = (leave?.status || '').toString().toLowerCase();
          if (status === 'approved') {
            const leaveEndDate = moment(leave?.end_date);
            return leaveEndDate.isValid() && leaveEndDate.isSameOrAfter(today, 'day');
          }
          return false;
        });

        const pendingLeave = leaves.find(leave => {
          const status = (leave?.status || '').toString().toLowerCase();
          return status === 'pending';
        });

        setActiveLeave(blockingLeave || null);
        setPendingLeave(pendingLeave || null);
        setCheckingLeave(false);
      },
      () => {
        setCheckingLeave(false);
      },
      () => {
        setCheckingLeave(false);
      },
    );
  };

  const fetchEmployers = (showLoader = false) => {
    if (showLoader) setCheckingEmployers(true);
    GET_WITH_TOKEN(
      ApprovedJobs,
      success => {
        const jobs = success?.data || [];
        const mappedList = [];

        if (Array.isArray(jobs) && jobs.length > 0) {
          jobs.forEach((job, index) => {
            const empId =
              job?.job_details?.employer_id ||
              job?.employer_id ||
              job?.creator?.id ||
              job?.houseowner_id ||
              null;
            const jId = job?.job_details?.job_id || job?.job_id || null;
            const empName = job?.employer || job?.creator?.name || job?.employer_details?.name || 'Employer';
            const roleName = job?.role || job?.job_details?.role || 'Staff';

            if (empId) {
              mappedList.push({
                value: jId || empId || index,
                label: `${empName}${roleName ? ' (' + roleName + ')' : ''}`,
                employerName: empName,
                jobId: jId,
                houseownerId: empId,
              });
            }
          });
        }

        fetchEmployersFromMyWork(mappedList);
      },
      () => {
        fetchEmployersFromMyWork([]);
      },
      () => {
        fetchEmployersFromMyWork([]);
      },
    );
  };

  const fetchEmployersFromMyWork = (existingList = []) => {
    GET_WITH_TOKEN(
      myWork,
      success => {
        const myWorkData = success?.data || success;
        const mappedList = [...existingList];

        const jobApps = success?.jobApplications || userDetail?.applications || success?.job_applications || [];
        if (Array.isArray(jobApps) && jobApps.length > 0) {
          jobApps.forEach((app, index) => {
            const status = (app?.status || app?.application_status || '').toLowerCase();
            if (status === 'accepted' || status === 'approved' || status === 'active') {
              const empId = app?.job?.user_id || app?.job?.created_by || app?.employer_id || app?.added_by || null;
              const empName = app?.job?.user?.name || app?.employer_name || app?.job?.houseowner?.name || 'Employer';
              const roleName = app?.job?.title || app?.role || 'Staff';
              if (empId && !mappedList.some(e => Number(e.houseownerId) === Number(empId))) {
                mappedList.push({
                  value: app?.job_id || app?.job?.id || index,
                  label: `${empName}${roleName ? ' (' + roleName + ')' : ''}`,
                  employerName: empName,
                  jobId: app?.job_id || app?.job?.id || null,
                  houseownerId: empId,
                });
              }
            }
          });
        }

        const directOwnerId =
          myWorkData?.added_by ||
          myWorkData?.houseowner_id ||
          myWorkData?.employer_id ||
          myWorkData?.houseowner?.id ||
          myWorkData?.employer_details?.id ||
          userDetail?.added_by ||
          userDetail?.houseowner_id ||
          null;

        if (directOwnerId && !mappedList.some(e => Number(e.houseownerId) === Number(directOwnerId))) {
          const empName =
            buildName(myWorkData?.houseowner) ||
            buildName(myWorkData?.employer_details) ||
            buildName(myWorkData?.added_by_user) ||
            userDetail?.added_by_name ||
            'Employer';
          mappedList.push({
            value: myWorkData?.job_id || directOwnerId,
            label: empName,
            employerName: empName,
            jobId: myWorkData?.job_id || null,
            houseownerId: directOwnerId,
          });
        }

        processEmployersList(mappedList);
      },
      () => {
        processEmployersList(existingList);
      },
      () => {
        processEmployersList(existingList);
      },
    );
  };

  const processEmployersList = (list) => {
    const uniqueEmployers = [];
    const seen = new Set();
    list.forEach(emp => {
      const key = `${emp.houseownerId}_${emp.jobId}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueEmployers.push(emp);
      }
    });

    setEmployers(uniqueEmployers);
    setCheckingEmployers(false);

    if (uniqueEmployers.length === 0) {
      setIsNotEmployed(true);
      setHasMultipleEmployers(false);
      setSelectedEmployer(null);
      setHouseownerId(null);
    } else if (uniqueEmployers.length === 1) {
      setIsNotEmployed(false);
      setHasMultipleEmployers(false);
      const single = uniqueEmployers[0];
      setSelectedEmployer(single);
      setHouseownerId(single.houseownerId);
      setSingleJobId(single.jobId);
    } else {
      setIsNotEmployed(false);
      setHasMultipleEmployers(true);
      if (paramHouseownerId) {
        const match = uniqueEmployers.find(e => Number(e.houseownerId) === Number(paramHouseownerId));
        if (match) {
          setSelectedEmployer(match);
          setHouseownerId(match.houseownerId);
          setSingleJobId(match.jobId);
        }
      }
    }
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
        SimpleToast.show('Failed to load leave types', SimpleToast.SHORT);
      },
      fail => {
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const clearError = field => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    if (isNotEmployed) {
      SimpleToast.show('You are currently not employed with any employer.', SimpleToast.SHORT);
      return false;
    }

    const newErrors = {
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: '',
      employer: '',
    };
    let hasError = false;

    if (hasMultipleEmployers && !selectedEmployer) {
      newErrors.employer = 'Please select an employer';
      hasError = true;
    }

    if (!leaveType || (!leaveType?.value && !leaveType)) {
      newErrors.leaveType = 'Please select leave type';
      hasError = true;
    }

    if (!startDate || startDate.trim() === '') {
      newErrors.startDate = 'Start date field is required.';
      hasError = true;
    } else {
      const startMoment = moment(
        startDate,
        ['YYYY-MM-DD', 'DD-MM-YYYY', moment.ISO_8601],
        true,
      );
      if (!startMoment.isValid()) {
        newErrors.startDate = 'Invalid start date format.';
        hasError = true;
      }
    }

    if (!endDate || endDate.trim() === '') {
      newErrors.endDate = 'End date field is required.';
      hasError = true;
    } else {
      const endMoment = moment(
        endDate,
        ['YYYY-MM-DD', 'DD-MM-YYYY', moment.ISO_8601],
        true,
      );
      if (!endMoment.isValid()) {
        newErrors.endDate = 'Invalid end date format.';
        hasError = true;
      } else if (startDate) {
        const startMoment = moment(
          startDate,
          ['YYYY-MM-DD', 'DD-MM-YYYY', moment.ISO_8601],
          true,
        );
        if (startMoment.isValid() && endMoment.isBefore(startMoment, 'day')) {
          newErrors.endDate = 'End date cannot be before start date.';
          hasError = true;
        }
      }
    }

    if (!reason || reason.trim() === '') {
      newErrors.reason = 'Reason field is required.';
      hasError = true;
    } else if (reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters.';
      hasError = true;
    } else if (reason.trim().length > 500) {
      newErrors.reason = 'Reason must not exceed 500 characters.';
      hasError = true;
    }

    setErrors(newErrors);
    return !hasError;
  };

  const handleSubmit = () => {
    if (loading) return;

    if (isNotEmployed) {
      SimpleToast.show('You are currently not employed with any employer.', SimpleToast.SHORT);
      return;
    }

    if (!validateForm()) {
      SimpleToast.show(
        'Please fill all required fields correctly',
        SimpleToast.SHORT,
      );
      return;
    }

    const targetHouseownerId = selectedEmployer?.houseownerId || houseownerId;
    if (!targetHouseownerId) {
      SimpleToast.show('No employer selected. Please try again.', SimpleToast.SHORT);
      return;
    }

    setLoading(true);

    const startDateFormatted =
      typeof startDate === 'string'
        ? moment(startDate, ['YYYY-MM-DD', 'DD-MM-YYYY'], true).format(
            'YYYY-MM-DD',
          )
        : moment(startDate).format('YYYY-MM-DD');

    const endDateFormatted =
      typeof endDate === 'string'
        ? moment(endDate, ['YYYY-MM-DD', 'DD-MM-YYYY'], true).format(
            'YYYY-MM-DD',
          )
        : moment(endDate).format('YYYY-MM-DD');

    const body = {
      houseowner_id: Number(targetHouseownerId),
      job_id: selectedEmployer?.jobId || singleJobId || null,
      leave_type_id: Number(leaveType?.value || leaveType),
      start_date: startDateFormatted,
      end_date: endDateFormatted,
      reason: reason.trim(),
    };

    POST_WITH_TOKEN(
      ApplyLeaveRoute,
      body,
      success => {
        setLoading(false);
        SimpleToast.show(
          success?.message || 'Leave request submitted successfully!',
          SimpleToast.SHORT,
        );
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('TabNavigationForStaff', { screen: 'DashboardHome' });
        }
      },
      error => {
        setLoading(false);
        const msg = error?.data?.message || error?.message || error?.response?.data?.message;
        const errorMessage = msg || 'Failed to submit leave request. Please try again.';
        SimpleToast.show(errorMessage, SimpleToast.SHORT);
      },
      fail => {
        setLoading(false);
        SimpleToast.show(
          'Network error. Please check your connection and try again.',
          SimpleToast.SHORT,
        );
      },
    );
  };

  if (checkingLeave || checkingEmployers) {
    return (
      <CommanView>
        <HeaderForUser
          title={
            LocalizedStrings.staffSection?.StaffDashboard?.apply_leave ||
            'Apply Leave'
          }
          style_title={{ fontSize: 18 }}
          source_arrow={ImageConstant?.BackArrow}
          onPressLeftIcon={() => navigation.goBack()}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#D98579" />
          <Typography type={Font.Poppins_Regular} style={{ marginTop: 12, color: '#888' }}>
            Loading leave form...
          </Typography>
        </View>
      </CommanView>
    );
  }

  if (isNotEmployed) {
    return (
      <CommanView>
        <HeaderForUser
          title={
            LocalizedStrings.staffSection?.StaffDashboard?.apply_leave ||
            'Apply Leave'
          }
          style_title={{ fontSize: 18 }}
          source_arrow={ImageConstant?.BackArrow}
          onPressLeftIcon={() => navigation.goBack()}
        />
        <View style={styles.blockedContainer}>
          <View style={styles.blockedCard}>
            <View style={styles.blockedIconCircle}>
              <Image
                source={ImageConstant.lines}
                style={styles.blockedIcon}
                resizeMode="contain"
              />
            </View>
            <Typography
              type={Font.Poppins_SemiBold}
              style={styles.blockedTitle}
            >
              Cannot Apply for Leave
            </Typography>
            <Typography
              type={Font.Poppins_Regular}
              style={styles.blockedMessage}
            >
              You are currently not employed with any employer. You can only apply for leave once you have an active job.
            </Typography>
            <Button
              onPress={() => navigation.goBack()}
              title="Go Back"
              main_style={styles.button}
            />
          </View>
        </View>
      </CommanView>
    );
  }

  if (activeLeave && !checkingLeave) {
    const isPending = (activeLeave?.status || '').toString().toLowerCase() === 'pending';
    return (
      <CommanView>
        <HeaderForUser
          title={
            LocalizedStrings.staffSection?.StaffDashboard?.apply_leave ||
            'Apply Leave'
          }
          style_title={{ fontSize: 18 }}
          source_arrow={ImageConstant?.BackArrow}
          onPressLeftIcon={() => navigation.goBack()}
        />
        <View style={styles.blockedContainer}>
          <View style={styles.blockedCard}>
            <View style={styles.blockedIconCircle}>
              <Image
                source={ImageConstant.lines}
                style={styles.blockedIcon}
                resizeMode="contain"
              />
            </View>
            <Typography
              type={Font.Poppins_SemiBold}
              style={styles.blockedTitle}
            >
              {isPending
                ? 'Leave Request Pending'
                : 'Leave Already Approved'}
            </Typography>
            <Typography
              type={Font.Poppins_Regular}
              style={styles.blockedMessage}
            >
              {isPending
                ? 'You already have a pending leave request. Please wait until it is approved or rejected before applying for a new one.'
                : 'You have an approved leave that is still active. You can apply for a new leave once your current leave period ends.'}
            </Typography>

            <View style={styles.blockedInfoRow}>
              <Typography type={Font.Poppins_Regular} style={styles.blockedLabel}>
                Status
              </Typography>
              <View
                style={[
                  styles.blockedStatusTag,
                  {
                    backgroundColor: isPending ? '#FEF3C7' : '#A7F3D0',
                  },
                ]}
              >
                <Typography
                  type={Font.Poppins_SemiBold}
                  style={{
                    fontSize: 12,
                    color: isPending ? '#B45309' : '#047857',
                    textTransform: 'capitalize',
                  }}
                >
                  {activeLeave?.status}
                </Typography>
              </View>
            </View>

            <View style={styles.blockedInfoRow}>
              <Typography type={Font.Poppins_Regular} style={styles.blockedLabel}>
                Period
              </Typography>
              <Typography type={Font.Poppins_Medium} style={{ fontSize: 13 }}>
                {activeLeave?.start_date
                  ? moment(activeLeave.start_date).format('DD MMM YYYY')
                  : '--'}{' '}
                -{' '}
                {activeLeave?.end_date
                  ? moment(activeLeave.end_date).format('DD MMM YYYY')
                  : '--'}
              </Typography>
            </View>

            {activeLeave?.reason ? (
              <View style={styles.blockedInfoRow}>
                <Typography type={Font.Poppins_Regular} style={styles.blockedLabel}>
                  Reason
                </Typography>
                <Typography
                  type={Font.Poppins_Regular}
                  style={{ fontSize: 13, flex: 1, textAlign: 'right' }}
                  numberOfLines={2}
                >
                  {activeLeave.reason}
                </Typography>
              </View>
            ) : null}

            <Button
              onPress={() => navigation.goBack()}
              title="Go Back"
              main_style={styles.button}
            />
          </View>
        </View>
      </CommanView>
    );
  }

  return (
    <CommanView>
      <HeaderForUser
        title={
          LocalizedStrings.staffSection?.StaffDashboard?.apply_leave ||
          'Apply Leave'
        }
        style_title={{ fontSize: 18 }}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
      >
        <View style={styles.card}>
          {pendingLeave && (
            <View style={styles.warningBanner}>
              <Typography type={Font.Poppins_Medium} size={13} color="#92400E">
                You have a pending leave request
                {pendingLeave?.start_date && pendingLeave?.end_date
                  ? ` (${moment(pendingLeave.start_date).format('DD MMM')} - ${moment(pendingLeave.end_date).format('DD MMM')})`
                  : ''}
                . Please wait for employer review.
              </Typography>
            </View>
          )}

          {hasMultipleEmployers ? (
            <DropdownComponent
              title="Select Employer"
              placeholder="Select employer"
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
              data={employers}
              value={selectedEmployer}
              onChange={item => {
                setSelectedEmployer(item);
                setHouseownerId(item?.houseownerId || item?.value);
                clearError('employer');
              }}
              error={errors.employer}
            />
          ) : selectedEmployer ? (
            <View style={{ marginBottom: 16 }}>
              <Typography size={12} style={{ marginBottom: 6, color: '#333', fontFamily: Font.Poppins_Regular }}>
                Employer
              </Typography>
              <View style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12 }}>
                <Typography size={14} style={{ fontFamily: Font.Poppins_Medium, color: '#111827' }}>
                  {selectedEmployer.label || selectedEmployer.employerName}
                </Typography>
              </View>
            </View>
          ) : null}

          <DropdownComponent
            title={
              LocalizedStrings.LeaveApplications?.LeaveType || 'Leave Type'
            }
            placeholder={
              LocalizedStrings.LeaveApplications?.LeaveType ||
              'Select leave type'
            }
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
            data={leaveList}
            value={leaveType}
            onChange={item => {
              setLeaveType(item);
              clearError('leaveType');
            }}
            error={errors.leaveType}
          />

          <Date_Picker
            title={
              LocalizedStrings.LeaveApplications?.Start_Date || 'Start Date'
            }
            placeholder="DD-MM-YYYY"
            selected_date={startDate}
            onConfirm={date => {
              const formattedDate = moment(date).format('YYYY-MM-DD');
              setStartDate(formattedDate);
              clearError('startDate');
            }}
            allowFutureDates={true}
            error={errors.startDate}
          />

          <Date_Picker
            title={LocalizedStrings.LeaveApplications?.End_Date || 'End Date'}
            placeholder="DD-MM-YYYY"
            selected_date={endDate}
            onConfirm={date => {
              const formattedDate = moment(date).format('YYYY-MM-DD');
              setEndDate(formattedDate);
              clearError('endDate');
            }}
            allowFutureDates={true}
            error={errors.endDate}
          />

          <Input
            title={
              LocalizedStrings.LeaveApplications?.Reason || 'Reason for Absence'
            }
            placeholder={
              LocalizedStrings.LeaveApplications?.Reason_Placeholder ||
              'Please describe your reason in detail...'
            }
            value={reason}
            onChange={value => {
              setReason(value);
              clearError('reason');
            }}
            style_inputContainer={{ height: 100 }}
            style_input={{ textAlign: 'start' }}
            multiline={true}
            numberOfLines={4}
            error={errors.reason}
          />

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          onPress={handleSubmit}
          title={
            LocalizedStrings.LeaveApplications?.Submit_Leave_Request ||
            'Submit Leave Request'
          }
          main_style={styles.button}
          loader={loading}
        />
      </View>
    </CommanView>
  );
};

export default ApplyLeave;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#EBEBEA',
    zIndex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  button: {
    width: '100%',
  },
  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  blockedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#EBEBEA',
    alignItems: 'center',
  },
  blockedIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  blockedIcon: {
    width: 28,
    height: 28,
    tintColor: '#B45309',
  },
  blockedTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  blockedMessage: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  blockedInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  blockedLabel: {
    fontSize: 13,
    color: '#888',
  },
  warningBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  blockedStatusTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
