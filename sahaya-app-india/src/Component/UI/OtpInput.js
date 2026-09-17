import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {Font} from '../../Constants/Font';
import Typography from './Typography';
import {Colors} from '../../Constants/Colors';
import BackgroundTimer from 'react-native-background-timer';

const OtpInput = ({
  value,
  setValue,
  onChangeText = () => {}, 
  error,
  mainStyle,
  resendOtp=()=>{}
}) => {
  const CELL_COUNT = 6;
  const ref = useBlurOnFulfill({value, cellCount: CELL_COUNT});
  const [counter, setCounter] = useState(60);
  const [prop, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });
  useEffect(() => {
    let intervalId;
    if (counter > 0) {
      intervalId = BackgroundTimer.setInterval(() => {
        setCounter(prevCounter => prevCounter - 1);
      }, 1000);
    }
    return () => {
      if (intervalId) {
        BackgroundTimer.clearInterval(intervalId);
      }
    };
  }, [counter]);

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginVertical: 5,
        borderWidth: 1,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.lightgrey,
        borderRadius: 14,
        padding: 5,
        paddingTop: 20,
      }}>
      <View style={[{}, mainStyle]}>
        <CodeField
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          cellCount={CELL_COUNT}
          rootStyle={[styles.codeFieldRoot]}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          caretHidden={false}
          renderCell={({index, symbol, isFocused}) => (
            <View style={[styles.cell]} key={index}>
              <Typography
                size={20}
                type={Font?.Poppins_Bold}
                style={{textAlign: 'center'}}
                onLayout={getCellOnLayoutHandler(index)}>
                {symbol || (isFocused ? <Cursor /> : '')}
              </Typography>
            </View>
          )}
        />
        {error && <Typography style={styles.errorText}>{error}</Typography>}
        <View
          style={{flexDirection: 'row', marginTop: 15, alignSelf: 'center'}}>
          <Typography color='#4D4D4D' type={Font.Poppins_Regular}>Didn't Receive OTP? </Typography>
          <TouchableOpacity
            onPress={() => {
              setCounter(60);
              resendOtp()
              // OnResend();
            }}
            disabled={counter > 0}>
            <Typography
              type={Font.Poppins_Medium}
              color={counter > 0 ? Colors.grey : Colors.blue}
              style={{
                textDecorationLine: 'underline',
              }}>
              Resend OTP
            </Typography>
          </TouchableOpacity>
        </View>
        {counter > 0 && <Typography
        size={16}
          textAlign={'center'}
          type={Font.Poppins_Medium}
          color={Colors.blue}
          style={{
            marginVertical: 15,
          }}>
          {/* {(counter < 10 ? '00:0' + counter : '00:' + counter) + ''}{' '} */}
          {counter} Sec
        </Typography>}
      </View>
    </View>
  );
};

export default OtpInput;

const styles = StyleSheet.create({
  codeFieldRoot: {
    alignSelf: 'center',
  },
  focusCell: {
    width: widthPercentageToDP(14),
    height: heightPercentageToDP(7),
    borderWidth: 1.5,
    borderColor: '#0C0E2310',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  cell: {
    width: widthPercentageToDP(12),
    height: widthPercentageToDP(13),
    borderWidth: 1,
    borderColor: '#0C0E2310',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    marginVertical: 5
  },
  errorText: {
    color: 'red',
    fontSize: 11,
    marginRight: 5,
    textAlign: 'right',
    marginTop: 5
  },
});
