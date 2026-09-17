import React, { useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { ImageConstant } from '../../Constants/ImageConstant';

const { width } = Dimensions.get('window');

const CustomCarousel = ({ data, itemWidth = width * 0.8, interval = 3000 }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const currentIndex = useRef(0);
  const isManualScroll = useRef(false);

  useEffect(() => {
    let timeoutId;

    const startAutoScroll = () => {
      timeoutId = setTimeout(() => {
        if (!isManualScroll.current && flatListRef.current) {
          currentIndex.current = (currentIndex.current + 1) % data.length;
          Animated.timing(scrollX, {
            toValue: currentIndex.current * (itemWidth + 10),
            duration: 500, // Smooth animation
            useNativeDriver: false,
          }).start(() => {
            flatListRef.current?.scrollToIndex({
              index: currentIndex.current,
              animated: true,
            });
          });
        }
        startAutoScroll(); // Restart auto-scroll
      }, interval);
    };

    startAutoScroll();

    return () => clearTimeout(timeoutId);
  }, [data, interval]);

  const renderItem = ({ item }) => (
    <View style={[styles.slide, { width: itemWidth }]}>
      <Image
        source={ImageConstant?.banner}
        style={{ width: '100%', height: 150, borderRadius: 10 }}
        resizeMode="contain"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={data}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {x: scrollX}}}],
          {useNativeDriver: false},
        )}
        snapToInterval={itemWidth + 10} // Adjusting for spacing
        decelerationRate="fast"
        scrollEventThrottle={16}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  slide: {
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5, // Adding some spacing between slides
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CustomCarousel;
