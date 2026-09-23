import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Button from '../../../Component/Button';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import { GET_WITH_TOKEN } from '../../../Backend/Backend';
import { Joblist_Admin, ListJob } from '../../../Backend/api_routes';
import { useSelector } from 'react-redux';

const SelectJob = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const userDetail = useSelector(state => state?.userDetails);

  const fetchJobs = useCallback(() => {
    setLoading(true);
    const jobsRoute = userDetail?.user_role_id ? Joblist_Admin : ListJob;
    GET_WITH_TOKEN(
      jobsRoute,
      success => {
        setLoading(false);
        const rawData = success?.data;
        const jobList = Array.isArray(rawData) ? rawData : (rawData?.data || []);
        setJobs(Array.isArray(jobList) ? jobList : []);
      },
      () => {
        setLoading(false);
        setJobs([]);
      },
      () => {
        setLoading(false);
        setJobs([]);
      },
    );
  }, [userDetail?.user_role_id]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSelectJob = job => {
    navigation.navigate('Aadhar', {
      job_id: job.id,
      job_compensation: job.compensation || job.expected_compensation || 0,
      job_title: job.title || '',
      job_compensation_type: job.compensation_type || 'monthly',
    });
  };

  const formatPrice = price => {
    if (!price || price === '0' || price === '0.00') return 'Not specified';
    return `₹${parseFloat(price).toLocaleString('en-IN')}`;
  };

  const renderJobCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Typography type={Font.Poppins_SemiBold} style={styles.jobTitle}>
          {item.title || 'Untitled Job'}
        </Typography>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'open' ? '#E8F5E9' : '#FFF3E0' },
          ]}
        >
          <Typography
            type={Font.Poppins_Medium}
            style={[
              styles.statusText,
              { color: item.status === 'open' ? '#2E7D32' : '#E65100' },
            ]}
          >
            {(item.status || 'open').charAt(0).toUpperCase() + (item.status || 'open').slice(1)}
          </Typography>
        </View>
      </View>

      <View style={styles.jobDetails}>
        <View style={styles.detailRow}>
          <Typography type={Font.Poppins_Regular} style={styles.detailLabel}>Salary:</Typography>
          <Typography type={Font.Poppins_SemiBold} style={styles.detailValue}>
            {formatPrice(item.compensation || item.expected_compensation)}
            {item.compensation_type ? ` / ${item.compensation_type}` : ''}
          </Typography>
        </View>
        {item.city && item.state && (
          <View style={styles.detailRow}>
            <Typography type={Font.Poppins_Regular} style={styles.detailLabel}>Location:</Typography>
            <Typography type={Font.Poppins_Regular} style={styles.detailValueText}>
              {item.city}, {item.state}
            </Typography>
          </View>
        )}
        {item.commitment_type && (
          <View style={styles.detailRow}>
            <Typography type={Font.Poppins_Regular} style={styles.detailLabel}>Type:</Typography>
            <Typography type={Font.Poppins_Regular} style={styles.detailValueText}>
              {item.commitment_type}
            </Typography>
          </View>
        )}
      </View>

      {item.description ? (
        <Typography type={Font.Poppins_Regular} style={styles.description} numberOfLines={2}>
          {item.description}
        </Typography>
      ) : null}

      <View style={styles.actionRow}>
        <View style={styles.hiresContainer}>
          <Image source={ImageConstant?.Users} style={styles.hiresIcon} />
          <Typography type={Font.Poppins_Medium} style={styles.hiresText}>
            {item.hires_count ?? item.users_count ?? 0} {(item.hires_count ?? item.users_count ?? 0) === 1 ? 'hire' : 'hires'}
          </Typography>
        </View>
        <Button
          title="Select This Job"
          style={styles.selectBtnInner}
          title_style={styles.selectBtnText}
          onPress={() => handleSelectJob(item)}
        />
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Image source={ImageConstant?.Briefcase} style={styles.emptyIcon} />
      </View>
      <Typography type={Font.Poppins_SemiBold} style={styles.emptyTitle}>
        No Job Postings Found
      </Typography>
      <Typography type={Font.Poppins_Regular} style={styles.emptySubtitle}>
        You need to post at least one job before adding staff for it.
      </Typography>
      <Button
        title="Post a Job"
        style={styles.postJobBtnInner}
        title_style={styles.postJobBtnText}
        onPress={() => navigation.navigate('PostNewJob')}
      />
    </View>
  );

  return (
    <CommanView>
      <HeaderForUser
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
        title="Select Job for Staff"
        style_title={{ fontSize: 18 }}
      />

      <View style={styles.topBanner}>
        <Image source={ImageConstant?.Briefcase} style={styles.topIcon} />
        <View style={styles.topBannerTextContainer}>
          <Typography type={Font.Poppins_SemiBold} style={styles.topBannerTitle}>
            Assign Job to Staff
          </Typography>
          <Typography type={Font.Poppins_Regular} style={styles.topBannerSubtitle}>
            Choose which job posting you want to assign your staff member to
          </Typography>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#D98579" />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={item => String(item.id)}
          renderItem={renderJobCard}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </CommanView>
  );
};

export default SelectJob;

const styles = StyleSheet.create({
  topBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F3',
    borderWidth: 1,
    borderColor: '#F5C6C0',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  topIcon: {
    width: 28,
    height: 28,
    tintColor: '#D98579',
    marginRight: 12,
    resizeMode: 'contain',
  },
  topBannerTextContainer: {
    flex: 1,
  },
  topBannerTitle: {
    fontSize: 14,
    color: '#111',
  },
  topBannerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 16,
    color: '#111',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  jobDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#777',
    width: 70,
  },
  detailValue: {
    fontSize: 13,
    color: '#D98579',
    flex: 1,
  },
  detailValueText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  description: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F0',
  },
  hiresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hiresIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
    tintColor: '#888',
    resizeMode: 'contain',
  },
  hiresText: {
    fontSize: 12,
    color: '#777',
  },
  selectBtnInner: {
    height: 38,
    width: 135,
    marginVertical: 0,
    borderRadius: 10,
  },
  selectBtnText: {
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 50,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF5F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F5C6C0',
  },
  emptyIcon: {
    width: 34,
    height: 34,
    tintColor: '#D98579',
    resizeMode: 'contain',
  },
  emptyTitle: {
    fontSize: 17,
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  postJobBtnInner: {
    height: 42,
    width: 150,
    marginVertical: 0,
    borderRadius: 10,
  },
  postJobBtnText: {
    fontSize: 14,
  },
});
