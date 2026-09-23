import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Image } from 'react-native';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import Input from '../../Component/Input';
import Button from '../../Component/Button';
import { ImageConstant } from '../../Constants/ImageConstant';
import LocalizedStrings from '../../Constants/localization';
import { GET_WITH_TOKEN, POST_WITH_TOKEN } from '../../Backend/Backend';
import Date_Picker from '../../Component/Date_Picker';
import { QuitJob as QuitJobRoute, myWork } from '../../Backend/api_routes';
import moment from 'moment';
import SimpleToast from 'react-native-simple-toast';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUIT_REQUEST_KEY = 'active_quit_request';

const QuitJob = ({ navigation, route }) => {
  const jobId = route?.params?.jobId || route?.params?.job_id;
  const isFocused = useIsFocused();

  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeQuitRequest, setActiveQuitRequest] = useState(null);
  const [checkingQuit, setCheckingQuit] = useState(true);
  const [errors, setErrors] = useState({
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    if (isFocused) {
      checkExistingQuitRequest();
    }
  }, [isFocused]);

  const checkExistingQuitRequest = async () => {
    setCheckingQuit(true);

    // Step 1: Check AsyncStorage for locally saved quit request (24hr cooldown)
    try {
      const stored = await AsyncStorage.getItem(QUIT_REQUEST_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const submittedAt = parsed?.submitted_at;
        const hoursSince = submittedAt
          ? (Date.now() - submittedAt) / (1000 * 60 * 60)
          : 999;
        if (parsed && hoursSince < 24) {
          setActiveQuitRequest(parsed);
          setCheckingQuit(false);
          return;
        }
        // Expired — clear old entry
        await AsyncStorage.removeItem(QUIT_REQUEST_KEY);
      }
    } catch (e) {
      // AsyncStorage read failed, continue to API check
    }

    // Step 2: Try GET on quit-job-request endpoint
    GET_WITH_TOKEN(
      QuitJobRoute,
      success => {
        const requests = success?.data || [];
        const arr = Array.isArray(requests) ? requests : [];
        const active = arr.find(req => {
          const status = (req?.status || '').toString().toLowerCase();
          return status === 'pending' || status === 'approved';
        });
        if (active) {
          const withTimestamp = { ...active, submitted_at: active.submitted_at || Date.now() };
          setActiveQuitRequest(withTimestamp);
          AsyncStorage.setItem(QUIT_REQUEST_KEY, JSON.stringify(withTimestamp)).catch(() => {});
        }
        setCheckingQuit(false);
      },
      () => {
        // GET not supported or error — just finish
        setCheckingQuit(false);
      },
      () => {
        setCheckingQuit(false);
      },
    );
  };

  const clearError = field => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      endDate: '',
      reason: '',
    };
    let hasError = false;

    if (!endDate || endDate.trim() === '') {
      newErrors.endDate = 'End date field is required.';
      hasError = true;
    } else {
      const dateMoment = moment(
        endDate,
        ['YYYY-MM-DD', 'DD-MM-YYYY', moment.ISO_8601],
        true,
      );
      if (!dateMoment.isValid()) {
        newErrors.endDate = 'Invalid date format.';
        hasError = true;
      } else {
        const today = moment();
        if (dateMoment.isBefore(today, 'day')) {
          newErrors.endDate = 'End date cannot be in the past.';
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

    if (!validateForm()) {
      SimpleToast.show(
        'Please fill all required fields correctly',
        SimpleToast.SHORT,
      );
      return;
    }

    setLoading(true);

    const endDateFormatted =
      typeof endDate === 'string'
        ? moment(endDate, ['YYYY-MM-DD', 'DD-MM-YYYY'], true).format(
            'YYYY-MM-DD',
          )
        : moment(endDate).format('YYYY-MM-DD');

    const body = {
      end_date: endDateFormatted,
      reason: reason.trim(),
    };
    if (jobId) {
      body.job_id = jobId;
    }

    POST_WITH_TOKEN(
      QuitJobRoute,
      body,
      success => {
        setLoading(false);
        // Save quit request locally with timestamp — blocked for 24 hours
        const savedRequest = {
          job_id: jobId,
          end_date: endDateFormatted,
          reason: reason.trim(),
          status: 'pending',
          submitted_at: Date.now(),
          ...(success?.data || {}),
        };
        AsyncStorage.setItem(QUIT_REQUEST_KEY, JSON.stringify(savedRequest)).catch(() => {});
        setActiveQuitRequest(savedRequest);
        SimpleToast.show(
          success?.message || 'Quit job request submitted successfully!',
          SimpleToast.SHORT,
        );
        navigation.navigate('TabNavigationForStaff', { screen: 'My Work' });
      },
      error => {
        setLoading(false);
        const errorMessage =
          error?.message ||
          error?.data?.message ||
          error?.response?.data?.message ||
          'Failed to submit quit job request. Please try again.';
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

  // Blocked screen — already has an active quit request (within 24hr)
  if (activeQuitRequest && !checkingQuit) {
    const isPending = (activeQuitRequest?.status || '').toString().toLowerCase() === 'pending';
    const hoursLeft = activeQuitRequest?.submitted_at
      ? Math.max(0, Math.ceil(24 - (Date.now() - activeQuitRequest.submitted_at) / (1000 * 60 * 60)))
      : 0;
    return (
      <CommanView>
        <HeaderForUser
          source_arrow={ImageConstant?.BackArrow}
          onPressLeftIcon={() => navigation.goBack()}
          title={
            LocalizedStrings.staffSection?.RequestLeaveQuit?.request_quit_job ||
            'Request to Quit Job'
          }
          style_title={{ fontSize: 18 }}
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
                ? 'Quit Request Already Submitted'
                : 'Quit Request Approved'}
            </Typography>
            <Typography
              type={Font.Poppins_Regular}
              style={styles.blockedMessage}
            >
              {isPending
                ? `You have already submitted a quit job request. You can submit a new request after ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}.`
                : 'Your quit job request has been approved. No further action is needed.'}
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
                  {activeQuitRequest?.status}
                </Typography>
              </View>
            </View>

            {activeQuitRequest?.end_date ? (
              <View style={styles.blockedInfoRow}>
                <Typography type={Font.Poppins_Regular} style={styles.blockedLabel}>
                  End Date
                </Typography>
                <Typography type={Font.Poppins_Medium} style={{ fontSize: 13 }}>
                  {moment(activeQuitRequest.end_date).format('DD MMM YYYY')}
                </Typography>
              </View>
            ) : null}

            {activeQuitRequest?.reason ? (
              <View style={styles.blockedInfoRow}>
                <Typography type={Font.Poppins_Regular} style={styles.blockedLabel}>
                  Reason
                </Typography>
                <Typography
                  type={Font.Poppins_Regular}
                  style={{ fontSize: 13, flex: 1, textAlign: 'right' }}
                  numberOfLines={2}
                >
                  {activeQuitRequest.reason}
                </Typography>
              </View>
            ) : null}

            <Button
              onPress={() => navigation.goBack()}
              title="Go Back"
              main_style={[styles.button, { marginTop: 20 }]}
            />
          </View>
        </View>
      </CommanView>
    );
  }

  return (
    <CommanView>
      <HeaderForUser
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
        title={
          LocalizedStrings.staffSection?.RequestLeaveQuit?.request_quit_job ||
          'Request to Quit Job'
        }
        style_title={{ fontSize: 18 }}
      />

      <View style={styles.card}>
        <Date_Picker
          title={
            LocalizedStrings.staffSection?.RequestLeaveQuit?.end_date ||
            'End Date'
          }
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
            LocalizedStrings.staffSection?.RequestLeaveQuit?.reason_to_quit ||
            'Reason to Quit'
          }
          placeholder={
            LocalizedStrings.staffSection?.RequestLeaveQuit
              ?.reason_placeholder ||
            'Please describe your reason in detail...'
          }
          value={reason}
          onChange={value => {
            setReason(value);
            clearError('reason');
          }}
          style_inputContainer={{ height: 120 }}
          style_input={{ textAlign: 'start', height: 120 }}
          multiline={true}
          numberOfLines={4}
          error={errors.reason}
        />

        <Button
          onPress={handleSubmit}
          title={'Submit Quit Request'}
          main_style={[styles.button, { marginTop: 20 }]}
          loader={loading}
        />
      </View>
    </CommanView>
  );
};

export default QuitJob;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#EBEBEA',
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
  blockedStatusTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
