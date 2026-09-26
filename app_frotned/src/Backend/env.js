/**
 * Environment Configuration
 *
 * This file contains all environment variables and API configurations.
 * To change URLs or keys, update the values below or use a .env file with react-native-config.
 *
 * NOTE: For production, replace test keys with live keys and update URLs accordingly.
 */

// ===========================================
// ENVIRONMENT SETTINGS
// ===========================================
import { Platform } from 'react-native';

export const APP_ENV = 'production'; // 'development' | 'production'

// ===========================================
// MAIN BACKEND API
// ===========================================
// Production URL (Remote Live Backend)
const PRODUCTION_API_URL = 'https://sahayaa-backend-production.up.railway.app/api/';

// Local Development Settings
// - Your machine's local Wi-Fi IP:
export const LOCAL_IP = '192.168.1.4';
export const LOCAL_PORT = '8000';

const getDevelopmentApiUrl = () => {
  return `http://${LOCAL_IP}:${LOCAL_PORT}/api/`;
};

const DEVELOPMENT_API_URL = getDevelopmentApiUrl();

// Active Backend URL: Uses Live Railway backend in production
export const BASE_URL = APP_ENV === 'production' ? PRODUCTION_API_URL : DEVELOPMENT_API_URL;

// ===========================================
// RAZORPAY PAYMENT GATEWAY
// ===========================================
// Razorpay Payment API Base URL
export const RAZORPAY_API_URL = BASE_URL;

// The public checkout key is safe to ship in the mobile app. The secret key
// must remain on the backend and is never needed by the client.
export const RAZORPAY_KEY_ID = 'rzp_test_Rcx3E3rF2dNmEc';

// Production Keys (Replace for production deployment)
// export const RAZORPAY_KEY_ID = 'rzp_live_XXXXXXXXXXXXXXX';

// ===========================================
// GOOGLE MAPS
// ===========================================
export const mapKey = 'AIzaSyCt8jw_uRbRfr9_8CBRdauiHY8rWCjV6WU';
export const GOOGLE_MAPS_API_KEY = mapKey;

// ===========================================
// ANALYTICS
// ===========================================
export const MixPanelKey = '';

// ===========================================
// HELPER FUNCTIONS
// ===========================================
/**
 * Get full API URL for a route
 * @param {string} route - The API route
 * @returns {string} Full URL
 */
export const getApiUrl = (route) => `${BASE_URL}${route}`;

/**
 * Get full Razorpay API URL for a route
 * @param {string} route - The API route (e.g., 'create-order.php')
 * @returns {string} Full URL
 */
export const getRazorpayApiUrl = (route) => `${RAZORPAY_API_URL}${route}`;

// ===========================================
// DEFAULT EXPORT
// ===========================================
export default {
  APP_ENV,
  BASE_URL,
  RAZORPAY_API_URL,
  RAZORPAY_KEY_ID,
  mapKey,
  GOOGLE_MAPS_API_KEY,
  MixPanelKey,
  getApiUrl,
  getRazorpayApiUrl,
};

