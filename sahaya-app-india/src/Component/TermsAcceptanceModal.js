import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Typography from './UI/Typography';
import { Font } from '../Constants/Font';
import { TERMS_AND_CONDITIONS_CONTENT, PRIVACY_POLICY_CONTENT } from '../Constants/legalContents';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 375) * size;

const Checkbox = ({ checked, onToggle, label }) => (
  <TouchableOpacity
    style={styles.checkboxRow}
    onPress={onToggle}
    activeOpacity={0.7}
  >
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Typography style={styles.checkmark}>✓</Typography>}
    </View>
    <Typography size={12} style={styles.checkboxLabel}>
      {label}
    </Typography>
  </TouchableOpacity>
);

const TermsAcceptanceModal = ({
  visible,
  onAccept,
  policies = [],
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState('terms');
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const termsScrollRef = useRef(null);
  const privacyScrollRef = useRef(null);

  const allAccepted = termsChecked && privacyChecked;

  const handleAccept = () => {
    if (!allAccepted) return;
    onAccept && onAccept();
    setTermsChecked(false);
    setPrivacyChecked(false);
    setActiveTab('terms');
  };

  const renderContent = (content) => {
    if (!content) return null;
    const sections = Array.isArray(content) ? content : (content.sections || []);
    return sections.map((section, idx) => (
      <View key={idx} style={styles.section}>
        <Typography type={Font.Poppins_SemiBold} size={14} style={styles.sectionHeading}>
          {section.heading}
        </Typography>
        {section.text && (
          <Typography size={12} style={styles.sectionText}>
            {section.text}
          </Typography>
        )}
        {section.bullets && section.bullets.map((bullet, bIdx) => (
          <View key={bIdx} style={styles.bulletRow}>
            <Typography size={12} style={styles.bulletDot}>•</Typography>
            <Typography size={12} style={styles.bulletText}>{bullet}</Typography>
          </View>
        ))}
      </View>
    ));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {}}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Typography type={Font.Poppins_Bold} size={18} color="#333">
              Updated Terms & Policies
            </Typography>
            <Typography size={12} color="#888" style={{ marginTop: 4 }}>
              Please review and accept the updated terms to continue using Sahayya
            </Typography>
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'terms' && styles.tabActive]}
              onPress={() => setActiveTab('terms')}
            >
              <Typography
                type={Font.Poppins_Medium}
                size={13}
                color={activeTab === 'terms' ? '#D98579' : '#888'}
              >
                Terms of Service
              </Typography>
              {termsChecked && (
                <View style={styles.tabCheck}>
                  <Typography style={styles.tabCheckText}>✓</Typography>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'privacy' && styles.tabActive]}
              onPress={() => setActiveTab('privacy')}
            >
              <Typography
                type={Font.Poppins_Medium}
                size={13}
                color={activeTab === 'privacy' ? '#D98579' : '#888'}
              >
                Privacy Policy
              </Typography>
              {privacyChecked && (
                <View style={styles.tabCheck}>
                  <Typography style={styles.tabCheckText}>✓</Typography>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Content */}
          {activeTab === 'terms' ? (
            <ScrollView
              ref={termsScrollRef}
              style={styles.contentScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.contentInner}>
                <Typography type={Font.Poppins_Bold} size={16} style={styles.contentTitle}>
                  Terms of Service
                </Typography>
                <Typography size={10} color="#999" style={{ marginBottom: 12 }}>
                  Last Updated: February 2026
                </Typography>
                {renderContent(TERMS_AND_CONDITIONS_CONTENT)}
              </View>
            </ScrollView>
          ) : (
            <ScrollView
              ref={privacyScrollRef}
              style={styles.contentScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.contentInner}>
                <Typography type={Font.Poppins_Bold} size={16} style={styles.contentTitle}>
                  Privacy Policy
                </Typography>
                <Typography size={10} color="#999" style={{ marginBottom: 12 }}>
                  Last Updated: February 2026
                </Typography>
                {renderContent(PRIVACY_POLICY_CONTENT)}
              </View>
            </ScrollView>
          )}

          {/* Checkboxes */}
          <View style={styles.checkboxSection}>
            <Checkbox
              checked={termsChecked}
              onToggle={() => setTermsChecked(!termsChecked)}
              label="I have read and agree to the Terms of Service"
            />
            <Checkbox
              checked={privacyChecked}
              onToggle={() => setPrivacyChecked(!privacyChecked)}
              label="I have read and agree to the Privacy Policy"
            />
          </View>

          {/* Accept Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.acceptBtn, !allAccepted && styles.acceptBtnDisabled]}
              onPress={handleAccept}
              disabled={!allAccepted || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Typography type={Font.Poppins_SemiBold} size={15} color="#fff">
                  Accept & Continue
                </Typography>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default TermsAcceptanceModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '92%',
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    paddingHorizontal: scale(16),
    paddingTop: scale(16),
    paddingBottom: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#D98579',
  },
  tabCheck: {
    marginLeft: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabCheckText: {
    color: '#fff',
    fontSize: 10,
  },
  contentScroll: {
    maxHeight: SCREEN_HEIGHT * 0.42,
  },
  contentInner: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
  },
  contentTitle: {
    marginBottom: 4,
    color: '#333',
  },
  section: {
    marginBottom: 14,
  },
  sectionHeading: {
    marginBottom: 4,
    color: '#333',
  },
  sectionText: {
    lineHeight: 18,
    color: '#555',
  },
  bulletRow: {
    flexDirection: 'row',
    marginLeft: 8,
    marginTop: 3,
  },
  bulletDot: {
    marginRight: 6,
    color: '#888',
  },
  bulletText: {
    flex: 1,
    lineHeight: 17,
    color: '#555',
  },
  checkboxSection: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#D98579',
    borderColor: '#D98579',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    color: '#444',
  },
  footer: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  acceptBtn: {
    backgroundColor: '#D98579',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptBtnDisabled: {
    backgroundColor: '#ccc',
  },
});
