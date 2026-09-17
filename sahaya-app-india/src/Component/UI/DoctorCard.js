import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {ImageConstant} from '../../Constants/ImageConstant';
import Typography from './Typography';
import Button from '../Button';
import {Font} from '../../Constants/Font';

// Get device width and height
const {width, height} = Dimensions.get('window');

const DoctorCard = ({doctor, navigation}) => {
  return (
    <View style={styles.card}>
      {/* Left - Image and Distance */}
      <View style={{flexDirection: 'column', alignItems: 'center'}}>
        <Image source={doctor.image} style={styles.image} />
        <Typography style={styles.distanceText}>7 km away</Typography>
      </View>

      {/* Right - Details */}
      <View style={styles.details}>
        {/* Name & Verified Icon */}
        <View style={styles.row}>
          <Typography
            size={16}
            fontWeight={600}
            type={Font?.Poppins_Medium}
            style={styles.name}>
            {doctor.name}
          </Typography>
          <Image source={ImageConstant?.verify} style={styles.iconSmall} />
        </View>

        {/* Qualification */}
        <Typography style={styles.qualification}>
          {doctor.qualification}
        </Typography>

        {/* Rating */}
        <View style={styles.row}>
          {[...Array(5)].map((_, index) => (
            <Image
              key={index}
              source={ImageConstant?.star}
              style={styles.icon}
            />
          ))}
          <Typography style={styles.reviews}>({doctor.reviews})</Typography>
        </View>

        {/* Fees */}
        <Typography style={styles.fees}>Fees - Rs {doctor.fees}</Typography>

        {/* View Details Button */}
        <Button
          title={'View Details'}
          onPress={() => {
            navigation?.navigate('ProfileScreen');
          }}
          main_style={styles.buttonMain}
          style={styles.buttonStyle}
          linerColor={['#029991', '#04756F']}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {/* <TouchableOpacity style={styles.iconContainer}>
          <Image source={ImageConstant?.message} style={styles.iconMedium} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconContainer}>
          <Image
            source={ImageConstant?.phone}
            style={[styles.iconMedium, {tintColor: '#029991'}]}
          />
        </TouchableOpacity> */}
        <TouchableOpacity style={styles.iconContainer}>
          <Image
            source={ImageConstant?.heart}
            style={[styles.iconMedium, {tintColor: '#B4AFAF'}]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DoctorCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#F1F6FC',
    borderRadius: width * 0.02,
    padding: width * 0.04,
    marginVertical: height * 0.01,
    marginHorizontal: width * 0.02,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: height * 0.005},
  },
  image: {
    width: width * 0.18,
    height: width * 0.18,
    borderRadius: width * 0.02,
    marginBottom: height * 0.005,
  },
  distanceText: {
    fontSize: width * 0.035,
    color: '#777',
  },
  details: {
    flex: 1,
    justifyContent: 'space-between',
    paddingLeft: width * 0.02,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    color: '#029991',
  },
  qualification: {
    fontSize: width * 0.035,
    color: '#444',
    marginVertical: height * 0.005,
  },
  reviews: {
    fontSize: width * 0.032,
    color: '#666',
    marginLeft: width * 0.01,
  },
  fees: {
    fontSize: width * 0.038,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: height * 0.008,
  },
  actions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: width * 0.1,
    alignItems: 'flex-end',
  },
  iconContainer: {
    padding: width * 0.02,
  },
  icon: {
    width: width * 0.04,
    height: width * 0.04,
    marginRight: width * 0.01,
  },
  iconSmall: {
    width: width * 0.04,
    height: width * 0.04,
    marginLeft: width * 0.01,
  },
  iconMedium: {
    width: width * 0.05,
    height: width * 0.05,
  },
  buttonMain: {
    height: height * 0.05,
    marginTop: height * -0.01,
    marginBottom: height * 0.01,
  },
  buttonStyle: {
    height: height * 0.05,
    backgroundColor: '#029991',
    marginHorizontal: 0,
    borderRadius: 7,
  },
});
