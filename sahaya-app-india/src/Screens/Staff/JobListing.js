import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import Button from '../../Component/Button';
import { ImageConstant } from '../../Constants/ImageConstant';
import LocalizedStrings from '../../Constants/localization';
import { GET_WITH_TOKEN } from '../../Backend/Backend';
import { ListJob } from '../../Backend/api_routes';
import { useIsFocused } from '@react-navigation/native';
import EmptyView from '../../Component/UI/EmptyView';
import { useSelector } from 'react-redux';

const SORT_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Title (A-Z)', value: 'title_asc' },
  { label: 'Title (Z-A)', value: 'title_desc' },
  { label: 'Salary (High to Low)', value: 'salary_desc' },
  { label: 'Salary (Low to High)', value: 'salary_asc' },
];

const JobsList = ({ navigation }) => {
  const [jobData, setJobData] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const userDetail = useSelector(state => state?.userDetails);

  const [searchText, setSearchText] = useState('');
  const [selectedSort, setSelectedSort] = useState('default');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedCompTypes, setSelectedCompTypes] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [allIndia, setAllIndia] = useState(false);

  // Map category IDs to names
  const categoryIdToNameMap = {
    '1': 'Cook',
    '2': 'Housekeeper',
    '3': 'Driver',
    '4': 'Nanny',
    '5': 'Gardener',
    '6': 'Elderly Care',
    '7': 'Security Guard',
    '8': 'Office Helper',
  };

  // Extract ALL staff roles from profile (primary_role, skills, last_exp)
  const staffRoles = (() => {
    const rolesSet = new Set();
    const primary = userDetail?.user_work_info?.primary_role || userDetail?.work_info?.primary_role;
    const skills = userDetail?.user_work_info?.skills || userDetail?.work_info?.skills;
    const lastRole = userDetail?.last_exp?.role || userDetail?.lastExp?.role;

    const addRole = (r) => {
      if (!r) return;
      if (Array.isArray(r)) {
        r.forEach(item => addRole(item));
      } else if (typeof r === 'string') {
        try {
          const parsed = JSON.parse(r);
          if (Array.isArray(parsed)) {
            parsed.forEach(item => addRole(item));
            return;
          }
        } catch (e) {}
        r.split(',').forEach(s => {
          const clean = s.replace(/[\[\]"']/g, '').trim();
          if (clean) {
            rolesSet.add(clean);
            if (categoryIdToNameMap[clean]) {
              rolesSet.add(categoryIdToNameMap[clean]);
            }
          }
        });
      } else {
        const val = String(r);
        rolesSet.add(val);
        if (categoryIdToNameMap[val]) {
          rolesSet.add(categoryIdToNameMap[val]);
        }
      }
    };

    addRole(primary);
    addRole(skills);
    addRole(lastRole);

    return Array.from(rolesSet);
  })();

  // Extract ALL preferred work cities from profile
  const staffPreferredCities = (() => {
    const citiesSet = new Set();
    const prefLoc = userDetail?.user_work_info?.preferred_work_location || userDetail?.work_info?.preferred_work_location;
    const addresses = userDetail?.addresses || [];

    if (prefLoc) {
      if (Array.isArray(prefLoc)) {
        prefLoc.forEach(c => citiesSet.add(String(c).trim()));
      } else if (typeof prefLoc === 'string') {
        prefLoc.split(',').forEach(c => {
          const clean = c.replace(/[\[\]"']/g, '').trim();
          if (clean) citiesSet.add(clean);
        });
      }
    }

    addresses.forEach(a => {
      if (a?.city) citiesSet.add(a.city.trim());
    });

    if (userDetail?.city) citiesSet.add(userDetail.city.trim());

    return Array.from(citiesSet);
  })();

  useEffect(() => {
    if (isFocused) {
      JobList();
    }
  }, [isFocused]);

  const JobList = (filterRole, filterCity, filterState) => {
    setLoading(true);

    // Build query params only when user explicitly applies filters
    let route = ListJob;
    const params = [];
    if (filterRole) params.push(`role=${encodeURIComponent(filterRole)}`);
    if (filterCity) params.push(`city=${encodeURIComponent(filterCity)}`);
    if (filterState) params.push(`state=${encodeURIComponent(filterState)}`);
    if (params.length > 0) route = `${ListJob}?${params.join('&')}`;

    GET_WITH_TOKEN(
      route,
      success => {
        const rawData = success?.data;
        const jobs = Array.isArray(rawData) ? rawData : (rawData?.data || []);
        setJobData(Array.isArray(jobs) ? jobs : []);
        setLoading(false);
      },
      error => {
        setLoading(false);
      },
      fail => {
        setLoading(false);
      },
    );
  };

  const fetchAllIndia = () => {
    setJobData([]);
    setLoading(true);
    GET_WITH_TOKEN(
      `${ListJob}?city=All`,
      success => {
        const rawData = success?.data;
        const jobs = Array.isArray(rawData) ? rawData : (rawData?.data || []);
        setJobData(Array.isArray(jobs) ? jobs : []);
        setLoading(false);
      },
      error => {
        setLoading(false);
      },
      fail => {
        setLoading(false);
      },
    );
  };

  const toggleAllIndia = () => {
    if (!allIndia) {
      setAllIndia(true);
      setSelectedLocations([]);
      fetchAllIndia();
    } else {
      setAllIndia(false);
      JobList();
    }
  };

  // Extract unique locations and compensation types for filter options
  const getFilterOptions = () => {
    const locations = [];
    const compTypes = [];
    jobData.forEach(job => {
      const loc = job?.city || job?.state;
      if (loc && !locations.includes(loc)) {
        locations.push(loc);
      }
      const ct = job?.compensation_type;
      if (ct && !compTypes.includes(ct)) {
        compTypes.push(ct);
      }
    });
    return { locations, compTypes };
  };
  const filterOptions = getFilterOptions();

  // Check if job location is All India / nationwide
  const isAllIndiaJob = (job) => {
    const city = (job?.city || '').toLowerCase();
    const state = (job?.state || '').toLowerCase();
    const addr = (job?.street_address || job?.address || '').toLowerCase();
    const pref = (job?.preferred_work_location || '').toLowerCase();
    return (
      city === 'all' ||
      city.includes('all india') ||
      city.includes('pan india') ||
      state === 'all' ||
      state.includes('all india') ||
      addr.includes('all india') ||
      pref.includes('all india')
    );
  };

  // Filtered and sorted jobs
  const getFilteredJobs = () => {
    let result = [...jobData];

    // Search filter
    if (searchText.trim()) {
      const rawQuery = searchText.toLowerCase().trim();
      const queryTerms = rawQuery.split(/\s+/).filter(Boolean);

      result = result.filter(job => {
        const title = (job?.title || '').toLowerCase();
        const city = (job?.city || '').toLowerCase();
        const state = (job?.state || '').toLowerCase();
        const desc = (job?.description || '').toLowerCase();
        const category = (job?.category_name || job?.sub_category_name || '').toLowerCase();
        const fullJobText = `${title} ${city} ${state} ${desc} ${category}`;

        // Direct full query match
        if (fullJobText.includes(rawQuery)) {
          return true;
        }

        // All India jobs match any city search term if the role/title matches
        const isAllIndia = isAllIndiaJob(job);

        return queryTerms.every(term => {
          if (term.length <= 2 && term !== 'in') return true;
          if (fullJobText.includes(term)) return true;
          if (isAllIndia) {
            // For All India jobs, location search terms are automatically matched
            return true;
          }
          return false;
        });
      });
    }

    // Location filter - All India jobs ALWAYS match any selected city filter
    if (selectedLocations.length > 0 && !allIndia) {
      result = result.filter(job => {
        if (isAllIndiaJob(job)) return true;
        const locCity = (job?.city || '').toLowerCase();
        const locState = (job?.state || '').toLowerCase();
        return selectedLocations.some(sel => {
          const selLower = sel.toLowerCase();
          return locCity.includes(selLower) || locState.includes(selLower) || selLower.includes(locCity);
        });
      });
    }

    // Compensation type filter
    if (selectedCompTypes.length > 0) {
      result = result.filter(job => {
        return selectedCompTypes.includes(job?.compensation_type);
      });
    }

    // Sort
    if (selectedSort === 'title_asc') {
      result.sort((a, b) => (a?.title || '').localeCompare(b?.title || ''));
    } else if (selectedSort === 'title_desc') {
      result.sort((a, b) => (b?.title || '').localeCompare(a?.title || ''));
    } else if (selectedSort === 'salary_desc') {
      result.sort((a, b) => {
        const salA = Number(a?.expected_compensation || a?.compensation || 0);
        const salB = Number(b?.expected_compensation || b?.compensation || 0);
        return salB - salA;
      });
    } else if (selectedSort === 'salary_asc') {
      result.sort((a, b) => {
        const salA = Number(a?.expected_compensation || a?.compensation || 0);
        const salB = Number(b?.expected_compensation || b?.compensation || 0);
        return salA - salB;
      });
    }

    return result;
  };
  const filteredJobs = getFilteredJobs();

  // Format compensation display
  const formatCompensation = job => {
    let amount = job?.expected_compensation || job?.compensation;
    if (amount) {
      const num = Number(amount);
      if (!isNaN(num)) {
        amount = num.toLocaleString('en-IN');
      } else {
        amount = String(amount).replace(/\.00$/, '');
      }
    }
    const compType = job?.compensation_type
      ? (job.compensation_type.charAt(0).toUpperCase() + job.compensation_type.slice(1).toLowerCase())
      : '';
    if (amount && compType) {
      return `₹${amount} / ${compType}`;
    }
    return amount ? `₹${amount}` : 'Flexible Pay';
  };

  // Format location display
  const formatLocation = job => {
    if (job?.city && job?.state) {
      return `${job.city}, ${job.state}`;
    }
    return (
      job?.city || job?.state || job?.street_address || 'Location not specified'
    );
  };

  // Get description preview
  const getDescriptionPreview = description => {
    if (!description) return 'No description available...';
    return description.length > 50
      ? description.substring(0, 50) + '...'
      : description;
  };

  const toggleLocation = (loc) => {
    setSelectedLocations(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc],
    );
    if (allIndia) {
      setAllIndia(false);
      JobList();
    }
  };

  const toggleCompType = (ct) => {
    setSelectedCompTypes(prev =>
      prev.includes(ct) ? prev.filter(c => c !== ct) : [...prev, ct],
    );
  };

  const clearFilters = () => {
    setSelectedLocations([]);
    setSelectedCompTypes([]);
    if (allIndia) {
      setAllIndia(false);
      JobList();
    }
    setShowFilterModal(false);
  };

  const hasActiveFilters = selectedLocations.length > 0 || selectedCompTypes.length > 0 || allIndia;

  // Split jobs into featured (first 4) and recent (rest)
  const jobsFeatured = filteredJobs.slice(0, 4);
  const jobsRecent = filteredJobs.slice(4);

  const renderJobCard = (job) => (
    <View key={job.id} style={styles.jobCard}>
      {/* Header Row: Icon + Stay Badge */}
      <View style={styles.cardHeaderRow}>
        <View style={styles.iconCircle}>
          <Image
            source={ImageConstant.Briefcase}
            style={{ height: 18, width: 18, tintColor: '#D98579' }}
          />
        </View>
        {job.stay_type ? (
          <View style={styles.stayTypeBadge}>
            <Typography type={Font.Poppins_Medium} size={11} color="#D98579">
              {job.stay_type === 'come_and_go' ? 'Come & Go' : 'Live-in'}
            </Typography>
          </View>
        ) : null}
      </View>

      {/* Job Title */}
      <Typography
        type={Font.Poppins_SemiBold}
        style={styles.jobTitle}
        numberOfLines={1}
      >
        {job.title}
      </Typography>

      {/* Location */}
      <View style={styles.locationRow}>
        <Image
          source={ImageConstant.Location}
          style={{ height: 13, width: 11, tintColor: '#777', marginRight: 5 }}
        />
        <Typography
          type={Font.Poppins_Regular}
          style={styles.jobLocation}
          numberOfLines={1}
        >
          {formatLocation(job)}
        </Typography>
      </View>

      {/* Salary Pill */}
      <View style={styles.payBadge}>
        <Typography type={Font.Poppins_Bold} style={styles.jobPay}>
          {formatCompensation(job)}
        </Typography>
      </View>

      {/* Description Preview */}
      {job.description ? (
        <Typography
          type={Font.Poppins_Regular}
          style={styles.jobDesc}
          numberOfLines={1}
        >
          {getDescriptionPreview(job.description)}
        </Typography>
      ) : null}

      {/* Action Button */}
      <TouchableOpacity
        style={styles.detailsBtn}
        onPress={() =>
          navigation.navigate('JobDetails', {
            jobId: job.id,
            jobStatus: job?.is_applied,
          })
        }
        activeOpacity={0.85}
      >
        <Typography type={Font.Poppins_SemiBold} size={13} color="#fff">
          {LocalizedStrings.staffSection?.ActiveJobs?.view_details || 'View Details'}
        </Typography>
      </TouchableOpacity>
    </View>
  );

  return (
    <CommanView>
      <HeaderForUser
        title={
          LocalizedStrings.staffSection?.ActiveJobs?.title || 'Active Jobs'
        }
        onPressLeftIcon={() => navigation?.goBack()}
        source_arrow={ImageConstant?.BackArrow}
        style_title={{ fontSize: 18 }}
        source_logo={ImageConstant?.notification}
        onPressRightIcon={() => navigation.navigate('Notifications')}
      />

      <TouchableOpacity
        style={styles.buyCreditsBtn}
        onPress={() => navigation.navigate('StaffWallet')}
      >
        <Image source={ImageConstant?.Dollar} style={{ width: 16, height: 16, tintColor: '#fff', marginRight: 6 }} />
        <Typography type={Font.Poppins_SemiBold} size={12} color="#fff">
          Buy Credits
        </Typography>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E87C6F" />
        </View>
      ) : jobData.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <EmptyView
            title={
              LocalizedStrings.staffSection?.ActiveJobs?.no_jobs ||
              'No Jobs Available'
            }
            description={
              LocalizedStrings.staffSection?.ActiveJobs?.no_jobs_desc ||
              'There are no job listings available at the moment. Please check back later.'
            }
            icon={ImageConstant?.joblisting}
            iconColor="#D98579"
          />
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View style={styles.searchRow}>
            <View style={styles.searchBoxInner}>
              <Image
                source={ImageConstant.search}
                style={{ width: 18, height: 18, tintColor: '#D98579', marginRight: 8 }}
              />
              <TextInput
                placeholder={
                  LocalizedStrings.staffSection?.ActiveJobs?.search_placeholder ||
                  'Search for roles...'
                }
                placeholderTextColor="#999"
                style={styles.searchInputField}
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText ? (
                <TouchableOpacity onPress={() => setSearchText('')} style={{ padding: 4 }}>
                  <Typography color="#888" size={14}>✕</Typography>
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              style={[styles.iconActionBtn, hasActiveFilters && styles.iconActionBtnActive]}
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.8}
            >
              <Typography type={Font.Poppins_Medium} size={13} color={hasActiveFilters ? '#fff' : '#D98579'}>
                {LocalizedStrings.staffSection?.ActiveJobs?.filter || 'Filter'}
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconActionBtn, selectedSort !== 'default' && styles.iconActionBtnActive]}
              onPress={() => setShowSortModal(true)}
              activeOpacity={0.8}
            >
              <Typography type={Font.Poppins_Medium} size={13} color={selectedSort !== 'default' ? '#fff' : '#D98579'}>
                {LocalizedStrings.staffSection?.ActiveJobs?.sort || 'Sort'}
              </Typography>
            </TouchableOpacity>
          </View>

          {/* Filter Toggle Button */}
          <TouchableOpacity
            style={styles.filterToggleBtn}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Image 
              source={ImageConstant?.Briefcase} 
              style={{ 
                width: 16, 
                height: 16, 
                tintColor: showFilters ? '#fff' : '#D98579', 
                marginRight: 8 
              }} 
            />
            <Typography 
              color={showFilters ? '#fff' : '#D98579'} 
              type={Font?.Poppins_Medium}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Typography>
            {hasActiveFilters && (
              <View style={styles.filterActiveDot} />
            )}
          </TouchableOpacity>

          {showFilters && (
            <View style={styles.inlineFilterCard}>
               <Typography type={Font.Poppins_SemiBold} size={15} style={{ marginBottom: 10 }}>
                  Quick Filters
               </Typography>
                <View style={styles.chipContainer}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      allIndia && styles.chipActive,
                    ]}
                    onPress={toggleAllIndia}
                  >
                    <Typography
                      type={Font.Poppins_Regular}
                      size={12}
                      color={allIndia ? '#fff' : '#333'}
                    >
                      All India
                    </Typography>
                  </TouchableOpacity>
                  {filterOptions.locations.map(loc => (
                    <TouchableOpacity
                      key={loc}
                      style={[
                        styles.chip,
                        selectedLocations.includes(loc) && styles.chipActive,
                      ]}
                      onPress={() => toggleLocation(loc)}
                    >
                      <Typography
                        type={Font.Poppins_Regular}
                        size={12}
                        color={selectedLocations.includes(loc) ? '#fff' : '#333'}
                      >
                        {loc}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
               <View style={styles.chipContainer}>
                  {filterOptions.compTypes.map(ct => (
                    <TouchableOpacity
                      key={ct}
                      style={[
                        styles.chip,
                        selectedCompTypes.includes(ct) && styles.chipActive,
                      ]}
                      onPress={() => toggleCompType(ct)}
                    >
                      <Typography
                        type={Font.Poppins_Regular}
                        size={12}
                        color={selectedCompTypes.includes(ct) ? '#fff' : '#333'}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {ct}
                      </Typography>
                    </TouchableOpacity>
                  ))}
               </View>
               {hasActiveFilters && (
                 <TouchableOpacity 
                   style={{ alignSelf: 'flex-end', marginTop: 5 }} 
                   onPress={clearFilters}
                 >
                    <Typography color="#D98579" size={12} type={Font.Poppins_Medium}>Clear Filters</Typography>
                 </TouchableOpacity>
               )}
            </View>
          )}

          {filteredJobs.length === 0 ? (
            <View style={styles.noResultsWrapper}>
              <Typography type={Font.Poppins_Medium} size={15} color="#999">
                No jobs match your search
              </Typography>
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => {
                  setSearchText('');
                  clearFilters();
                  setSelectedSort('default');
                }}
              >
                <Typography type={Font.Poppins_Medium} size={14} color="#E87C6F">
                  Clear All
                </Typography>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {jobsFeatured.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Typography
                      type={Font.Poppins_Bold}
                      style={styles.sectionTitle}
                    >
                      {LocalizedStrings.staffSection?.ActiveJobs?.featured_jobs ||
                        'Featured Jobs'}
                    </Typography>
                  </View>

                  <View style={styles.grid}>
                    {jobsFeatured.map(renderJobCard)}
                  </View>
                </>
              )}

              {jobsRecent.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Typography
                      type={Font.Poppins_Bold}
                      style={styles.sectionTitle}
                    >
                      {LocalizedStrings.staffSection?.ActiveJobs?.recently_added ||
                        'Recently Added'}
                    </Typography>
                  </View>
                  <View style={styles.grid}>
                    {jobsRecent.map(renderJobCard)}
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Typography type={Font.Poppins_SemiBold} size={17} style={styles.modalTitle}>
              Sort By
            </Typography>
            {SORT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  selectedSort === option.value && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSelectedSort(option.value);
                  setShowSortModal(false);
                }}
              >
                <Typography
                  type={selectedSort === option.value ? Font.Poppins_SemiBold : Font.Poppins_Regular}
                  size={14}
                  color={selectedSort === option.value ? '#E87C6F' : '#333'}
                >
                  {option.label}
                </Typography>
                {selectedSort === option.value && (
                  <View style={styles.radioSelected} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Typography type={Font.Poppins_SemiBold} size={17}>
                Filter Jobs
              </Typography>
              {hasActiveFilters && (
                <TouchableOpacity onPress={clearFilters}>
                  <Typography type={Font.Poppins_Medium} size={13} color="#E87C6F">
                    Clear All
                  </Typography>
                </TouchableOpacity>
              )}
            </View>

            {filterOptions.locations.length > 0 && (
              <>
                <Typography type={Font.Poppins_SemiBold} size={14} style={styles.filterSectionTitle}>
                  Location
                </Typography>
                <View style={styles.chipContainer}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      allIndia && styles.chipActive,
                    ]}
                    onPress={toggleAllIndia}
                  >
                    <Typography
                      type={Font.Poppins_Regular}
                      size={13}
                      color={allIndia ? '#fff' : '#333'}
                    >
                      All India
                    </Typography>
                  </TouchableOpacity>
                  {filterOptions.locations.map(loc => (
                    <TouchableOpacity
                      key={loc}
                      style={[
                        styles.chip,
                        selectedLocations.includes(loc) && styles.chipActive,
                      ]}
                      onPress={() => toggleLocation(loc)}
                    >
                      <Typography
                        type={Font.Poppins_Regular}
                        size={13}
                        color={selectedLocations.includes(loc) ? '#fff' : '#333'}
                      >
                        {loc}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {filterOptions.compTypes.length > 0 && (
              <>
                <Typography type={Font.Poppins_SemiBold} size={14} style={styles.filterSectionTitle}>
                  Pay Type
                </Typography>
                <View style={styles.chipContainer}>
                  {filterOptions.compTypes.map(ct => (
                    <TouchableOpacity
                      key={ct}
                      style={[
                        styles.chip,
                        selectedCompTypes.includes(ct) && styles.chipActive,
                      ]}
                      onPress={() => toggleCompType(ct)}
                    >
                      <Typography
                        type={Font.Poppins_Regular}
                        size={13}
                        color={selectedCompTypes.includes(ct) ? '#fff' : '#333'}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {ct}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {filterOptions.locations.length === 0 && filterOptions.compTypes.length === 0 && (
              <Typography type={Font.Poppins_Regular} size={14} color="#999" style={{ textAlign: 'center', marginVertical: 20 }}>
                No filter options available
              </Typography>
            )}

            <TouchableOpacity
              style={styles.applyFilterBtn}
              onPress={() => setShowFilterModal(false)}
            >
              <Typography type={Font.Poppins_SemiBold} size={14} color="#fff">
                Apply Filters
              </Typography>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </CommanView>
  );
};

export default JobsList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginHorizontal: 16,
  },
  searchBoxInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#F0E5E2',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInputField: {
    flex: 1,
    fontSize: 14,
    color: '#222',
    fontFamily: Font.Poppins_Regular,
    paddingVertical: 0,
  },
  iconActionBtn: {
    height: 44,
    paddingHorizontal: 14,
    backgroundColor: '#FFF5F3',
    borderWidth: 1.5,
    borderColor: '#D98579',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconActionBtnActive: {
    backgroundColor: '#D98579',
    borderColor: '#D98579',
  },
  filterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#FFF0EE',
    borderWidth: 1,
    borderColor: '#D98579',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
    marginBottom: 10,
    marginRight: 16,
  },
  filterActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D98579',
    marginLeft: 6,
  },
  inlineFilterCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#222',
  },
  viewAll: {
    fontSize: 13,
    color: '#E87C6F',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 16,
  },
  jobCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#F0E5E2',
    shadowColor: '#D98579',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stayTypeBadge: {
    backgroundColor: '#FFF5F3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F9D0CB',
  },
  jobTitle: {
    fontSize: 15,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  jobLocation: {
    fontSize: 11,
    color: '#666',
    flex: 1,
  },
  payBadge: {
    backgroundColor: '#FFF5F3',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginVertical: 6,
    alignItems: 'flex-start',
  },
  jobPay: {
    fontSize: 13,
    color: '#D98579',
  },
  jobDesc: {
    fontSize: 11,
    color: '#888',
    marginBottom: 8,
  },
  detailsBtn: {
    backgroundColor: '#D98579',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsWrapper: {
    alignItems: 'center',
    marginTop: 60,
  },
  clearSearchBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E87C6F',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    marginBottom: 16,
    color: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  sortOptionActive: {
    backgroundColor: '#FFF0EE',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E87C6F',
  },
  filterSectionTitle: {
    color: '#333',
    marginBottom: 10,
    marginTop: 6,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  chipActive: {
    backgroundColor: '#E87C6F',
    borderColor: '#E87C6F',
  },
  applyFilterBtn: {
    backgroundColor: '#E87C6F',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buyCreditsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#D98579',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 16,
    marginTop: 10,
    marginBottom: 4,
  },
});
