import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import { ImageConstant } from '../../Constants/ImageConstant';
import { Font } from '../../Constants/Font';
import Typography from '../../Component/UI/Typography';
import Button from '../../Component/Button';
import { calculateGst } from '../../Utils/gst';
import { POST_WITH_TOKEN, GET_WITH_TOKEN } from '../../Backend/Backend';
import { SUBSCRIPTIONS_BY_ROLE, SUBSCRIPTIONS, SUBSCRIBE_PLAN, SUBSCRIPTION_USER_VERIFY, SUBSCRIPTION_USER_SUBSCRIBE, SUBSCRIPTION_USER_CREATE_ORDER, ReferralCode } from '../../Backend/api_routes';
import { useSelector } from 'react-redux';
import SimpleToast from 'react-native-simple-toast';
import LocalizedStrings from '../../Constants/localization';
import { initiatePayment } from '../../Services/RazorpayService';

const ChoosePlan = ({ navigation, route }) => {
  const userDetail = useSelector(store => store?.userDetails);
  const userTypeFromRoute = route?.params?.userType;
  const userTypeFromStore = useSelector(store => store?.userType);
  const normalizeRoleId = value => {
    const normalized = String(value ?? '').toLowerCase();
    if (normalized === '2' || normalized === 'staff') return 2;
    if (
      normalized === '3' ||
      normalized === 'house' ||
      normalized === 'householder' ||
      normalized === 'house_owner'
    ) {
      return 3;
    }
    return 3;
  };
  const currentUserType = normalizeRoleId(
    userTypeFromRoute || userDetail?.user_role_id || userTypeFromStore,
  );
  const autoFreeOnMount = route?.params?.autoFreeOnMount === true;
  const autoSubscribedRef = useRef(false);

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  const requestWithRetry = async (requester, attempts = 2) => {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await requester();
      } catch (error) {
        lastError = error;
        if (attempt < attempts) {
          await wait(700);
        }
      }
    }
    throw lastError;
  };

  const getWithTokenRequest = routeName =>
    new Promise((resolve, reject) => {
      GET_WITH_TOKEN(
        routeName,
        resolve,
        error => reject({ kind: 'api', error }),
        fail => reject({ kind: 'network', error: fail }),
      );
    });

  const postWithTokenRequest = (routeName, payload) =>
    new Promise((resolve, reject) => {
      POST_WITH_TOKEN(
        routeName,
        payload,
        resolve,
        error => reject({ kind: 'api', error }),
        fail => reject({ kind: 'network', error: fail }),
      );
    });

  // Auto-subscribe new staff users (role 2) to the free plan right after signup,
  // so they skip the membership screen on first entry. When the free plan expires,
  // gated screens (JobDetails / AIJobSearch) route back here WITHOUT autoFreeOnMount,
  // so the full plan list is shown instead.
  useEffect(() => {
    if (!autoFreeOnMount) return;
    if (String(currentUserType) !== '2') return;
    if (autoSubscribedRef.current) return;
    if (loading) return;

    autoSubscribedRef.current = true;

    const freePlan = subscriptions.find(
      p => !p?.price || p.price === '0' || p.price === '0.00',
    );

    if (freePlan) {
      subscribeToPlan(freePlan, true);
      return;
    }
    SimpleToast.show('No free plan available for staff. Please select a plan.', SimpleToast.LONG);
    autoSubscribedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions, loading, currentUserType, autoFreeOnMount]);

  const filterByRole = (plans, roleId) => {
    if (!plans || !Array.isArray(plans)) return [];
    const filtered = plans.filter(plan => {
      const planRole = plan?.role_id || plan?.user_role_id;
      // Keep plan if it matches user's role, or if plan has no role set
      return !planRole || String(planRole) === String(roleId);
    });
    return filtered.length > 0 ? filtered : plans;
  };

  const readPlans = response => (Array.isArray(response?.data) ? response.data : []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setFetchError('');
    const roleId = currentUserType;

    try {
      let plans = [];

      try {
        const roleResponse = await requestWithRetry(
          () => postWithTokenRequest(SUBSCRIPTIONS_BY_ROLE, { role_id: roleId }),
          2,
        );
        plans = filterByRole(readPlans(roleResponse), roleId);
      } catch (roleError) {
        plans = [];
      }

      if (!plans.length) {
        const allResponse = await requestWithRetry(
          () => getWithTokenRequest(SUBSCRIPTIONS),
          2,
        );
        plans = filterByRole(readPlans(allResponse), roleId);
      }

      setSubscriptions(plans);
      setFetchError(plans.length ? '' : 'No subscriptions available');
    } catch (error) {
      setSubscriptions([]);
      setFetchError('Could not load plans. Please tap Retry.');
      SimpleToast.show('Could not load plans. Please try again.', SimpleToast.SHORT);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = price => {
    if (!price || price === '0' || price === '0.00') return 'FREE';
    return `₹${price}`;
  };

  const formatValidity = (validity, type) => {
    if (type) {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
    if (!validity) return '';
    if (typeof validity === 'number') return `${validity} days`;
    return validity.charAt(0).toUpperCase() + validity.slice(1);
  };

  const proceedToApp = () => {
    navigation.navigate('ApplyReferral', { isFirstTime: true });
  };

  const handleSelectPlan = async subscription => {
    if (paymentLoading) return;

    const isFree = !subscription.price || subscription.price === '0' || subscription.price === '0.00';
    if (isFree) {
      subscribeToPlan(subscription);
      return;
    }

    const price = parseFloat(subscription.price);
    const { baseAmount, gstAmount, totalAmount } = calculateGst(price);

    setPaymentLoading(true);
    let walletBalance = 0;
    try {
      const referralResponse = await requestWithRetry(() => getWithTokenRequest(ReferralCode), 1);
      walletBalance = parseFloat(referralResponse?.data?.total_earnings || referralResponse?.data?.points_balance || '0');
    } catch (e) {
      console.log('Failed to fetch wallet balance', e);
    }
    setPaymentLoading(false);

    if (walletBalance > 0) {
      Alert.alert(
        'Credit Discount Available',
        `You have \u20B9${walletBalance.toFixed(2)} credits available.\n\nPlan Total (incl. GST): \u20B9${totalAmount.toFixed(2)}\n\nDo you want to use your credits for a discount?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'No', onPress: () => processPayment(subscription, false) },
          { text: 'Yes, Use Credits', onPress: () => processPayment(subscription, true) },
        ]
      );
    } else {
      Alert.alert(
        'Confirm Payment',
        `${subscription.subscription_name}\n\nBase Price: \u20B9${baseAmount.toFixed(2)}\nGST (18%): \u20B9${gstAmount.toFixed(2)}\nTotal: \u20B9${totalAmount.toFixed(2)}\n\nDo you want to proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Pay Now', onPress: () => processPayment(subscription, false) },
        ],
      );
    }
  };

  const processPayment = async (subscription, useWallet = false) => {
    setPaymentLoading(true);
    setSelectedPlanId(subscription.id);

    try {
      POST_WITH_TOKEN(
        SUBSCRIPTION_USER_CREATE_ORDER,
        { subscription_id: subscription.id, use_wallet: useWallet ? 1 : 0 },
        async (orderSuccess) => {
          if (orderSuccess?.status) {
            // Check if it was fully paid by wallet (zero payment)
            if (orderSuccess.message === 'Payment verified successfully and subscription activated.' || !orderSuccess.order_id) {
               setPaymentLoading(false);
               setSelectedPlanId(null);
               SimpleToast.show('Subscription activated successfully using credits!', SimpleToast.LONG);
               proceedToApp();
               return;
            }

            if (orderSuccess.order_id) {
              try {
                let result;
                try {
                  const finalAmount = parseFloat(orderSuccess.amount || '0');
                  result = await initiatePayment({
                    amount: Math.round(finalAmount * 100),
                    currency: 'INR',
                    orderId: orderSuccess.order_id,
                    description: `${subscription.subscription_name} Membership (incl. GST)`,
                    prefill: {
                      name: userDetail?.first_name
                        ? `${userDetail.first_name} ${userDetail.last_name || ''}`
                        : userDetail?.name || '',
                      email: String(userDetail?.email || '').replace(/_deleted_\d+$/, ''),
                      contact: userDetail?.phone || userDetail?.mobile || userDetail?.phone_number || '',
                    },
                  });
                } catch (razorpayErr) {
                  result = { success: false, code: -99, description: 'Razorpay unavailable' };
                }

                if (result.success) {
                  verifyAndActivate(result, orderSuccess.subscription_user_id);
                } else {
                  setPaymentLoading(false);
                  setSelectedPlanId(null);
                  if (result.code === 0 || result.code === 2) {
                    SimpleToast.show('Payment cancelled', SimpleToast.SHORT);
                  } else {
                    SimpleToast.show(result.description || 'Payment failed.', SimpleToast.SHORT);
                  }
                }
              } catch (paymentErr) {
                setPaymentLoading(false);
                setSelectedPlanId(null);
                SimpleToast.show('Payment failed. Please try again.', SimpleToast.SHORT);
              }
            } else {
              setPaymentLoading(false);
              setSelectedPlanId(null);
              SimpleToast.show('Failed to create order (missing order_id).', SimpleToast.SHORT);
            }
          } else {
            setPaymentLoading(false);
            setSelectedPlanId(null);
            SimpleToast.show(orderSuccess?.message || 'Failed to create order.', SimpleToast.SHORT);
          }
        },
        (orderError) => {
          setPaymentLoading(false);
          setSelectedPlanId(null);
          SimpleToast.show(orderError?.message || 'Failed to create order.', SimpleToast.SHORT);
        },
        () => {
          setPaymentLoading(false);
          setSelectedPlanId(null);
          SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
        }
      );
    } catch (error) {
      setPaymentLoading(false);
      setSelectedPlanId(null);
      SimpleToast.show('Payment failed. Please try again.', SimpleToast.SHORT);
    }
  };

  const verifyAndActivate = (paymentResult, subscriptionUserId) => {
    POST_WITH_TOKEN(
      SUBSCRIPTION_USER_VERIFY,
      {
        razorpay_order_id: paymentResult.orderId,
        razorpay_payment_id: paymentResult.paymentId,
        razorpay_signature: paymentResult.signature,
        subscription_user_id: subscriptionUserId,
      },
      (success) => {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show('Subscription activated successfully!', SimpleToast.LONG);
        proceedToApp();
      },
      (error) => {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show(
          error?.message || 'Payment received but activation failed. Please contact support.',
          SimpleToast.LONG,
        );
      },
      () => {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      }
    );
  };


  const subscribeToPlan = async (subscription, isAuto = false) => {
    if (paymentLoading) return;

    setPaymentLoading(true);
    setSelectedPlanId(subscription.id);

    try {
      const success = await requestWithRetry(
        () => postWithTokenRequest(
          SUBSCRIPTION_USER_SUBSCRIBE,
          {
            subscriptionId: subscription.id,
            paymentId: null,
            role_id: currentUserType,
          },
        ),
        2,
      );

      setPaymentLoading(false);
      setSelectedPlanId(null);
      SimpleToast.show(
        success?.message || 'Subscription activated successfully!',
        SimpleToast.LONG,
      );
      proceedToApp();
    } catch (primaryError) {
      try {
        await requestWithRetry(
          () => postWithTokenRequest(
            SUBSCRIBE_PLAN,
            {
              subscription_id: subscription.id,
              payment_id: null,
              payment_status: 'free',
              amount: '0',
              role_id: currentUserType,
            },
          ),
          1,
        );

        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show('Subscription activated successfully!', SimpleToast.LONG);
        proceedToApp();
      } catch (fallbackError) {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        if (isAuto) {
          autoSubscribedRef.current = false;
        }
        const message =
          fallbackError?.error?.data?.message ||
          fallbackError?.error?.message ||
          primaryError?.error?.data?.message ||
          primaryError?.error?.message ||
          'Could not activate subscription. Please try again.';
        SimpleToast.show(message, SimpleToast.SHORT);
      }
    }
  };

  return (
    <CommanView>
      <HeaderForUser
        title={
          LocalizedStrings.EditProfile?.Choose_Plan || 'Choose Your Plan'
        }
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation?.goBack()}
        style_title={styles.headerTitle}
      />

      {loading || (autoFreeOnMount && String(currentUserType) === '2' && !autoSubscribedRef.current) ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#D98579" />
        </View>
      ) : subscriptions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Typography type={Font.Poppins_Medium} style={styles.emptyText}>
            {fetchError || 'No subscriptions available'}
          </Typography>
          {fetchError && fetchError !== 'No subscriptions available' ? (
            <Button
              title="Retry"
              main_style={styles.retryButton}
              onPress={fetchSubscriptions}
            />
          ) : null}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {subscriptions.map((subscription, index) => {
            const extra = subscription?.extra;
            let featureArray = [];
            if (Array.isArray(extra)) {
              featureArray = extra
                .map(item => {
                  const value =
                    item && typeof item === 'object'
                      ? item?.feature ?? item?.name ?? item?.label
                      : item;
                  return typeof value === 'string' || typeof value === 'number'
                    ? String(value).trim()
                    : '';
                })
                .filter(Boolean);
            } else if (extra && typeof extra === 'object') {
              featureArray = Object.keys(extra)
                .filter(key => key !== 'key_word')
                .map(key => {
                  const value = extra[key];
                  return typeof value === 'string' || typeof value === 'number'
                    ? String(value).trim()
                    : '';
                })
                .filter(Boolean);
            }

            return (
              <View key={subscription.id || index} style={styles.premiumCard}>
                <View style={styles.rowBetween}>
                  <View>
                    <Typography
                      type={Font.Poppins_Bold}
                      style={styles.premiumTitle}
                    >
                      {subscription.subscription_name || 'Plan'}
                    </Typography>
                    <Typography style={styles.price}>
                      {formatPrice(subscription.price)}
                      {(subscription.type || subscription.validity) &&
                        ` / ${formatValidity(subscription.validity, subscription.type)}`}
                    </Typography>
                    {subscription.price > 0 && (
                      <Typography type={Font.Poppins_Regular} style={{ fontSize: 11, color: '#999' }}>
                        Incl. 18% GST (₹{calculateGst(parseFloat(subscription.price)).baseAmount.toFixed(2)} + ₹{calculateGst(parseFloat(subscription.price)).gstAmount.toFixed(2)} GST)
                      </Typography>
                    )}
                  </View>
                  {subscription.extra?.key_word === 'best' && (
                    <Image
                      source={ImageConstant.win}
                      style={styles.iconSmall}
                    />
                  )}
                </View>

                <Typography
                  type={Font.Poppins_Light}
                  style={{ marginVertical: 10 }}
                >
                  {subscription.description ||
                    'Access to all premium features including advanced scheduling and multi-device sync.'}
                </Typography>

                {featureArray.length > 0 ? (
                  featureArray.map((item, idx) => (
                    <View key={idx} style={styles.row}>
                      <Image
                        source={ImageConstant.correct}
                        style={styles.bulletIcon}
                      />
                      <Typography style={styles.benefit}>{item}</Typography>
                    </View>
                  ))
                ) : (
                  <Typography style={styles.benefit}>
                    No features listed
                  </Typography>
                )}

                <View style={styles.planButtons}>
                  <Button
                    title={
                      paymentLoading && selectedPlanId === subscription.id
                        ? 'Processing...'
                        : 'Select Plan'
                    }
                    main_style={styles.upgradeBtn}
                    onPress={() => handleSelectPlan(subscription)}
                    disabled={paymentLoading}
                    loader={
                      paymentLoading && selectedPlanId === subscription.id
                    }
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </CommanView>
  );
};

export default ChoosePlan;

const styles = StyleSheet.create({
  headerTitle: { fontSize: 18 },
  scrollContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    width: 140,
    marginTop: 16,
  },
  premiumCard: {
    backgroundColor: '#EBEBEA',
    borderRadius: 12,
    padding: 16,
    marginTop: 15,
    marginBottom: 10,
    width: '95%',
  },
  premiumTitle: {
    fontSize: 16,
    marginBottom: 5,
  },
  price: {
    fontSize: 15,
    color: '#E87C6F',
    marginBottom: 10,
  },
  benefit: {
    fontSize: 14,
    marginVertical: 2,
  },
  planButtons: {
    marginTop: 15,
  },
  upgradeBtn: { width: '100%' },
  bulletIcon: {
    width: 15,
    height: 15,
    tintColor: '#D98579',
    marginRight: 6,
  },
  iconSmall: {
    width: 20,
    height: 30,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
