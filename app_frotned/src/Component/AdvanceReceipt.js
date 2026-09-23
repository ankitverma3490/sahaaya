import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import RNShare from 'react-native-share';
import RNFS from 'react-native-fs';
import SimpleToast from 'react-native-simple-toast';
import Typography from './UI/Typography';
import { Font } from '../Constants/Font';
import moment from 'moment';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 375) * size;

const AdvanceReceipt = ({ visible, onClose, advanceData, staffName: staffNameProp, employerName: employerNameProp }) => {
  const viewShotRef = useRef();
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!advanceData) return null;

  const amount = Number(advanceData?.amount ?? 0);
  const shouldDeduct = advanceData?.should_deduct ?? true;
  const deductionMethod = advanceData?.deduction_method ?? 'full';
  const numInstallments = advanceData?.num_installments ?? null;
  const installmentAmount = advanceData?.installment_amount ?? null;
  const paymentMode = (advanceData?.payment_mode ?? 'Cash').toUpperCase();
  const status = advanceData?.status ?? 'Paid';

  const staffName = staffNameProp || advanceData?.staff_name || 'Staff Member';
  const employerName = employerNameProp || advanceData?.employer_name || 'Employer';

  const givenDate = advanceData?.given_date
    ? moment(advanceData.given_date).format('DD MMM YYYY')
    : moment().format('DD MMM YYYY');

  const receiptId = advanceData?.receipt_id || advanceData?.advance_id || '--';

  const captureReceipt = async () => {
    try {
      const uri = await viewShotRef.current.capture({ format: 'png', quality: 1 });
      return uri;
    } catch (error) {
      console.log('Capture error:', error);
      return null;
    }
  };

  const handleDownload = async () => {
    setIsSaving(true);
    try {
      const uri = await captureReceipt();
      if (!uri) {
        SimpleToast.show('Failed to capture receipt', SimpleToast.SHORT);
        setIsSaving(false);
        return;
      }
      const fileName = `Sahayya_AdvanceReceipt_${receiptId}_${Date.now()}.png`;
      const downloadDir = Platform.OS === 'android' ? RNFS.DownloadDirectoryPath : RNFS.DocumentDirectoryPath;
      const destPath = `${downloadDir}/${fileName}`;
      const sourcePath = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
      await RNFS.copyFile(sourcePath, destPath);
      if (Platform.OS === 'android') await RNFS.scanFile(destPath);
      setIsSaving(false);
      SimpleToast.show('Advance receipt saved to Downloads!', SimpleToast.SHORT);
    } catch (error) {
      console.log('Download error:', error);
      SimpleToast.show('Failed to save advance receipt', SimpleToast.SHORT);
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const uri = await captureReceipt();
      if (!uri) {
        SimpleToast.show('Failed to capture receipt', SimpleToast.SHORT);
        setIsSharing(false);
        return;
      }
      const fileName = `Sahayya_AdvanceReceipt_${receiptId}_${Date.now()}.png`;
      const destPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
      const sourcePath = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
      await RNFS.copyFile(sourcePath, destPath);
      const shareUrl = Platform.OS === 'android' ? `file://${destPath}` : destPath;
      await RNShare.open({
        title: 'Sahayya Advance Receipt',
        message: `Advance Receipt - ${staffName} - \u20B9${amount.toFixed(2)}`,
        url: shareUrl,
        type: 'image/png',
        subject: 'Sahayya Advance Receipt',
      });
    } catch (error) {
      if (error?.message !== 'User did not share') {
        console.log('Share error:', error);
        SimpleToast.show('Failed to share receipt', SimpleToast.SHORT);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const deductionLabel = deductionMethod === 'installments' && numInstallments
    ? `Monthly Installments (${numInstallments} months)`
    : deductionMethod === 'full'
    ? 'One-Time Deduction'
    : 'Manual Deduction';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Typography type={Font.Poppins_SemiBold} style={styles.closeBtnText}>
              X
            </Typography>
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
            bounces={false}
          >
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 1 }}
              style={styles.receiptContainer}
            >
              <View style={styles.receipt}>
                {/* Header */}
                <View style={styles.receiptHeader}>
                  <Typography type={Font.Poppins_Bold} style={styles.receiptTitle}>
                    SAHAYYA
                  </Typography>
                  <Typography type={Font.Poppins_Regular} style={styles.receiptSubtitle}>
                    Advance Receipt
                  </Typography>
                  <Typography type={Font.Poppins_Regular} style={styles.periodText}>
                    {givenDate}
                  </Typography>
                </View>

                <View style={styles.dashedLine} />

                {/* Status */}
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: status?.toLowerCase() === 'paid' || status?.toLowerCase() === 'active'
                          ? '#E8F5E9'
                          : '#FFF3E0',
                      },
                    ]}
                  >
                    <Typography
                      type={Font.Poppins_SemiBold}
                      style={[
                        styles.statusText,
                        {
                          color: status?.toLowerCase() === 'paid' || status?.toLowerCase() === 'active'
                            ? '#2E7D32'
                            : '#E65100',
                        },
                      ]}
                    >
                      {(status?.toUpperCase() || 'PAID')}
                    </Typography>
                  </View>
                </View>

                {/* Amount */}
                <View style={styles.amountSection}>
                  <Typography type={Font.Poppins_Regular} style={styles.amountLabel}>
                    Advance Amount
                  </Typography>
                  <Typography type={Font.Poppins_Bold} style={styles.amountValue}>
                    {'\u20B9'}{amount.toFixed(2)}
                  </Typography>
                </View>

                <View style={styles.dashedLine} />

                {/* Info */}
                <View style={styles.infoSection}>
                  <InfoRow label="Staff Member" value={staffName} />
                  <InfoRow label="From (Employer)" value={employerName} />
                  <InfoRow label="Date" value={givenDate} />
                  <InfoRow label="Payment Mode" value={paymentMode} />
                  <InfoRow label="Receipt No" value={`#${receiptId}`} />
                </View>

                <View style={styles.dashedLine} />

                {/* Deduction Details */}
                <View style={styles.breakdownSection}>
                  <Typography type={Font.Poppins_SemiBold} style={styles.breakdownTitle}>
                    Deduction Details
                  </Typography>
                  <InfoRow label="Deduction Type" value={deductionLabel} />
                  {shouldDeduct && deductionMethod === 'installments' && installmentAmount && (
                    <InfoRow label="Monthly Deduction" value={`\u20B9${Number(installmentAmount).toFixed(2)}`} />
                  )}
                  {shouldDeduct && deductionMethod === 'full' && (
                    <InfoRow label="Next Salary Deduction" value={`\u20B9${amount.toFixed(2)}`} />
                  )}
                  {!shouldDeduct && (
                    <InfoRow label="Note" value="No deduction from salary" />
                  )}
                </View>

                <View style={styles.totalLine} />

                {/* Total */}
                <View style={styles.totalRow}>
                  <Typography type={Font.Poppins_SemiBold} style={styles.totalLabel}>
                    Total Advance
                  </Typography>
                  <Typography type={Font.Poppins_Bold} style={styles.totalValue}>
                    {'\u20B9'}{amount.toFixed(2)}
                  </Typography>
                </View>
                <View style={styles.totalLine} />

                {/* Footer */}
                <View style={styles.receiptFooter}>
                  <Typography type={Font.Poppins_Regular} style={styles.footerText}>
                    Generated by Sahayya App
                  </Typography>
                  <Typography type={Font.Poppins_Regular} style={styles.footerText}>
                    {moment().format('DD MMM YYYY, hh:mm A')}
                  </Typography>
                </View>
              </View>
            </ViewShot>
          </ScrollView>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={handleDownload}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Typography type={Font.Poppins_SemiBold} style={styles.btnText}>
                  Download
                </Typography>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              disabled={isSharing}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Typography type={Font.Poppins_SemiBold} style={styles.btnText}>
                  Share
                </Typography>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Typography type={Font.Poppins_Regular} style={styles.infoLabel}>
      {label}
    </Typography>
    <Typography type={Font.Poppins_SemiBold} style={styles.infoValue}>
      {value}
    </Typography>
  </View>
);

