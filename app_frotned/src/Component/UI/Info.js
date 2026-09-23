import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import Typography from '../../Component/UI/Typography'; // Import Typography if it's a custom component
import { Font } from '../../Constants/Font'; // Ensure Font is imported
import { Colors } from '../../Constants/Colors'; // Ensure Colors is imported
import { ImageConstant } from '../../Constants/ImageConstant'; // Import ImageConstant for the dropdown icon

const Info = ({ title, info, data = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false); // State to track toggle status

  const handleToggle = () => {
    setIsExpanded(prevState => !prevState); // Toggle the expanded state
  };

  return (
    <View style={styles.MedicalInfo}>
      <View style={styles.Container}>
        <Typography lineHeight={24} size={16} type={Font.Poppins_Medium}>{title}</Typography>
        {info ? (
          <View style={styles.infoBox}>
            <Typography size={13} lineHeight={20} color='#5D637A'>{info}</Typography>
          </View>
        ) : (
          <TouchableOpacity style={styles.dropdownButton} onPress={handleToggle}>
            <Image
              source={isExpanded ? ImageConstant.expanded : ImageConstant.dropdown}
              style={styles.dropdownIcon}
            />
          </TouchableOpacity>
        )}
      </View>
      {isExpanded && data.length > 0 && (
        <View style={styles.dataContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.infoBox}>
              <Typography size={13} lineHeight={20} color='#5D637A'>{item}</Typography>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default Info;

const styles = StyleSheet.create({
  MedicalInfo: {
    width: "100%",
    padding: 10,
    borderRadius: 14,
    marginVertical: 8,
    backgroundColor: Colors.white,
    elevation: 2,
    shadowColor: '#171717',
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  Container: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dataContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#F2F3F7",
    marginVertical: 4,
    marginHorizontal: 12,
  },
  dropdownButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  dropdownIcon: {
    height: 24,
    width: 24,
  },
});
