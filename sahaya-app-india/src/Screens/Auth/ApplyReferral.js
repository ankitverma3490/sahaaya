import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import {Font} from '../../Constants/Font';
import Button from '../../Component/Button';
import Input from '../../Component/Input';
import {POST_WITH_TOKEN} from '../../Backend/Backend';
import {ReferralApply} from '../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import {useDispatch} from 'react-redux';
import {isAuth} from '../../Redux/action';
import {ImageConstant} from '../../Constants/ImageConstant';

const ApplyReferral = ({navigation}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const Dispatch = useDispatch();

  const proceedToApp = () => {
    Dispatch(isAuth(true));
  };

  const handleApply = () => {
    if (!code.trim()) {
      SimpleToast.show('Please enter a referral code', SimpleToast.SHORT);
      return;
    }
    setLoading(true);
    POST_WITH_TOKEN(
      ReferralApply,
      {referral_code: code.trim()},
      success => {
        setLoading(false);
        SimpleToast.show(
          success?.message || 'Referral code applied!',
          SimpleToast.SHORT,
        );
        proceedToApp();
      },
      error => {
        setLoading(false);
        SimpleToast.show(
          error?.response?.data?.message || 'Invalid referral code',
          SimpleToast.SHORT,
        );
      },
      () => {
        setLoading(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title="Referral Code"
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={proceedToApp}
        style_title={{fontSize: 18}}
      />

      <View style={styles.content}>
        <View style={styles.card}>
          <Typography
            type={Font?.Poppins_SemiBold}
            size={22}
            style={styles.heading}>
            Have a Referral Code?
          </Typography>
          <Typography
            type={Font?.Poppins_Regular}
            size={14}
            color="#8C8D8B"
            style={styles.subtitle}>
            If someone referred you, enter their code below to get free credits!
            Both you and your referrer will be rewarded.
            This is completely optional.
          </Typography>

          <Input
            placeholder="Enter referral code"
            value={code}
            onChange={text => setCode(text)}
            autoCapitalize="characters"
          />

          <Button
            title={loading ? 'Applying...' : 'Apply Code'}
            onPress={handleApply}
            main_style={{width: '100%', marginTop: 15}}
            disabled={loading}
            loader={loading}
          />
        </View>

        <Button
          title="Skip"
          onPress={proceedToApp}
          main_style={styles.skipBtn}
          linerColor={['#8C8D8B', '#8C8D8B']}
        />
      </View>
    </CommanView>
  );
};

export default ApplyReferral;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 30,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#EBEBEA',
  },
  heading: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 20,
    lineHeight: 20,
  },
  skipBtn: {
    width: '100%',
    marginTop: 20,
  },
});