export default AdvanceReceipt;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 14,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: scale(14),
    color: '#333',
  },
  receiptContainer: {
    backgroundColor: '#fff',
  },
  receipt: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    backgroundColor: '#fff',
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: scale(4),
    marginTop: scale(6),
  },
  receiptTitle: {
    fontSize: scale(20),
    color: '#D98579',
    letterSpacing: 2,
  },
  receiptSubtitle: {
    fontSize: scale(12),
    color: '#888',
    marginTop: 2,
  },
  periodText: {
    fontSize: scale(13),
    color: '#333',
    marginTop: 4,
    fontFamily: Font?.Poppins_SemiBold,
  },
  dashedLine: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    marginVertical: scale(8),
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: scale(4),
  },
  statusBadge: {
    paddingHorizontal: scale(18),
    paddingVertical: scale(4),
    borderRadius: 20,
  },
  statusText: {
    fontSize: scale(12),
    letterSpacing: 1,
  },
  amountSection: {
    alignItems: 'center',
    marginVertical: scale(6),
  },
  amountLabel: {
    fontSize: scale(11),
    color: '#888',
  },
  amountValue: {
    fontSize: scale(24),
    color: '#333',
    marginTop: 2,
  },
  infoSection: {
    marginVertical: scale(2),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scale(4),
  },
  infoLabel: {
    fontSize: scale(11),
    color: '#888',
  },
  infoValue: {
    fontSize: scale(11),
    color: '#333',
    maxWidth: '60%',
    textAlign: 'right',
  },
  breakdownSection: {
    marginVertical: scale(2),
  },
  breakdownTitle: {
    fontSize: scale(13),
    marginBottom: scale(6),
    color: '#333',
  },
  totalLine: {
    borderTopWidth: 1,
    borderColor: '#eee',
    marginTop: scale(6),
    marginBottom: scale(3),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scale(4),
  },
  totalLabel: {
    fontSize: scale(13),
    color: '#333',
  },
  totalValue: {
    fontSize: scale(15),
    color: '#D98579',
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: scale(8),
    paddingTop: scale(6),
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  footerText: {
    fontSize: scale(9),
    color: '#aaa',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: scale(14),
    paddingVertical: scale(12),
    gap: scale(10),
  },
  downloadBtn: {
    flex: 1,
    backgroundColor: '#D98579',
    paddingVertical: scale(12),
    borderRadius: 12,
    alignItems: 'center',
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: scale(12),
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: scale(14),
  },
});
