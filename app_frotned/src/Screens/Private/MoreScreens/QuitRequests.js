import {
  ActivityIndicator,
  StyleSheet,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import Typography from '../../../Component/UI/Typography';
import {Font} from '../../../Constants/Font';
import {ImageConstant} from '../../../Constants/ImageConstant';
import {GET_WITH_TOKEN, POST_WITH_TOKEN} from '../../../Backend/Backend';
import {
  QuitJobListOwner,
  QuitJobApprove,
  QuitJobReject,
} from '../../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import {useIsFocused} from '@react-navigation/native';
import moment from 'moment';

export default function QuitRequests({navigation}) {
  const [quitList, setQuitList] = useState([]);
  const [processingRequest, setProcessingRequest] = useState(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchQuitRequests();
    }
  }, [isFocused]);

  const fetchQuitRequests = () => {
    GET_WITH_TOKEN(
      QuitJobListOwner,
      success => {
        const data = success?.data;
        setQuitList(Array.isArray(data) ? data : []);
      },
      () => {
        setQuitList([]);
      },
      () => {
        setQuitList([]);
      },
    );
  };

  const manageQuitRequest = (type, id) => {
    if (processingRequest) return;

    const requestRoute =
      type === 'Approve' ? QuitJobApprove(id) : QuitJobReject(id);
    setProcessingRequest({id, type});
    POST_WITH_TOKEN(
      requestRoute,
      {},
      success => {
        setProcessingRequest(null);
        fetchQuitRequests();
        SimpleToast.show(
          success?.message ||
            `Quit request ${type === 'Approve' ? 'approved' : 'rejected'} successfully!`,
          SimpleToast.SHORT,
        );
      },
      error => {
        setProcessingRequest(null);
        SimpleToast.show(
          error?.data?.message ||
            error?.message ||
            'Could not update quit request.',
          SimpleToast.SHORT,
        );
      },
      () => {
        setProcessingRequest(null);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title={'Quit Job Requests'}
        navigation={navigation}
        showRightIcon={true}
        source_logo={ImageConstant?.notification}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation?.goBack()}
        onPressRightIcon={() => navigation.navigate('Notification')}
        style_title={{fontSize: 18}}
      />
      <ScrollView
        contentContainerStyle={{paddingHorizontal: 16, paddingVertical: 16}}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}>
          <Typography type={Font.Poppins_SemiBold} style={{fontSize: 17}}>
            Staff Quit Requests
          </Typography>
          {quitList?.length > 0 ? (
            <Typography type={Font.Poppins_Regular}>
              ({quitList?.length} total)
            </Typography>
          ) : null}
        </View>

        {quitList.length === 0 && (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 60,
            }}>
            <Typography size={14} color="#555" textAlign="center">
              No quit job requests found.
            </Typography>
          </View>
        )}

        {quitList.map(item => {
          const staffName = item?.user
            ? `${item.user.first_name || ''} ${item.user.last_name || ''}`.trim() ||
              item.user.name ||
              ''
            : '';
          const initials = item?.user?.first_name?.charAt(0) || '';
          const jobTitle = item?.job?.title || item?.job?.role || 'Job';
          const endDate = item?.end_date
            ? moment(item.end_date).format('DD MMM YYYY')
            : '';
          const reason = item?.reason || '';
          const status = item?.status || 'pending';

          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.headerRow}>
                <View style={styles.avatar}>
                  <Typography
                    type={Font.Poppins_SemiBold}
                    style={[styles.avatarText, {textTransform: 'capitalize'}]}>
                    {initials}
                  </Typography>
                </View>
                <View style={{flex: 1, marginLeft: 10}}>
                  <Typography type={Font.Poppins_SemiBold} style={styles.name}>
                    {staffName}
                  </Typography>
                  <Typography type={Font.Poppins_Regular} style={styles.type}>
                    {jobTitle}
                  </Typography>
                </View>
                <View
                  style={[
                    styles.statusTag,
                    {
                      backgroundColor:
                        status.toLowerCase() === 'approved'
                          ? '#A7F3D0'
                          : status.toLowerCase() === 'pending'
                          ? '#FEF3C7'
                          : '#FECACA',
                    },
                  ]}>
                  <Typography
                    type={Font.Poppins_SemiBold}
                    style={[
                      styles.statusText,
                      {
                        color:
                          status.toLowerCase() === 'approved'
                            ? '#047857'
                            : status.toLowerCase() === 'pending'
                            ? '#B45309'
                            : '#B91C1C',
                        textTransform: 'capitalize',
                      },
                    ]}>
                    {status}
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
                  End Date: {endDate}
                </Typography>
              </View>

              <View style={styles.row}>
                <Image
                  source={ImageConstant.lines}
                  style={styles.icon}
                  resizeMode="contain"
                />
                <Typography type={Font.Poppins_Regular} style={styles.reason}>
                  Reason: {reason}
                </Typography>
              </View>

              {status.toLowerCase() === 'pending' && (
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
                    onPress={() => manageQuitRequest('Reject', item?.id)}
                    disabled={processingRequest !== null}>
                    {processingRequest?.id === item?.id &&
                    processingRequest?.type === 'Reject' ? (
                      <ActivityIndicator size="small" color="#D98579" />
                    ) : (
                      <Image
                        source={ImageConstant.X}
                        style={styles.icon}
                        resizeMode="contain"
                      />
                    )}
                    <Typography
                      type={Font.Poppins_Regular}
                      style={{color: '#D98579', fontSize: 13, marginLeft: 4}}>
                      Reject
                    </Typography>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {backgroundColor: '#D98579'},
                    ]}
                    onPress={() => manageQuitRequest('Approve', item?.id)}
                    disabled={processingRequest !== null}>
                    {processingRequest?.id === item?.id &&
                    processingRequest?.type === 'Approve' ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Image
                        source={ImageConstant.correct}
                        style={styles.icon}
                        resizeMode="contain"
                      />
                    )}
                    <Typography
                      type={Font.Poppins_Regular}
                      style={{color: '#FFFFFF', fontSize: 13, marginLeft: 4}}>
                      Approve
                    </Typography>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </CommanView>
  );
}

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
  avatarText: {fontSize: 15, color: '#333'},
  name: {fontSize: 14, color: '#111'},
  type: {fontSize: 12, color: '#666'},
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  statusText: {fontSize: 12},
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
  dates: {fontSize: 12, color: '#555'},
  reason: {fontSize: 12, color: '#777', flex: 1},
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 36,
    marginHorizontal: 5,
  },
});
