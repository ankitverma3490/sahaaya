import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import Button from '../../Component/Button';
import Input from '../../Component/Input';
import DropdownComponent from '../../Component/DropdownComponent';
import UploadBox from '../../Component/UploadBox';
import ImageModal from '../../Component/Modals/ImageModal';
import { ImageConstant } from '../../Constants/ImageConstant';
import { POST_WITH_TOKEN, POST_FORM_DATA, GET_WITH_TOKEN } from '../../Backend/Backend';
import { SupportTicketCreate, SupportCategories } from '../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';

const CreateTicket = ({ navigation }) => {
  const [subject, setSubject] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(null);
  const [priority, setPriority] = useState(null);
  const [image, setImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const [errors, setErrors] = useState({
    subject: '',
    email: '',
    description: '',
    category: '',
    priority: '',
  });

  const priorityData = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
    { label: 'Urgent', value: 'Urgent' },
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    GET_WITH_TOKEN(
      SupportCategories,
      success => {
        const cats = (success?.data || []).map(c => ({
          label: c,
          value: c,
        }));
        setCategories(cats);
      },
      () => {},
      () => {},
    );
  };

  const clearError = field => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = { subject: '', email: '', description: '', category: '', priority: '' };
    let hasError = false;

    if (!subject || subject.trim() === '') {
      newErrors.subject = 'Subject is required.';
      hasError = true;
    } else if (subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters.';
      hasError = true;
    }

    if (!email || email.trim() === '') {
      newErrors.email = 'Email is required.';
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
      hasError = true;
    }

    if (!description || description.trim() === '') {
      newErrors.description = 'Description is required.';
      hasError = true;
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters.';
      hasError = true;
    }

    if (!category) {
      newErrors.category = 'Please select a category.';
      hasError = true;
    }

    if (!priority) {
      newErrors.priority = 'Please select priority.';
      hasError = true;
    }

    setErrors(newErrors);
    return !hasError;
  };

  const handleSubmit = () => {
    if (loading) return;
    if (!validateForm()) {
      SimpleToast.show('Please fill all required fields correctly', SimpleToast.SHORT);
      return;
    }

    setLoading(true);

    if (image) {
      const formData = new FormData();
      formData.append('subject', subject.trim());
      formData.append('email', email.trim());
      formData.append('description', description.trim());
      formData.append('category', category?.value || category);
      formData.append('priority', priority?.value || priority);
      formData.append('image', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.name || 'ticket_image.jpg',
      });

      POST_FORM_DATA(
        SupportTicketCreate,
        formData,
        success => {
          setLoading(false);
          SimpleToast.show(success?.message || 'Ticket created successfully!', SimpleToast.SHORT);
          navigation.goBack();
        },
        error => {
          setLoading(false);
          SimpleToast.show(error?.message || 'Failed to create ticket', SimpleToast.SHORT);
        },
        fail => {
          setLoading(false);
          SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
        },
      );
    } else {
      POST_WITH_TOKEN(
        SupportTicketCreate,
        {
          subject: subject.trim(),
          email: email.trim(),
          description: description.trim(),
          category: category?.value || category,
          priority: priority?.value || priority,
        },
        success => {
          setLoading(false);
          SimpleToast.show(success?.message || 'Ticket created successfully!', SimpleToast.SHORT);
          navigation.goBack();
        },
        error => {
          setLoading(false);
          SimpleToast.show(error?.message || 'Failed to create ticket', SimpleToast.SHORT);
        },
        fail => {
          setLoading(false);
          SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
        },
      );
    }
  };

  const handleImageSelected = images => {
    if (images && images.length > 0) {
      const asset = images[0];
      setImage({
        uri: asset.uri || asset.path,
        type: asset.type || asset.mime || 'image/jpeg',
        name: asset.fileName || asset.filename || `photo_${Date.now()}.jpg`,
      });
    }
  };

  return (
    <CommanView>
      <HeaderForUser
        title="Create Support Ticket"
        style_title={{ fontSize: 18 }}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
      >
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.infoDot} />
            <Typography type={Font.Poppins_Regular} size={12} color="#888" style={{ flex: 1 }}>
              Describe your issue and our support team will assist you.
            </Typography>
          </View>

          <View style={styles.divider} />

          <Input
            title="Subject"
            placeholder="Brief summary of your issue"
            value={subject}
            onChange={val => { setSubject(val); clearError('subject'); }}
            error={errors.subject}
          />

          <Input
            title="Email *"
            placeholder="your@email.com"
            value={email}
            onChange={val => { setEmail(val); clearError('email'); }}
            keyboardType="email-address"
            error={errors.email}
          />

          <DropdownComponent
            title="Category"
            placeholder="Select category"
            data={categories}
            value={category}
            onChange={item => { setCategory(item); clearError('category'); }}
            error={errors.category}
            marginHorizontal={0}
            style_dropdown={{ marginHorizontal: 0 }}
            style_title={{ textAlign: 'left', fontFamily: Font.Poppins_Regular }}
            selectedTextStyleNew={{ marginLeft: 10, fontFamily: Font.Poppins_Regular }}
          />

          <DropdownComponent
            title="Priority"
            placeholder="Select priority"
            data={priorityData}
            value={priority}
            onChange={item => { setPriority(item); clearError('priority'); }}
            error={errors.priority}
            marginHorizontal={0}
            style_dropdown={{ marginHorizontal: 0 }}
            style_title={{ textAlign: 'left', fontFamily: Font.Poppins_Regular }}
            selectedTextStyleNew={{ marginLeft: 10, fontFamily: Font.Poppins_Regular }}
          />

          <Input
            title="Description"
            placeholder="Describe your issue in detail..."
            value={description}
            onChange={val => { setDescription(val); clearError('description'); }}
            style_inputContainer={{ height: 120 }}
            style_input={{ textAlign: 'start' }}
            multiline={true}
            numberOfLines={5}
            error={errors.description}
          />

          <UploadBox
            title="Attach Screenshot (Optional)"
            image={image}
            onPress={() => setShowImageModal(true)}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          onPress={handleSubmit}
          title="Submit Ticket"
          main_style={styles.button}
          loader={loading}
        />
      </View>

      <ImageModal
        showModal={showImageModal}
        close={() => setShowImageModal(false)}
        selected={handleImageSelected}
      />
    </CommanView>
  );
};

export default CreateTicket;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#EBEBEA',
    zIndex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D98579',
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  button: {
    width: '100%',
  },
});
