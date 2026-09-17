import * as React from 'react';
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {Colors} from '../../Constants/Colors';

export const FocusAwareStatusBar = React.memo(
  ({
    backgroundColor = '#FFFFFF',
    translucent = false,
    barStyle = 'dark-content',
    ...props
  }) => {
    const isFocused = useIsFocused();
    return Platform.OS === 'ios' ? (
      isFocused && (
        <View style={[styles.statusBar, {backgroundColor}]}>
            <StatusBar
              translucent={translucent}
              animated={true}
              barStyle={barStyle}
              backgroundColor={backgroundColor}
              {...props}
            />
        </View>
      )
    ) : isFocused ? (
      <StatusBar
        translucent={translucent}
        backgroundColor={backgroundColor}
        barStyle={barStyle}
        {...props}
      />
    ) : null;
  },
);
const STATUSBAR_HEIGHT = StatusBar.currentHeight;
const styles = StyleSheet.create({
  statusBar: {
    height: STATUSBAR_HEIGHT,
  },
});
