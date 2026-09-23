import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
  ScrollView,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { GET } from '../Backend/Backend';
import { POLICY } from '../Backend/api_routes';
import HeaderForUser from './HeaderForUser';
import { Font } from '../Constants/Font';
import { ImageConstant } from '../Constants/ImageConstant';

const { height } = Dimensions.get('window');

const FALLBACK_CONTENT = {
  'help-support': {
    title: 'Help & Support',
    sections: [
      { text: "We're here to help you with any questions or issues you may have." },
      { heading: 'Frequently Asked Questions' },
      {
        heading: 'How do I add staff?',
        text: 'Go to Dashboard > Add Staff and fill in the required details including name, phone number, and job category.',
      },
      {
        heading: 'How do I mark attendance?',
        text: 'Staff attendance is automatically tracked when staff check in. You can also manually override attendance from the Attendance screen.',
      },
      {
        heading: 'How do I process salary?',
        text: 'Navigate to Salary Management, select the staff member, review the breakdown, and confirm the payment.',
      },
      {
        heading: 'How do I apply for leave?',
        text: 'Staff can apply for leave from their app. Household admins can approve or reject leave requests from the Leave Management section.',
      },
      { heading: 'Contact Us' },
      { text: 'Email: support@sahayya.app', link: 'mailto:support@sahayya.app' },
      { text: 'We typically respond within 24 hours.' },
    ],
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    sections: [
      { text: 'Last Updated: February 2026', bold: true },
      {
        text: 'Sahayya ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.',
      },
      { heading: 'Information We Collect' },
      {
        text: 'Personal Information: Name, phone number, email address, and Aadhaar details (for KYC verification) that you provide during registration.',
      },
      {
        text: 'Employment Data: Attendance records, salary information, leave records, and work history managed through the app.',
      },
      {
        text: 'Device Information: Device type, operating system, and app usage data to improve our services.',
      },
      { heading: 'How We Use Your Information' },
      { bullet: 'To provide and maintain our household staff management services' },
      { bullet: 'To process salary payments and track attendance' },
      { bullet: 'To verify identity through KYC processes' },
      { bullet: 'To send notifications about attendance, leave, and salary updates' },
      { bullet: 'To improve our app and user experience' },
      { heading: 'Data Security' },
      {
        text: 'We implement industry-standard security measures to protect your personal information. All data is encrypted in transit and at rest.',
      },
      { heading: 'Your Rights' },
      {
        text: 'You have the right to access, update, or delete your personal data at any time. You can delete your account from the App Settings.',
      },
      { heading: 'Contact' },
      { text: 'For privacy-related queries, contact us at support@sahayya.app', link: 'mailto:support@sahayya.app' },
    ],
  },
  'terms-of-service': {
    title: 'Terms of Service',
    sections: [
      { text: 'Last Updated: February 2026', bold: true },
      {
        text: 'Welcome to Sahayya. By using our app, you agree to these Terms of Service. Please read them carefully.',
      },
      { heading: '1. Acceptance of Terms' },
      {
        text: 'By downloading, installing, or using Sahayya, you agree to be bound by these Terms. If you do not agree, please do not use the app.',
      },
      { heading: '2. Description of Service' },
      {
        text: 'Sahayya is a household staff management platform that enables households to manage staff attendance, salary, leave, and related operations.',
      },
      { heading: '3. User Accounts' },
      { bullet: 'You must provide accurate and complete information during registration' },
      { bullet: 'You are responsible for maintaining the security of your account' },
      { bullet: 'You must be at least 18 years old to use this service' },
      { heading: '4. User Responsibilities' },
      { bullet: 'Use the app only for its intended purpose of staff management' },
      { bullet: 'Ensure all staff information entered is accurate' },
      { bullet: 'Process salary payments in compliance with applicable laws' },
      { bullet: 'Do not misuse the platform for any illegal activities' },
      { heading: '5. Payment & Subscriptions' },
      {
        text: 'Certain features may require a paid subscription. Payments are processed securely through Razorpay. Refund policies apply as per our refund terms.',
      },
      { heading: '6. Termination' },
      {
        text: 'We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time from the app settings.',
      },
      { heading: '7. Limitation of Liability' },
      {
        text: 'Sahayya is provided "as is" without warranties. We are not liable for any disputes between households and staff members.',
      },
      { heading: '8. Contact' },
      { text: 'For questions about these terms, reach us at support@sahayya.app', link: 'mailto:support@sahayya.app' },
    ],
  },
  'about-us': {
    title: 'About Sahayya',
    sections: [
      {
        text: 'Sahayya is a modern household staff management app designed to simplify the way you manage your domestic workforce.',
      },
      { heading: 'Our Mission' },
      {
        text: 'To bring transparency, organization, and ease to household staff management \u2014 making it simple for families to track attendance, manage salaries, and maintain records.',
      },
      { heading: 'What We Offer' },
      { bullet: 'Attendance Tracking \u2014 Automatic and manual attendance management' },
      { bullet: 'Salary Management \u2014 Easy salary calculation, payment processing, and slip generation' },
      { bullet: 'Leave Management \u2014 Apply, approve, and track leave requests' },
      { bullet: 'Staff Profiles \u2014 Complete staff records with KYC verification' },
      { bullet: 'Notifications \u2014 Stay updated with real-time alerts' },
      { bullet: 'Multi-member Support \u2014 Add family members to manage staff together' },
      { heading: 'Version' },
      { text: 'App Version: 1.2.3' },
      { text: 'Made with care in India.' },
    ],
  },
};

