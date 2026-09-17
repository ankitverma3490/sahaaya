import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import Button from '../Component/Button';
import {Colors} from '../Constants/Colors';
import {Font} from '../Constants/Font';
import {ImageConstant} from '../Constants/ImageConstant';

const ScheduleModal = () => {
  const [modalVisible, setModalVisible] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(true);

  const timeSlots = [
    '08:00AM',
    '09:00AM',
    '10:00AM',
    '11:00AM',
    '12:00PM',
    '01:00PM',
    '02:00PM',
    '03:00PM',
    '04:00PM',
    '05:00PM',
    '06:00PM',
    '07:00PM',
  ];

  const onSelectTimeSlot = time => {
    setSelectedTime(time);
  };

  return (
    <View style={styles.centeredView}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}>
        <View style={styles.modalView}>
          <View style={{flexDirection: 'row', backgroundColor: 'red'}}>
            <Image
              source={ImageConstant.calendar}
              style={{
                height: 16,
                width: 16,
                margin: 5,
              }}
            />
            <Text style={styles.modalText}>Select Date</Text>
          </View>
          <Text style={styles.modalText}>Select Time Slot</Text>
          <ScrollView contentContainerStyle={styles.timeSlotsContainer}>
            {timeSlots.map((slot, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.timeSlotButton,
                  selectedTime === slot && styles.selectedTimeSlot,
                ]}
                onPress={() => onSelectTimeSlot(slot)}>
                <Text
                  style={[
                    styles.timeSlotText,
                    selectedTime === slot && {color: 'white'},
                  ]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Button title={'Schdule'} title_style={{paddingHorizontal: 80}} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    // alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    fontSize: 16,
    fontFamily: Font.Poppins_Bold,
    color: Colors.black,
    textAlign: 'left',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  timeSlotButton: {
    padding: 10,
    margin: 5,
    borderRadius: 5,
    backgroundColor: Colors.lightgrey,
  },
  selectedTimeSlot: {
    backgroundColor: Colors.blue,
  },
  timeSlotText: {
    color: Colors.grey,
    fontSize: 14,
    fontFamily: Font.Poppins_Regular,
  },
});

export default ScheduleModal;
