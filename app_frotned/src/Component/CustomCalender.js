import React from 'react';
import {View, TouchableOpacity,} from 'react-native';
import moment from 'moment'; // Import moment for date manipulation
import Typography from './UI/Typography';
import { Font } from '../Constants/Font';

const CustomCalendar = ({currentDate, onDateChange,isFouced}) => {
  


  const renderWeekDays = () => {
    const startOfWeek = moment(currentDate).clone().startOf('week');
    const endOfWeek = moment(currentDate).clone().endOf('week');
    const days = [];

    let day = moment(startOfWeek); 

    while (day <= endOfWeek) {
      days.push({
        date: day.format('YYYY-MM-DD'),
        dayOfWeek: day.format('ddd'),
        isCurrent: isCurrentDate(day),
      });
      day.add(1, 'day'); 
    }

    return days;
  };

  const isCurrentDate = date => {
    return moment(date).isSame(isFouced, 'day');
  };

  const renderedWeekDays = renderWeekDays();


  return (
    <View style={{flexDirection: 'row', marginVertical: 10,}}>
      {renderedWeekDays.map(dayData => {
        return (
          <TouchableOpacity
            key={dayData.date}
            onPress={() => onDateChange(moment(dayData.date))}
            style={{
              flex: 1,
              alignItems: 'center',
              marginTop: 10,
            }}>
            <View
              style={{
                padding: 7,
                justifyContent: 'center',
                alignItems: 'center',
                width: 50,
                borderRadius: 10,
                backgroundColor: dayData?.isCurrent
                    ? 'rgba(2, 153, 145, 1)':null
              }}>
              <Typography
              type={Font?.Poppins_Medium}
                color={
                  dayData?.isCurrent
                    ? '#fff'
                    : '#000'
                }
                style={{}}>
                {dayData.dayOfWeek}
              </Typography>
              <Typography
                color={
                  dayData?.isCurrent
                    ? '#fff'
                    : '#000'
                }
                type="semibold"
                >
                {moment(dayData.date).format('D')}
              </Typography>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default CustomCalendar;
