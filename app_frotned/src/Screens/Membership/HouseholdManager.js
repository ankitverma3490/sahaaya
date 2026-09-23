import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import HeaderForUser from '../../Component/HeaderForUser';
import CommanView from '../../Component/CommanView';
import { Font } from '../../Constants/Font';
import Typography from '../../Component/UI/Typography';
import { ImageConstant } from '../../Constants/ImageConstant';
import Button from '../../Component/Button';
import { calculateGst } from '../../Utils/gst';
import { POST_WITH_TOKEN, GET_WITH_TOKEN } from '../../Backend/Backend';
import { SUBSCRIPTIONS_BY_ROLE, SUBSCRIPTIONS, SUBSCRIBE_PLAN, SUBSCRIPTION_USER_CURRENT, SUBSCRIPTION_USER_SUBSCRIBE, SUBSCRIPTION_USER_CREATE_ORDER, SUBSCRIPTION_USER_VERIFY, ReferralCode, PROFILE } from '../../Backend/api_routes';
import { useSelector } from 'react-redux';
import SimpleToast from 'react-native-simple-toast';
import LocalizedStrings from '../../Constants/localization';
import { initiatePayment } from '../../Services/RazorpayService';
import {
  getSubscriptionPlanId,
  hasActivePaidSubscription,
  isFreeSubscriptionPlan,
} from '../../Utils/subscription';
import { notifySubscriptionUpdated } from '../../Utils/subscriptionEvents';