const FallbackView = ({ data }) => {
  if (!data) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>No content available.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.fallbackContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.fallbackTitle}>{data.title}</Text>
      {data.sections.map((item, index) => {
        if (item.heading) {
          return (
            <Text key={index} style={styles.fallbackHeading}>
              {item.heading}
            </Text>
          );
        }
        if (item.bullet) {
          return (
            <View key={index} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>{'\u2022'}</Text>
              <Text style={styles.fallbackText}>{item.bullet}</Text>
            </View>
          );
        }
        if (item.link) {
          return (
            <Text
              key={index}
              style={[styles.fallbackText, styles.linkText]}
              onPress={() => Linking.openURL(item.link)}
            >
              {item.text}
            </Text>
          );
        }
        return (
          <Text key={index} style={[styles.fallbackText, item.bold && styles.boldText]}>
            {item.text}
          </Text>
        );
      })}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const PolicyScreen = ({ route, navigation }) => {
  const { slug } = route.params || {};
  const [pageContent, setPageContent] = useState('');
  const [useFallback, setUseFallback] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    handlePolicy();
  }, []);

  const SLUG_TITLES = {
    'help-support': 'Help & Support',
    'privacy-policy': 'Privacy Policy',
    'terms-of-service': 'Terms of Service',
    'about-us': 'About Us',
  };
  const formattedSlug = SLUG_TITLES[slug]
    || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ') : '');

  const startFadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const handlePolicy = () => {
    GET(
      POLICY,
      response => {
        setIsLoading(false);
        if (response?.success && Array.isArray(response?.data)) {
          const page = response.data.find(item => item.slug === slug);
          if (page && page.body) {
            setPageContent(page.body);
            setPageTitle(page.page_name || 'Policy');
          } else {
            setUseFallback(true);
          }
          startFadeIn();
        } else {
          setUseFallback(true);
          startFadeIn();
        }
      },
      error => {
        setIsLoading(false);
        setUseFallback(true);
        startFadeIn();
      },
    );
  };

  return (
    <View style={styles.container}>
      <HeaderForUser
        title={formattedSlug}
        style_title={{ fontFamily: Font?.Manrope_SemiBold, fontSize: 18 }}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation?.goBack()}
        containerStyle={{ paddingHorizontal: 20 }}
      />
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#D98579" />
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {useFallback ? (
            <FallbackView data={FALLBACK_CONTENT[slug]} />
          ) : (
            <WebView
              originWhitelist={['*']}
              style={styles.webview}
              source={{
                html: `
                <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                      body {
                        padding: 20px;
                        font-size: 16px;
                        line-height: 26px;
                        color: #333;
                        background-color: #fafafa;
                        font-family: 'Helvetica Neue', Arial, sans-serif;
                      }
                      h1, h2, h3 {
                        color: #000000;
                        text-align: center;
                        margin-bottom: 10px;
                      }
                      p {
                        margin-bottom: 14px;
                      }
                      a {
                        color: #03a4ed;
                        text-decoration: none;
                      }
                      a:hover {
                        text-decoration: underline;
                      }
                    </style>
                  </head>
                  <body>${pageContent}</body>
                </html>
                `,
              }}
            />
          )}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  loaderContainer: {
    flex: 1,
    height: height * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  fallbackContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fafafa',
  },
  fallbackTitle: {
    fontSize: 22,
    fontFamily: Font?.Poppins_Bold,
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  fallbackHeading: {
    fontSize: 18,
    fontFamily: Font?.Poppins_Bold,
    color: '#000',
    marginTop: 18,
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 14,
    fontFamily: Font?.Poppins_Regular,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
    flex: 1,
  },
  boldText: {
    fontFamily: Font?.Poppins_Bold,
  },
  linkText: {
    color: '#03a4ed',
  },
  bulletRow: {
    flexDirection: 'row',
    paddingLeft: 8,
    marginBottom: 6,
  },
  bulletDot: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
    marginTop: 1,
  },
});

export default PolicyScreen;
