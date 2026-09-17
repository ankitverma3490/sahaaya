import RazorpayCheckout from 'react-native-razorpay';
import { RAZORPAY_KEY_ID, RAZORPAY_API_URL } from '../Backend/env';
import {
  RAZORPAY_CREATE_ORDER,
  RAZORPAY_VERIFY_PAYMENT,
  RAZORPAY_CREATE_SUBSCRIPTION,
  RAZORPAY_FIND_STAFF_AI,
} from '../Backend/api_routes';

/**
 * Razorpay Payment Service
 * Handles payment processing for Staff membership and Owner salary payments
 *
 * API Endpoints (PHP Backend at RAZORPAY_API_URL):
 * - /create-order.php - Create Razorpay order
 * - /verify-payment.php - Verify payment signature
 * - /create-subscription.php - Create subscription
 * - /find-staff-ai.php - AI-powered staff search
 */

/**
 * Create Razorpay Order via Backend API
 * @param {number} amount - Amount in INR (will be converted to paise)
 * @param {string} currency - Currency code (default: INR)
 * @returns {Promise<Object>} Order details from backend
 */
export const createRazorpayOrder = async (amount, currency = 'INR') => {
  try {
    const response = await fetch(`${RAZORPAY_API_URL}${RAZORPAY_CREATE_ORDER}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount, // Amount in INR (backend converts to paise)
        currency: currency,
      }),
    });

    const data = await response.json();

    if (response.ok && data.order_id) {
      return {
        success: true,
        orderId: data.order_id,
        amount: data.amount,
        currency: data.currency,
        key: data.key,
      };
    } else {
      return {
        success: false,
        error: data.error || 'Failed to create order',
      };
    }
  } catch (error) {
    console.error('Create Order Error:', error);
    return {
      success: false,
      error: error.message || 'Network error while creating order',
    };
  }
};

/**
 * Verify Payment Signature via Backend API
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {Promise<Object>} Verification result
 */
export const verifyPaymentSignature = async (orderId, paymentId, signature) => {
  try {
    const response = await fetch(`${RAZORPAY_API_URL}${RAZORPAY_VERIFY_PAYMENT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      }),
    });

    const data = await response.json();

    return {
      success: data.success === true,
      message: data.message,
      paymentId: data.payment_id,
    };
  } catch (error) {
    console.error('Verify Payment Error:', error);
    return {
      success: false,
      message: error.message || 'Network error while verifying payment',
    };
  }
};

/**
 * Create Subscription via Backend API
 * @param {string} planName - Plan name (e.g., "Professional")
 * @returns {Promise<Object>} Subscription details
 */
export const createSubscription = async (planName) => {
  try {
    const response = await fetch(`${RAZORPAY_API_URL}${RAZORPAY_CREATE_SUBSCRIPTION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_name: planName,
      }),
    });

    const data = await response.json();

    if (response.ok && data.subscription_id) {
      return {
        success: true,
        subscriptionId: data.subscription_id,
        ...data,
      };
    } else {
      return {
        success: false,
        error: data.error || 'Failed to create subscription',
      };
    }
  } catch (error) {
    console.error('Create Subscription Error:', error);
    return {
      success: false,
      error: error.message || 'Network error while creating subscription',
    };
  }
};

/**
 * AI-powered Staff Search
 * @param {string} query - Natural language search query
 * @returns {Promise<Object>} Search results
 */
export const findStaffAI = async (query) => {
  try {
    const response = await fetch(`${RAZORPAY_API_URL}${RAZORPAY_FIND_STAFF_AI}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
      }),
    });

    const data = await response.json();

    return {
      success: data.success === true,
      aiInterpretation: data.ai_interpretation,
      resultsCount: data.results_count,
      matches: data.matches || [],
    };
  } catch (error) {
    console.error('Find Staff AI Error:', error);
    return {
      success: false,
      error: error.message || 'Network error while searching',
      matches: [],
    };
  }
};

/**
 * Initialize and open Razorpay checkout
 * @param {Object} options - Payment options
 * @param {number} options.amount - Amount in paise (INR * 100)
 * @param {string} options.currency - Currency code (default: INR)
 * @param {string} options.name - Business/App name
 * @param {string} options.description - Payment description
 * @param {string} options.orderId - Order ID from backend (optional)
 * @param {Object} options.prefill - Prefill customer details
 * @param {string} options.prefill.name - Customer name
 * @param {string} options.prefill.email - Customer email
 * @param {string} options.prefill.contact - Customer phone
 * @param {Object} options.theme - Theme customization
 * @returns {Promise} - Resolves with payment data or rejects with error
 */
