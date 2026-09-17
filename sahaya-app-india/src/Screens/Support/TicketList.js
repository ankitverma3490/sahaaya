import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, ScrollView } from 'react-native';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import { GET_WITH_TOKEN } from '../../Backend/Backend';
import { SupportTicketList } from '../../Backend/api_routes';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';

const STATUS_COLORS = {
  Open: { bg: '#DBEAFE', text: '#1D4ED8' },
  'On Hold': { bg: '#FEF3C7', text: '#B45309' },
  Escalated: { bg: '#FEE2E2', text: '#DC2626' },
  Closed: { bg: '#F3F4F6', text: '#6B7280' },
};

const PRIORITY_COLORS = {
  Low: { bg: '#F0FDF4', text: '#16A34A' },
  Medium: { bg: '#FEF3C7', text: '#D97706' },
  High: { bg: '#FEE2E2', text: '#DC2626' },
  Urgent: { bg: '#FEE2E2', text: '#991B1B' },
};

const FILTER_OPTIONS = ['All', 'Open', 'On Hold', 'Escalated', 'Closed'];

const TicketList = ({ navigation }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchTickets = useCallback(() => {
    GET_WITH_TOKEN(
      `${SupportTicketList}?status=${activeFilter}`,
      success => {
        setTickets(success?.data || []);
        setLoading(false);
        setRefreshing(false);
      },
      () => {
        setLoading(false);
        setRefreshing(false);
      },
      () => {
        setLoading(false);
        setRefreshing(false);
      },
    );
  }, [activeFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
    }, [fetchTickets]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const getStatusStyle = status => STATUS_COLORS[status] || STATUS_COLORS.Open;
  const getPriorityStyle = priority => PRIORITY_COLORS[priority] || PRIORITY_COLORS.Medium;

  const renderTicket = ({ item }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.ticketHeader}>
        <Typography type={Font.Poppins_SemiBold} size={14} color="#1A1A1A" numberOfLines={1} style={{ flex: 1 }}>
          {item.subject}
        </Typography>
        <View style={[styles.statusTag, { backgroundColor: getStatusStyle(item.status).bg }]}>
          <Typography type={Font.Poppins_SemiBold} size={11} color={getStatusStyle(item.status).text}>
            {item.status}
          </Typography>
        </View>
      </View>

      {item.description ? (
        <Typography type={Font.Poppins_Regular} size={12} color="#888" numberOfLines={2} style={styles.ticketDesc}>
          {item.description}
        </Typography>
      ) : null}

      <View style={styles.ticketFooter}>
        {item.category ? (
          <View style={styles.tag}>
            <Typography type={Font.Poppins_Regular} size={11} color="#6B7280">
              {item.category}
            </Typography>
          </View>
        ) : null}
        <View style={[styles.tag, { backgroundColor: getPriorityStyle(item.priority).bg }]}>
          <Typography type={Font.Poppins_SemiBold} size={11} color={getPriorityStyle(item.priority).text}>
            {item.priority}
          </Typography>
        </View>
        <Typography type={Font.Poppins_Regular} size={11} color="#AAA">
          {moment(item.created_at).fromNow()}
        </Typography>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <HeaderForUser
        title="Support Tickets"
        style_title={{ fontSize: 18 }}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
        source_logo={ImageConstant?.ic_plus}
        onPressRightIcon={() => navigation.navigate('CreateTicket')}
      />

      {/* Filter Tabs */}
      <View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_OPTIONS.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterTab, activeFilter === filter && styles.filterTabActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Typography
                type={Font.Poppins_Medium}
                size={12}
                color={activeFilter === filter ? '#fff' : '#666'}
              >
                {filter}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={tickets}
        renderItem={renderTicket}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#D98579" />
              <Typography type={Font.Poppins_Regular} size={12} color="#999" style={{ marginTop: 10 }}>
                Loading tickets...
              </Typography>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Typography type={Font.Poppins_Medium} size={15} color="#999" textAlign="center">
                No tickets found
              </Typography>
              <Typography type={Font.Poppins_Regular} size={12} color="#BBB" textAlign="center" style={{ marginTop: 6 }}>
                Tap + to create a new support ticket
              </Typography>
            </View>
          )
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTicket')}
        activeOpacity={0.8}
      >
        <Typography type={Font.Poppins_SemiBold} size={30} color="#fff" style={{ marginTop: -2 }}>
          +
        </Typography>
      </TouchableOpacity>
    </View>
  );
};

export default TicketList;

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#D98579',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#EBEBEA',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  ticketDesc: {
    marginTop: 6,
    lineHeight: 18,
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D98579',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
  },
});
