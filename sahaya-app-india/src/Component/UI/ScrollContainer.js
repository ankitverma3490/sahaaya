import React, {useEffect, useRef} from 'react';
import {StyleSheet, ScrollView, View} from 'react-native';
import {Colors} from '../../Constants/Colors';

export const ScrollContainer = ({
  children,
  backgroundColor = Colors.white,
  style = {},
  scrollStyle = {},
  showsVerticalScrollIndicator = false,
  contentContainerStyle = {},
  scrollEnabled = true,
  paddingBottom = 20,
  stickyHeaderIndices,
}) => {
  return (
      <ScrollView
        nestedScrollEnabled={true}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[contentContainerStyle, {paddingBottom}]}
        stickyHeaderIndices={stickyHeaderIndices}
        style={[styles.scroll, scrollStyle]}>
        {children}
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {},
});