const HouseholdManager = ({ navigation }) => {
  const userDetail = useSelector(store => store?.userDetails);
  const userType = useSelector(store => store?.userType);

  const [subscriptions, setSubscriptions] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentPlanLoading, setCurrentPlanLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const currentPlanRequestId = useRef(0);

  const handleActivatedPlan = (subscription, response) => {
    const activatedSubscription =
      response?.subscription ||
      response?.data?.subscription ||
      response?.data ||
      null;
    const immediatePlan = activatedSubscription || {
      status: 'active',
      amount: subscription?.price || 0,
      payment_status: Number(subscription?.price || 0) > 0 ? 'paid' : 'free',
      subscription,
    };

    setCurrentPlan(immediatePlan);
    notifySubscriptionUpdated({
      subscription: immediatePlan,
      plan: subscription,
      is_active: true,
    });
    fetchCurrentPlan({preserveOnError: true});
  };

  useEffect(() => {
    fetchCurrentPlan();
    fetchSubscriptions();
    fetchWalletBalance();
    fetchUserProfile();
    // Membership data is loaded once whenever this screen is mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserProfile = () => {
    GET_WITH_TOKEN(
      PROFILE,
      res => {
        const u = res?.data || res?.user || res;
        if (u && typeof u === 'object') {
          setUserProfile(u);
        }
      },
      () => {},
      () => {},
    );
  };

  const fetchWalletBalance = () => {
    GET_WITH_TOKEN(
      ReferralCode,
      success => {
        const balance = parseFloat(success?.data?.wallet_balance || 0);
        setWalletBalance(balance > 0 ? balance : 0);
      },
      () => {},
      () => {},
    );
  };

  const fetchCurrentPlan = ({preserveOnError = false} = {}) => {
    const requestId = ++currentPlanRequestId.current;
    GET_WITH_TOKEN(
      `${SUBSCRIPTION_USER_CURRENT}?refresh=${Date.now()}`,
      success => {
        if (requestId !== currentPlanRequestId.current) return;
        setCurrentPlanLoading(false);
        const plan = success?.subscription || success?.data;
        setCurrentPlan(plan || null);
        if (plan) {
          notifySubscriptionUpdated({
            subscription: plan,
            plan: plan?.subscription,
            is_active: true,
          });
        }
      },
      error => {
        if (requestId !== currentPlanRequestId.current) return;
        setCurrentPlanLoading(false);
        if (!preserveOnError) setCurrentPlan(null);
      },
      fail => {
        if (requestId !== currentPlanRequestId.current) return;
        setCurrentPlanLoading(false);
        if (!preserveOnError) setCurrentPlan(null);
      },
      {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    );
  };

  const fetchAllSubscriptions = () => {
    GET_WITH_TOKEN(
      SUBSCRIPTIONS,
      success => {
        setLoading(false);
        const subscriptionData = success?.data;
        if (subscriptionData && Array.isArray(subscriptionData)) {
          setSubscriptions(subscriptionData);
        } else {
          setSubscriptions([]);
        }
      },
      error => {
        setLoading(false);
        SimpleToast.show('Failed to fetch subscriptions', SimpleToast.SHORT);
        setSubscriptions([]);
      },
      fail => {
        setLoading(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
        setSubscriptions([]);
      },
    );
  };

  const fetchSubscriptions = () => {
    setLoading(true);
    const payload = { role_id: userType };

    POST_WITH_TOKEN(
      SUBSCRIPTIONS_BY_ROLE,
      payload,
      success => {

        const subscriptionData = success?.data;
        if (subscriptionData && Array.isArray(subscriptionData) && subscriptionData.length > 0) {
          setLoading(false);
          setSubscriptions(subscriptionData);
        } else {
          fetchAllSubscriptions();
        }
      },
      error => {

        fetchAllSubscriptions();
      },
      fail => {
        setLoading(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
        setSubscriptions([]);
      },
    );
  };

  const formatPrice = price => {
    if (!price || price === '0' || price === '0.00') return 'FREE';
    return `₹${price}`;
  };

  const formatValidity = (validity, type) => {
    if (type) return type.charAt(0).toUpperCase() + type.slice(1);
    if (!validity) return '';
    if (typeof validity === 'number') return `${validity} days`;
    return validity.charAt(0).toUpperCase() + validity.slice(1);
  };

  const handleSelectPlan = async subscription => {
    if (
      !subscription.price ||
      subscription.price === '0' ||
      subscription.price === '0.00'
    ) {
      subscribeToPlan(subscription, null);
      return;
    }

    const price = parseFloat(subscription.price);
    const { baseAmount, gstAmount, totalAmount } = calculateGst(price);

    const creditApplied = Math.min(walletBalance, totalAmount);
    const payable = totalAmount - creditApplied;

    if (walletBalance > 0 && creditApplied >= totalAmount) {
      Alert.alert(
        'Confirm with Credits',
        `${subscription.subscription_name}\n\nTotal (incl. 18% GST): ₹${totalAmount.toFixed(2)}\nCredits to apply: ₹${creditApplied.toFixed(2)}\nAmount to pay: ₹0.00\n\nYour credits fully cover this plan. Proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Pay with Credits', onPress: () => processPayment(subscription, true) },
        ],
      );
      return;
    }

    const creditsNote =
      walletBalance > 0
        ? `\nCredits to apply: ₹${creditApplied.toFixed(2)}\nAmount to pay: ₹${payable.toFixed(2)}`
        : '';

    Alert.alert(
      'Confirm Payment',
      `${subscription.subscription_name}\n\nBase Price: ₹${baseAmount.toFixed(2)}\nGST (18%): ₹${gstAmount.toFixed(2)}\nTotal: ₹${totalAmount.toFixed(2)}${creditsNote}\n\nDo you want to proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: () => processPayment(subscription) },
      ],
    );
  };

  const processPayment = async (subscription, useCreditsOnly = false) => {
    setPaymentLoading(true);
    setSelectedPlanId(subscription.id);

    try {
      const price = parseFloat(subscription.price);
      const { totalAmount } = calculateGst(price);

      POST_WITH_TOKEN(
        SUBSCRIPTION_USER_CREATE_ORDER,
        { subscription_id: subscription.id },
        async (orderSuccess) => {
          // Wallet-funded zero-payment path — backend activates subscription directly
          if (orderSuccess?.subscription || (orderSuccess?.status && !orderSuccess?.order_id)) {
            setPaymentLoading(false);
            setSelectedPlanId(null);
            handleActivatedPlan(subscription, orderSuccess);
            setWalletBalance(0);
            SimpleToast.show(
              orderSuccess?.message ||
                'Subscription activated with credits successfully!',
              SimpleToast.LONG,
            );
            return;
          }

          if (orderSuccess?.status && orderSuccess?.order_id) {
            try {
              const result = await initiatePayment({
                amount: Math.round(totalAmount * 100),
                currency: 'INR',
                orderId: orderSuccess.order_id,
                description: `${subscription.subscription_name} Membership (incl. GST)`,
                prefill: {
                  name: userDetail?.first_name
                    ? `${userDetail.first_name} ${userDetail.last_name || ''}`
                    : userDetail?.name || userProfile?.name || 'Customer',
                  email: String(userDetail?.email || userDetail?.user?.email || userDetail?.data?.email || userProfile?.email || userProfile?.user?.email || '').replace(/_deleted_\d+$/, ''),
                  contact: userDetail?.phone || userDetail?.mobile || userDetail?.phone_number || userProfile?.phone_number || userProfile?.phone || '',
                },
              });

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
        fetchCurrentPlan();
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

  const subscribeToPlan = (subscription) => {
    setPaymentLoading(true);
    setSelectedPlanId(subscription.id);

    POST_WITH_TOKEN(
      SUBSCRIPTION_USER_SUBSCRIBE,
      { subscriptionId: subscription.id, paymentId: null },
      success => {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show(success?.message || 'Subscription activated successfully!', SimpleToast.LONG);
        handleActivatedPlan(subscription, success);
      },
      error => {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        const msg = error?.data?.message || error?.message || 'Failed to activate subscription.';
        SimpleToast.show(msg, SimpleToast.SHORT);
      },
      fail => {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const hasPaidPlan = hasActivePaidSubscription(currentPlan);
  const visibleSubscriptions = subscriptions.filter(
    subscription => !(hasPaidPlan && isFreeSubscriptionPlan(subscription)),
  );
  const currentPlanId = getSubscriptionPlanId(currentPlan);

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.EditProfile?.Choose_Plan || 'Choose Your Plan'}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation?.goBack()}
        source_logo={ImageConstant?.notification}
        onPressRightIcon={() => navigation.navigate('Notification')}
        style_title={styles.headerTitle}
      />

      {loading || currentPlanLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#D98579" />
        </View>
      ) : subscriptions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Typography type={Font.Poppins_Medium} style={styles.emptyText}>
            {LocalizedStrings.EditProfile?.No_subscriptions ||
              'No subscriptions available'}
          </Typography>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {currentPlan && (
            <View style={styles.currentPlanCard}>
              <View style={styles.currentPlanBadge}>
                <Typography type={Font.Poppins_Bold} style={styles.currentPlanBadgeText}>
                  Current Plan
                </Typography>
              </View>
              <Typography type={Font.Poppins_Bold} style={styles.currentPlanName}>
                {currentPlan.subscription_name || currentPlan.subscription?.subscription_name || currentPlan.name || 'Active Plan'}
              </Typography>
              <Typography type={Font.Poppins_Regular} style={styles.currentPlanPrice}>
                {formatPrice(
                  currentPlan?.subscription?.price ??
                  currentPlan?.price ??
                  currentPlan?.amount
                )}
                {(currentPlan?.subscription?.type || currentPlan?.subscription?.validity || currentPlan?.type || currentPlan?.validity) &&
                  ` / ${formatValidity(
                    currentPlan?.subscription?.validity ?? currentPlan?.validity,
                    currentPlan?.subscription?.type ?? currentPlan?.type
                  )}`}
              </Typography>
              <Typography type={Font.Poppins_Regular} style={styles.currentPlanDateText}>
                Order: {currentPlan.order_number || ''}
              </Typography>
              {(currentPlan.start_date || currentPlan.end_date) && (
                <View style={styles.currentPlanDates}>
                  {currentPlan.start_date && (
                    <Typography type={Font.Poppins_Regular} style={styles.currentPlanDateText}>
                      Start: {new Date(currentPlan.start_date).toLocaleDateString()}
                    </Typography>
                  )}
                  {currentPlan.end_date && (
                    <Typography type={Font.Poppins_Regular} style={styles.currentPlanDateText}>
                      Expires: {new Date(currentPlan.end_date).toLocaleDateString()}
                    </Typography>
                  )}
                </View>
              )}
              <View style={styles.currentPlanStatusRow}>
                <View style={[styles.statusDot, {
                  backgroundColor:
                    (currentPlan.status || currentPlan.payment_status) === 'active' || (currentPlan.status || currentPlan.payment_status) === 'paid'
                      ? '#4CAF50' : '#FFC107'
                }]} />
                <Typography type={Font.Poppins_Medium} style={styles.currentPlanStatus}>
                  {(() => {
                    const s = currentPlan.status || currentPlan.payment_status || 'Active';
                    return s.charAt(0).toUpperCase() + s.slice(1);
                  })()}
                </Typography>
              </View>
            </View>
          )}

          <Typography type={Font.Poppins_Bold} style={styles.sectionTitle}>
            {visibleSubscriptions.length > 0 ? 'Available Plans' : ''}
          </Typography>

          {walletBalance > 0 && (
            <View style={styles.walletCard}>
              <Typography type={Font.Poppins_Medium} style={styles.walletLabel}>
                Available Credits
              </Typography>
              <Typography type={Font.Poppins_Bold} style={styles.walletValue}>
                ₹{walletBalance.toFixed(2)}
              </Typography>
              <Typography type={Font.Poppins_Regular} style={styles.walletHint}>
                Credits will be applied automatically to your plan purchase.
              </Typography>
            </View>
          )}

          {visibleSubscriptions.map((subscription, index) => {
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
                      {subscription.subscription_name ||
                        LocalizedStrings.EditProfile?.Plan ||
                        'Plan'}
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
                    LocalizedStrings.EditProfile?.Access_Features ||
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
                    {LocalizedStrings.EditProfile?.No_features ||
                      'No features listed'}
                  </Typography>
                )}

                <View style={styles.planButtons}>
                  {String(currentPlanId) === String(subscription.id) ? (
                    <View style={[styles.upgradeBtn, { backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }]}>
                      <Typography type={Font.Poppins_Bold} style={{ color: 'white', fontSize: 16 }}>
                        Active Plan
                      </Typography>
                    </View>
                  ) : (
                    <Button
                      title={
                        paymentLoading && selectedPlanId === subscription.id
                          ? 'Processing...'
                          : LocalizedStrings.EditProfile?.Select_Plan || 'Select Plan'
                      }
                      main_style={styles.upgradeBtn}
                      onPress={() => handleSelectPlan(subscription)}
                      loader={paymentLoading && selectedPlanId === subscription.id}
                    />
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </CommanView>
  );
};

export default HouseholdManager;

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
  currentPlanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '95%',
    borderWidth: 1.5,
    borderColor: '#D98579',
    marginBottom: 10,
  },
  currentPlanBadge: {
    backgroundColor: '#D98579',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  currentPlanBadgeText: {
    color: '#fff',
    fontSize: 12,
  },
  currentPlanName: {
    fontSize: 18,
    color: '#000',
    marginBottom: 4,
  },
  currentPlanPrice: {
    fontSize: 16,
    color: '#D98579',
    marginBottom: 8,
  },
  currentPlanDates: {
    backgroundColor: '#F9F3F2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  currentPlanDateText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  currentPlanStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  currentPlanStatus: {
    fontSize: 14,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#000',
    width: '95%',
    marginTop: 10,
    marginBottom: 5,
  },
  walletCard: {
    backgroundColor: '#FFF8F6',
    borderRadius: 12,
    padding: 16,
    width: '95%',
    borderWidth: 1,
    borderColor: '#D98579',
    marginBottom: 10,
  },
  walletLabel: {
    fontSize: 13,
    color: '#555',
  },
  walletValue: {
    fontSize: 20,
    color: '#D98579',
    marginVertical: 4,
  },
  walletHint: {
    fontSize: 11,
    color: '#888',
  },
});
