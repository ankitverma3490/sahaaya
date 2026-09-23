import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import { GET_WITH_TOKEN } from '../../Backend/Backend';
import { EarningSummary, MyAdvances } from '../../Backend/api_routes';
import { useIsFocused } from '@react-navigation/native';
import moment from 'moment';
import PaymentReceipt from '../../Component/PaymentReceipt';
import { useSelector } from 'react-redux';

const STATUS_FILTERS = ['All', 'Paid', 'Pending', 'Advance'];

const parseDateSafely = (dateStr) => {
  if (!dateStr) return moment();
  const formats = ['YYYY-MM-DD', 'DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD HH:mm:ss', moment.ISO_8601];
  const parsed = moment(dateStr, formats);
  return parsed.isValid() ? parsed : moment();
};

const StaffPaymentHistory = ({ navigation }) => {
  const isFocused = useIsFocused();
  const userDetail = useSelector(state => state?.userDetails);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [receiptPayment, setReceiptPayment] = useState(null);

  const staffName = userDetail?.name ||
    (userDetail?.first_name ? `${userDetail.first_name} ${userDetail.last_name || ''}`.trim() : 'Staff Member');

  const fetchHistory = useCallback(() => {
    setLoading(true);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // First try the dedicated staff payment history endpoint, fallback to earnings summary
    GET_WITH_TOKEN(
      'staff/payment-history',
      res => {
        const list = res?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setRecords(list);
          setLoading(false);
          setRefreshing(false);
          return;
        }
        // If empty, fetch from EarningSummary & MyAdvances
        fetchFromEarningsSummary(currentMonth);
      },
      () => {
        // Fallback to earnings summary
        fetchFromEarningsSummary(currentMonth);
      },
      () => {
        fetchFromEarningsSummary(currentMonth);
      }
    );
  }, []);

  const fetchFromEarningsSummary = (monthStr) => {
    GET_WITH_TOKEN(
      `${EarningSummary}?month=${monthStr}`,
      success => {
        const data = success?.data;
        const ed = Array.isArray(data) && data.length > 0 ? data[0] : (data && !Array.isArray(data) ? data : null);
        const allList = [];

        if (ed) {
          const employerName = ed.employer || ed.employer_name || userDetail?.employer_name || 'Employer';
          const monthlySal = Number(ed.salary_summary?.current_monthly_salary || ed.total_payable_amount || 0);

          // Add current month record
          if (monthlySal > 0 || Number(ed.total_payable_amount || 0) > 0) {
            const amount = Number(ed.total_payable_amount || monthlySal || 0);
            allList.push({
              id: ed.payment_id || `salary_${monthStr}`,
              amount: amount,
              status: ed.payment_status ? (ed.payment_status.charAt(0).toUpperCase() + ed.payment_status.slice(1)) : 'Pending',
              type: 'salary',
              month: moment(monthStr, 'YYYY-MM').format('MMMM YYYY'),
              date: ed.payment_date || `${monthStr}-01`,
              paid_by: employerName,
              payment_mode: ed.payment_mode || 'Cash',
              raw: {
                ...ed,
                net_salary: amount,
                amount: amount,
                status: ed.payment_status || 'Pending',
                staff_name: staffName,
                employer_name: employerName,
                salary_period: moment(monthStr, 'YYYY-MM').format('MMMM YYYY'),
                created_at: ed.payment_date || `${monthStr}-01`,
                monthly_salary: monthlySal,
                salary_breakdown: ed.earnings_breakdown || {},
                pf_deduction: Number(ed.deductions?.provident_fund?.amount || 0),
                tax_deduction: Number(ed.deductions?.income_tax?.amount || 0),
                payment_id: ed.payment_id || `SAL-${monthStr}`,
                payment_mode: ed.payment_mode || 'Cash',
              },
            });
          }

          // Add past payments from payment_history
          const ph = ed.payment_history || [];
          ph.forEach((p, idx) => {
            const pAmt = Number(p.amount || p.net_salary || 0);
            const pDate = p.paid_on || p.date || p.created_at || '';
            allList.push({
              id: p.payment_id || p.id || `ph_${idx}`,
              amount: pAmt,
              status: p.status ? (p.status.charAt(0).toUpperCase() + p.status.slice(1)) : 'Paid',
              type: p.type || 'salary',
              month: p.month || '',
              date: pDate,
              paid_by: p.paid_by || employerName,
              payment_mode: p.payment_mode || 'Cash',
              raw: {
                ...p,
                net_salary: pAmt,
                amount: pAmt,
                status: p.status || 'Paid',
                staff_name: staffName,
                employer_name: p.paid_by || employerName,
                salary_period: p.month || '',
                created_at: pDate,
                monthly_salary: monthlySal,
                salary_breakdown: p.salary_breakdown || ed.earnings_breakdown || {},
                payment_id: p.payment_id || p.id || `SAL-${idx}`,
                payment_mode: p.payment_mode || 'Cash',
              },
            });
          });
        }

        // Also fetch advances for completeness
        GET_WITH_TOKEN(
          MyAdvances,
          advRes => {
            const advances = advRes?.data || [];
            advances.forEach((adv, idx) => {
              const advAmt = Number(adv.amount || 0);
              const advEmployer = adv.employer ? (adv.employer.name || `${adv.employer.first_name || ''} ${adv.employer.last_name || ''}`.trim()) : 'Employer';
              allList.push({
                id: `adv_${adv.id || idx}`,
                amount: advAmt,
                status: adv.status === 'active' ? 'Active' : 'Cleared',
                type: 'advance',
                month: moment(adv.given_date).format('MMMM YYYY'),
                date: adv.given_date || adv.created_at,
                paid_by: advEmployer,
                payment_mode: 'Cash / Transfer',
                raw: {
                  ...adv,
                  amount: advAmt,
                  net_salary: advAmt,
                  advance_payment: advAmt,
                  status: adv.status === 'active' ? 'Active' : 'Cleared',
                  staff_name: staffName,
                  employer_name: advEmployer,
                  salary_period: moment(adv.given_date).format('MMMM YYYY'),
                  created_at: adv.given_date || adv.created_at,
                  payment_id: `ADV-${adv.id || idx}`,
                  payment_mode: 'Cash / Transfer',
                },
              });
            });

            // Sort safely by date descending
            allList.sort((a, b) => {
              const timeA = parseDateSafely(a.date).valueOf();
              const timeB = parseDateSafely(b.date).valueOf();
              return timeB - timeA;
            });

            setRecords(allList);
            setLoading(false);
            setRefreshing(false);
          },
          () => {
            setRecords(allList);
            setLoading(false);
            setRefreshing(false);
          },
          () => {
            setRecords(allList);
            setLoading(false);
            setRefreshing(false);
          }
        );
      },
      () => {
        setLoading(false);
        setRefreshing(false);
      },
      () => {
        setLoading(false);
        setRefreshing(false);
      }
    );
  };

  useEffect(() => {
    if (isFocused) {
      fetchHistory();
    }
  }, [isFocused, fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getStatusColor = status => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return '#0A8F08';
    if (s === 'active') return '#16A34A';
    if (s === 'advance') return '#D98579';
    if (s === 'cleared') return '#666666';
    return '#FF9800';
  };

  const filteredRecords = useMemo(() => {
    if (selectedStatus === 'All') return records;
    return records.filter(r => {
      const st = (r?.status || '').toLowerCase();
      const tp = (r?.type || '').toLowerCase();
      const sel = selectedStatus.toLowerCase();
      return st === sel || tp === sel;
    });
  }, [records, selectedStatus]);

  const handleOpenSlip = (item) => {
    const raw = item?.raw || {};
    const amt = Number(raw?.amount || raw?.net_salary || item?.amount || 0);
    const slipData = {
      ...raw,
      amount: amt,
      net_salary: amt,
      status: raw?.status || item?.status || 'Paid',
      staff_name: raw?.staff_name || staffName,
      employer_name: raw?.employer_name || item?.paid_by || 'Employer',
      salary_period: raw?.salary_period || item?.month || moment(item?.date).format('MMMM YYYY'),
      created_at: raw?.created_at || item?.date || new Date().toISOString(),
      monthly_salary: Number(raw?.monthly_salary || raw?.basic_salary || amt),
      worked_days: raw?.worked_days || 0,
      total_days: raw?.total_days || 0,
      salary_breakdown: raw?.salary_breakdown || {},
      pf_deduction: Number(raw?.pf_deduction || 0),
      tax_deduction: Number(raw?.tax_deduction || 0),
      advance_payment: Number(raw?.advance_payment || 0),
      payment_id: raw?.payment_id || item?.id || 'SLP',
      payment_mode: raw?.payment_mode || item?.payment_mode || 'Cash',
    };
    setReceiptPayment(slipData);
  };

  const renderItem = ({ item }) => {
    const amount = Number(item?.amount || 0);
    const formattedDate = item?.date ? parseDateSafely(item.date).format('DD MMM YYYY') : '--';
    const statusColor = getStatusColor(item?.status);

    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() => handleOpenSlip(item)}
      >
        <View style={styles.iconCircle}>
          <Typography type={Font?.Poppins_SemiBold} size={15} color="#D98579">{"\u20B9"}</Typography>
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Typography type={Font?.Poppins_SemiBold} size={14}>
            {"\u20B9"}{amount.toLocaleString('en-IN')}
          </Typography>
          <Typography type={Font?.Poppins_Regular} size={12} color="#666">
            {item?.type === 'advance' ? 'Advance Payment' : `Salary - ${item?.month || ''}`}
          </Typography>
          <Typography type={Font?.Poppins_Regular} size={11} color="#999">
            {formattedDate} · {item?.paid_by || 'Employer'} ({item?.payment_mode || 'Cash'})
          </Typography>
        </View>

        <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Typography type={Font?.Poppins_SemiBold} size={11} color={statusColor}>
              {item?.status || 'Paid'}
            </Typography>
          </View>
          <TouchableOpacity
            style={styles.receiptBtn}
            onPress={() => handleOpenSlip(item)}
          >
            <Image source={ImageConstant?.fileText} style={styles.receiptIcon} />
            <Typography size={11} color="#D98579" type={Font?.Poppins_Medium}>View Slip</Typography>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <HeaderForUser
          title="Payment History"
          source_arrow={ImageConstant?.BackArrow}
          onPressLeftIcon={() => navigation.goBack()}
          style_title={{ fontSize: 18 }}
        />
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, selectedStatus === f && styles.chipActive]}
            onPress={() => setSelectedStatus(f)}
          >
            <Typography
              type={selectedStatus === f ? Font?.Poppins_SemiBold : Font?.Poppins_Regular}
              size={12}
              color={selectedStatus === f ? '#D98579' : '#555'}
            >
              {f}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#D98579" />
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={(item, index) => String(item?.id || index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#D98579']}
              tintColor="#D98579"
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Typography type={Font?.Poppins_Regular} size={14} color="#888">
                No payment history found.
              </Typography>
            </View>
          )}
        />
      )}

      {receiptPayment && (
        <PaymentReceipt
          visible={!!receiptPayment}
          onClose={() => setReceiptPayment(null)}
          paymentData={receiptPayment}
          userDetails={userDetail}
        />
      )}
    </View>
  );
};

export default StaffPaymentHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerWrapper: {
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  chipActive: {
    borderColor: '#D98579',
    backgroundColor: '#FFF5EE',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF5EE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D98579',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D98579',
  },
  receiptIcon: {
    width: 12,
    height: 12,
    tintColor: '#D98579',
    marginRight: 4,
    resizeMode: 'contain',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
});
