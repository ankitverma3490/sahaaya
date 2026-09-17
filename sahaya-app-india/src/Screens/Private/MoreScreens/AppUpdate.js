import {
  StyleSheet,
  View,
  ActivityIndicator,
  Linking,
  Image,
  RefreshControl,
  ScrollView,
} from 'react-native';
import React, {useState, useEffect, useCallback} from 'react';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import Typography from '../../../Component/UI/Typography';
import {Font} from '../../../Constants/Font';
import {ImageConstant} from '../../../Constants/ImageConstant';
import Button from '../../../Component/Button';
import {useNavigation} from '@react-navigation/native';

const GITHUB_REPO = 'Aftab-web-dev/sahayyamain';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

const AppUpdate = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [release, setRelease] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const fetchLatestRelease = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(GITHUB_API_URL, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('No releases found. Please check back later.');
        } else {
          setError('Failed to fetch update info. Please try again.');
        }
        return;
      }

      const data = await response.json();

      // Find APK asset from release assets
      const apkAsset = data.assets?.find(
        asset =>
          asset.name?.endsWith('.apk') &&
          asset.content_type === 'application/vnd.android.package-archive',
      ) || data.assets?.find(asset => asset.name?.endsWith('.apk'));

      setRelease({
        version: data.tag_name?.replace(/^v/, '') || data.tag_name,
        tagName: data.tag_name,
        name: data.name,
        body: data.body,
        publishedAt: data.published_at,
        apkUrl: apkAsset?.browser_download_url,
        apkSize: apkAsset?.size,
        apkName: apkAsset?.name,
        downloadCount: apkAsset?.download_count || 0,
        htmlUrl: data.html_url,
      });
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestRelease();
  }, [fetchLatestRelease]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLatestRelease();
  }, [fetchLatestRelease]);

  const handleDownload = async () => {
    if (!release?.apkUrl) return;
    try {
      setDownloading(true);
      await Linking.openURL(release.apkUrl);
    } catch (err) {
      // Fallback to release page
      if (release?.htmlUrl) {
        await Linking.openURL(release.htmlUrl);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleViewReleasePage = async () => {
    if (release?.htmlUrl) {
      await Linking.openURL(release.htmlUrl);
    }
  };

  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatSize = bytes => {
    if (!bytes) return '';
    const mb = (bytes / (1024 * 1024)).toFixed(1);
    return `${mb} MB`;
  };

  return (
    <CommanView>
      <HeaderForUser
        title="App Update"
        style_title={{fontSize: 18}}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D98579" />
          <Typography
            type={Font.Poppins_Regular}
            size={14}
            color="#999"
            style={{marginTop: 15}}>
            Checking for updates...
          </Typography>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Image
            source={ImageConstant?.ic_about}
            style={styles.errorIcon}
            tintColor="#999"
          />
          <Typography
            type={Font.Poppins_Medium}
            size={15}
            color="#666"
            style={{marginTop: 15, textAlign: 'center'}}>
            {error}
          </Typography>
          <Button
            title="Retry"
            onPress={() => {
              setLoading(true);
              fetchLatestRelease();
            }}
            style={{width: 150, marginTop: 20}}
          />
        </View>
      ) : release ? (
        <View style={{flex: 1}}>
          {/* Version Card */}
          <View style={styles.versionCard}>
            <View style={styles.versionIconContainer}>
              <Image
                source={ImageConstant?.ic_about}
                style={styles.versionIcon}
                tintColor="#D98579"
              />
            </View>
            <Typography type={Font.Poppins_SemiBold} size={22} color="#333">
              {release.name || `Version ${release.version}`}
            </Typography>
            <View style={styles.versionBadge}>
              <Typography type={Font.Poppins_Medium} size={13} color="#D98579">
                v{release.version}
              </Typography>
            </View>
            {release.publishedAt && (
              <Typography
                type={Font.Poppins_Regular}
                size={12}
                color="#999"
                style={{marginTop: 8}}>
                Released on {formatDate(release.publishedAt)}
              </Typography>
            )}
          </View>

          {/* APK Details */}
          {release.apkUrl && (
            <View style={styles.detailsCard}>
              <Typography
                type={Font.Poppins_SemiBold}
                size={14}
                color="#D98579"
                style={{marginBottom: 12}}>
                APK Details
              </Typography>
              <View style={styles.detailRow}>
                <Typography type={Font.Poppins_Regular} size={13} color="#666">
                  File Name
                </Typography>
                <Typography
                  type={Font.Poppins_Medium}
                  size={13}
                  color="#333"
                  style={{flex: 1, textAlign: 'right'}}>
                  {release.apkName}
                </Typography>
              </View>
              {release.apkSize > 0 && (
                <View style={styles.detailRow}>
                  <Typography
                    type={Font.Poppins_Regular}
                    size={13}
                    color="#666">
                    Size
                  </Typography>
                  <Typography
                    type={Font.Poppins_Medium}
                    size={13}
                    color="#333">
                    {formatSize(release.apkSize)}
                  </Typography>
                </View>
              )}
              {release.downloadCount > 0 && (
                <View style={[styles.detailRow, {borderBottomWidth: 0}]}>
                  <Typography
                    type={Font.Poppins_Regular}
                    size={13}
                    color="#666">
                    Downloads
                  </Typography>
                  <Typography
                    type={Font.Poppins_Medium}
                    size={13}
                    color="#333">
                    {release.downloadCount}
                  </Typography>
                </View>
              )}
            </View>
          )}

          {/* Release Notes */}
          {release.body ? (
            <View style={styles.notesCard}>
              <Typography
                type={Font.Poppins_SemiBold}
                size={14}
                color="#D98579"
                style={{marginBottom: 8}}>
                What's New
              </Typography>
              <Typography
                type={Font.Poppins_Regular}
                size={13}
                color="#555"
                style={{lineHeight: 22}}>
                {release.body}
              </Typography>
            </View>
          ) : null}

          {/* Download Button */}
          {release.apkUrl ? (
            <Button
              title={downloading ? 'Opening Download...' : 'Download APK'}
              onPress={handleDownload}
              loader={downloading}
              style={{marginTop: 20, marginBottom: 10}}
            />
          ) : (
            <View style={styles.noApkContainer}>
              <Typography
                type={Font.Poppins_Regular}
                size={13}
                color="#999"
                style={{textAlign: 'center'}}>
                No APK file attached to this release.
              </Typography>
              <Button
                title="View on GitHub"
                onPress={handleViewReleasePage}
                style={{marginTop: 15}}
                linerColor={['#029991', '#029991']}
              />
            </View>
          )}
        </View>
      ) : null}
    </CommanView>
  );
};

export default AppUpdate;

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  errorIcon: {
    width: 50,
    height: 50,
  },
  versionCard: {
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    borderRadius: 16,
    marginTop: 20,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
  },
  versionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(217, 133, 121, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  versionIcon: {
    width: 30,
    height: 30,
  },
  versionBadge: {
    backgroundColor: 'rgba(217, 133, 121, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  detailsCard: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    borderRadius: 12,
    marginTop: 15,
    backgroundColor: '#fff',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  notesCard: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    borderRadius: 12,
    marginTop: 15,
    backgroundColor: '#fff',
  },
  noApkContainer: {
    alignItems: 'center',
    marginTop: 25,
    paddingHorizontal: 20,
  },
});