export const initiatePayment = async (options) => {
  const {
    amount,
    currency = 'INR',
    name = 'Sahayya',
    description = 'Payment',
    orderId = null,
    prefill = {},
    theme = { color: '#D98579' },
    notes = {},
  } = options;

  // Ensure amount is a valid integer (in paise)
  const amountInPaise = Math.round(Number(amount) || 0);

  if (amountInPaise <= 0) {
    return {
      success: false,
      error: 'Invalid amount',
      code: -1,
      description: 'Payment amount must be greater than 0',
    };
  }

  // Format contact number - remove any non-digit characters and ensure 10 digits
  let contactNumber = (prefill.contact || '').toString().replace(/\D/g, '');
  if (contactNumber.length > 10) {
    contactNumber = contactNumber.slice(-10); // Get last 10 digits
  }

  const razorpayOptions = {
    key: RAZORPAY_KEY_ID,
    amount: amountInPaise,
    currency: currency,
    name: name,
    description: description,
    order_id: orderId, // Include order ID if provided from backend
    prefill: {
      name: prefill.name || 'Customer',
      email: (prefill.email && String(prefill.email).trim()) ? String(prefill.email).trim() : '',
      contact: contactNumber || '',
    },
    notes: notes,
    theme: theme,
  };

  // Remove order_id if null (for direct payments without backend order)
  if (!orderId) {
    delete razorpayOptions.order_id;
  }

  console.log('Razorpay Options:', JSON.stringify(razorpayOptions, null, 2));

  try {
    const data = await RazorpayCheckout.open(razorpayOptions);
    console.log('Razorpay Success:', data);
    return {
      success: true,
      paymentId: data.razorpay_payment_id,
      orderId: data.razorpay_order_id,
      signature: data.razorpay_signature,
      data: data,
    };
  } catch (error) {
    console.log('Razorpay Error:', error);
    return {
      success: false,
      error: error,
      code: error?.code,
      description: error?.description || error?.message || 'Payment failed',
    };
  }
};

/**
 * Process payment with backend order creation and verification
 * This is the recommended flow for production
 * @param {Object} options - Payment options
 * @returns {Promise<Object>} Payment result
 */
export const processPaymentWithBackend = async (options) => {
  const { amount, currency = 'INR', ...rest } = options;

  // Step 1: Create order on backend
  const orderResult = await createRazorpayOrder(amount / 100, currency); // Convert paise to INR

  if (!orderResult.success) {
    return {
      success: false,
      error: orderResult.error,
      step: 'create_order',
    };
  }

  // Step 2: Open Razorpay checkout with order ID
  const paymentResult = await initiatePayment({
    ...rest,
    amount: orderResult.amount,
    currency: orderResult.currency,
    orderId: orderResult.orderId,
  });

  if (!paymentResult.success) {
    return paymentResult;
  }

  // Step 3: Verify payment on backend
  const verifyResult = await verifyPaymentSignature(
    paymentResult.orderId,
    paymentResult.paymentId,
    paymentResult.signature
  );

  if (!verifyResult.success) {
    return {
      success: false,
      error: verifyResult.message || 'Payment verification failed',
      step: 'verify_payment',
      paymentId: paymentResult.paymentId,
    };
  }

  return {
    success: true,
    paymentId: paymentResult.paymentId,
    orderId: paymentResult.orderId,
    signature: paymentResult.signature,
    verified: true,
  };
};

/**
 * Process Membership/Subscription Payment
 * @param {Object} plan - Subscription plan details
 * @param {Object} user - User details
 * @returns {Promise} - Payment result
 */
export const processMembershipPayment = async (plan, user) => {
  const amount = parseFloat(plan.price) * 100; // Convert to paise

  return initiatePayment({
    amount: amount,
    description: `${plan.name} - ${plan.validity} Membership`,
    prefill: {
      name: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.name || '',
      email: user?.email || '',
      contact: user?.phone || user?.mobile || '',
    },
    notes: {
      plan_id: plan.id?.toString() || '',
      plan_name: plan.name || '',
      user_id: user?.id?.toString() || '',
      payment_type: 'membership',
    },
  });
};

/**
 * Process Salary Payment
 * @param {Object} salaryDetails - Salary payment details
 * @param {Object} staff - Staff details
 * @param {Object} owner - Owner/Employer details
 * @returns {Promise} - Payment result
 */
export const processSalaryPayment = async (salaryDetails, staff, owner) => {
  const amount = parseFloat(salaryDetails.totalAmount) * 100; // Convert to paise

  return initiatePayment({
    amount: amount,
    description: `Salary Payment - ${staff?.name || 'Staff'}`,
    prefill: {
      name: owner?.first_name ? `${owner.first_name} ${owner.last_name || ''}` : owner?.name || '',
      email: owner?.email || '',
      contact: owner?.phone || owner?.mobile || '',
    },
    notes: {
      staff_id: staff?.id?.toString() || '',
      staff_name: staff?.name || '',
      owner_id: owner?.id?.toString() || '',
      payment_type: 'salary',
      month: salaryDetails?.month || '',
      year: salaryDetails?.year || '',
    },
  });
};

export default {
  // Core functions
  initiatePayment,
  createRazorpayOrder,
  verifyPaymentSignature,
  createSubscription,
  processPaymentWithBackend,

  // Payment processors
  processMembershipPayment,
  processSalaryPayment,

  // AI Search
  findStaffAI,
};
