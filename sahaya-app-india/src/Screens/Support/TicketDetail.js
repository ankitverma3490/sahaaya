import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, TextInput, Keyboard, TouchableOpacity } from 'react-native';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import Button from '../../Component/Button';
import { ImageConstant } from '../../Constants/ImageConstant';
import { GET_WITH_TOKEN, POST_WITH_TOKEN } from '../../Backend/Backend';
import { SupportTicketDetail, SupportTicketComment } from '../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import moment from 'moment';

const STATUS_COLORS = {
  Open: { bg: '#DBEAFE', text: '#1D4ED8' },
  'On Hold': { bg: '#FEF3C7', text: '#B45309' },
  Escalated: { bg: '#FEE2E2', text: '#DC2626' },
  Closed: { bg: '#F3F4F6', text: '#6B7280' },
};

const stripHtml = (html) => {
  if (!html) return '';
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?div>/gi, '\n')
    .replace(/<\/?p>/gi, '\n')
    .replace(/<\/?span[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text;
};

const TicketDetail = ({ navigation, route }) => {
  const { ticketId } = route?.params || {};
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, []);

  const fetchTicket = () => {
    setLoading(true);
    GET_WITH_TOKEN(
      `${SupportTicketDetail}/${ticketId}`,
      success => {
        setTicket(success?.data?.ticket || null);
        setComments(success?.data?.comments || []);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );
  };

  const handleSendComment = () => {
    if (!commentText.trim() || sending) return;
    Keyboard.dismiss();

    setSending(true);
    POST_WITH_TOKEN(
      `${SupportTicketComment}/${ticketId}/comment`,
      { comment: commentText.trim() },
      success => {
        setSending(false);
        setCommentText('');
        SimpleToast.show('Comment sent', SimpleToast.SHORT);
        fetchTicket();
      },
      error => {
        setSending(false);
        SimpleToast.show(error?.message || 'Failed to send comment', SimpleToast.SHORT);
      },
      () => {
        setSending(false);
        SimpleToast.show('Network error', SimpleToast.SHORT);
      },
    );
  };

  const getStatusStyle = status => STATUS_COLORS[status] || STATUS_COLORS.Open;

  if (loading) {
    return (
      <CommanView>
        <HeaderForUser
          title="Ticket Details"
          style_title={{ fontSize: 18 }}
          source_arrow={ImageConstant?.BackArrow}
          onPressLeftIcon={() => navigation.goBack()}
        />
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#D98579" />
        </View>
      </CommanView>
    );
  }

  if (!ticket) {
    return (
      <CommanView>
        <HeaderForUser
          title="Ticket Details"
          style_title={{ fontSize: 18 }}
          source_arrow={ImageConstant?.BackArrow}
          onPressLeftIcon={() => navigation.goBack()}
        />
        <View style={styles.emptyContainer}>
          <Typography type={Font.Poppins_Medium} size={15} color="#999">Ticket not found</Typography>
        </View>
      </CommanView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <HeaderForUser
        title="Ticket Details"
        style_title={{ fontSize: 18 }}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        style={{ flex: 1 }}
      >
        {/* Ticket Info Card */}
        <View style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <Typography type={Font.Poppins_SemiBold} size={16} color="#1A1A1A">
                {ticket.subject}
              </Typography>
              <View style={[styles.statusTag, { backgroundColor: getStatusStyle(ticket.status).bg }]}>
                <Typography type={Font.Poppins_SemiBold} size={11} color={getStatusStyle(ticket.status).text}>
                  {ticket.status}
                </Typography>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Typography type={Font.Poppins_Regular} size={12} color="#888">Category</Typography>
              <Typography type={Font.Poppins_Medium} size={12}>{ticket.category || '-'}</Typography>
            </View>
            <View style={styles.infoRow}>
              <Typography type={Font.Poppins_Regular} size={12} color="#888">Priority</Typography>
              <Typography type={Font.Poppins_Medium} size={12}>{ticket.priority}</Typography>
            </View>
            <View style={styles.infoRow}>
              <Typography type={Font.Poppins_Regular} size={12} color="#888">Created</Typography>
              <Typography type={Font.Poppins_Medium} size={12}>
                {moment(ticket.created_at).format('DD MMM YYYY, h:mm A')}
              </Typography>
            </View>
            {ticket.zoho_ticket_id ? (
              <View style={styles.infoRow}>
                <Typography type={Font.Poppins_Regular} size={12} color="#888">Zoho ID</Typography>
                <Typography type={Font.Poppins_Medium} size={12} color="#D98579">
                  {ticket.zoho_ticket_id}
                </Typography>
              </View>
            ) : null}

            {ticket.description ? (
              <View style={{ marginTop: 12 }}>
                <Typography type={Font.Poppins_Regular} size={13} color="#555" lineHeight={20}>
                  {ticket.description}
                </Typography>
              </View>
            ) : null}
          </View>

          {/* Comments Section */}
          <Typography type={Font.Poppins_SemiBold} size={14} color="#333" style={styles.sectionTitle}>
            Responses ({comments.length})
          </Typography>

          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Typography type={Font.Poppins_Regular} size={12} color="#BBB">
                No responses yet. Send a message below.
              </Typography>
            </View>
          ) : (
            comments.map((comment, index) => (
              <View key={index} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Typography type={Font.Poppins_SemiBold} size={12} color="#333">
                    {comment.author || 'Support Team'}
                  </Typography>
                  <Typography type={Font.Poppins_Regular} size={11} color="#AAA">
                    {comment.created_at ? moment(comment.created_at).fromNow() : ''}
                  </Typography>
                </View>
                <Typography type={Font.Poppins_Regular} size={13} color="#555" lineHeight={20}>
                  {stripHtml(comment.content || comment.comment || '')}
                </Typography>
              </View>
            ))
          )}
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <View style={styles.commentInputWrapper}>
          <TextInput
            placeholder="Type your message..."
            placeholderTextColor="#999"
            value={commentText}
            onChangeText={setCommentText}
            style={styles.textInput}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSendComment}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.sendButtonContainer,
            (!commentText.trim() || sending) && { opacity: 0.6 },
          ]}
          onPress={handleSendComment}
          activeOpacity={0.8}
          disabled={sending || !commentText.trim()}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Typography type={Font.Poppins_SemiBold} size={14} color="#FFFFFF">
              Send
            </Typography>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default TicketDetail;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#EBEBEA',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  commentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  commentInputWrapper: {
    flex: 1,
    marginRight: 10,
  },
  textInput: {
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 18,
    fontSize: 14,
    color: '#333',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  sendButtonContainer: {
    height: 46,
    paddingHorizontal: 22,
    borderRadius: 23,
    backgroundColor: '#D98579',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
