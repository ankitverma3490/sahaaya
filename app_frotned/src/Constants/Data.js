import {ImageConstant} from './ImageConstant';

export const genderData = [
  {
    value: 'male',
    label: 'Male',
  },
  {
    value: 'female',
    label: 'Female',
  },
  {
    value: 'transgender',
    label: 'Transgender',
  },
  {
    value: 'nonbinary',
    label: 'Nonbinary',
  },
  {
    value: 'other',
    label: 'Other',
  },
];

export const RegisterData = [
  {
    label: 'General Physician',
    value: 'MBBS',
  },
  {
    label: 'Homeopathic Physician',
    value: 'BHMS',
  },
  {
    label: 'Dentist',
    value: 'BDS / MDS',
  },
  {
    label: 'Physiotherapist',
    value: 'BPT / MPT',
  },
  {
    label: 'Nurse',
    subcategories: [
      {name: 'General Nurse'},
      {name: 'Expert Nurse'},
      {name: 'Onco Nurse'},
    ],
  },
  {
    label: 'Attendant',
    value: 'ANM/ADHA',
  },
  {
    label: 'Specialist Doctor',
    subcategories: [
      {name: 'Dermatologist'},
      {name: 'Neurologist'},
      {name: 'Pediatrician'},
      {name: 'Cardiologist'},
      {name: 'Geneticist'},
      {name: 'Obstetrics & Gynaecologist'},
      {name: 'Orthopedist'},
      {name: 'Psychiatrist'},
      {name: 'Endocrinologists'},
      {name: 'Rheumatologists'},
      {name: 'Nephrologists'},
      {name: 'Gastroenterologists'},
    ],
  },
  {
    label: 'Mental Health Counselor',
  },
  {
    label: 'Occupational Therapist',
  },
  {
    label: 'Speech Therapist',
  },
  {
    label: 'Special Needs Expert',
  },
];

export const TitleData = [
  {
    label: 'Mr',
    value: 'mr_1',
  },
  {
    label: 'Mrs',
    value: 'mrs_1',
  },
  {
    label: 'Ms',
    value: 'ms_1',
  },
  {
    label: 'Dr',
    value: 'dr_1',
  },
];

export const referenceOptions = [
  {
    id: 1,
    label: 'Manager of current position',
    value: 'manager_of_current_position',
  },
  {
    id: 2,
    label: 'Manager of previous position',
    value: 'manager_of_previous_position',
  },
  {
    id: 3,
    label: 'Family member of current client',
    value: 'family_member_of_current_client',
  },
  {
    id: 4,
    label: 'Family member of previous client',
    value: 'family_member_of_previous_client',
  },
  {
    id: 5,
    label: 'Working colleague within the care profession',
    value: 'working_colleague_within_care_profession',
  },
  {
    id: 6,
    label: 'Other - not a friend or family member',
    value: 'other_not_friend_or_family',
  },
  {
    id: 7,
    label: 'Current client',
    value: 'current_client',
  },
  {
    id: 8,
    label: 'Previous client',
    value: 'previous_client',
  },
  {
    id: 9,
    label: 'Other',
    value: 'other',
  },
];

export const howLongKnownOptions = [
  {
    id: 1,
    label: 'Less than 1 year',
    value: 'less_than_1_year',
  },
  {
    id: 2,
    label: '1 year',
    value: '1_year',
  },
  {
    id: 3,
    label: '2 years',
    value: '2_years',
  },
  {
    id: 4,
    label: '3 years',
    value: '3_years',
  },
  {
    id: 5,
    label: '4 years',
    value: '4_years',
  },
  {
    id: 6,
    label: '5+ years',
    value: '5_plus_years',
  },
];

export const accountTypeOptions = [
  {
    id: 1,
    label: 'Saving Account',
    value: 'saving_account',
  },
  {
    id: 2,
    label: 'Current Account',
    value: 'current_account',
  },
];

export const TypeIncident = [
  {
    id: 1,
    label: 'Injury',
    value: 'Injury',
  },
  {
    id: 2,
    label: 'Near miss event',
    value: 'Near_miss_event',
  },
  {
    id: 3,
    label: 'Other',
    value: 'Other',
  },
];

export const trainingVideos = [
  {
    id: 1,
    title: 'Getting Started',
    subtitle: 'How to Navigate and Use the Homecare App',
  },
  {id: 2, title: 'How we do verification', subtitle: ''},
  {
    id: 3,
    title: 'Welcoming Clients',
    subtitle: 'Best Practices for Greeting and Engaging with Clients',
  },
  {
    id: 4,
    title: 'Incident Reporting',
    subtitle: 'Steps to Take and Whom to Inform',
  },
  {
    id: 5,
    title: 'Orientation',
    subtitle: 'Essential Training for New Caregivers',
  },
  {
    id: 6,
    title: 'Payment Process',
    subtitle: 'How to Receive Your Earnings Securely',
  },
  {
    id: 7,
    title: 'Document Management',
    subtitle: 'How to Upload and Organize Important Files',
  },
  {
    id: 8,
    title: 'Client Safety',
    subtitle: 'Protocols and Best Practices for Caregivers',
  },
  {
    id: 9,
    title: 'Scheduling Made Simple',
    subtitle: 'Managing Your Work Calendar on the App',
  },
  {
    id: 10,
    title: 'Feedback Loop',
    subtitle: 'How to Give and Receive Client Feedback',
  },
  {
    id: 11,
    title: 'Support and Assistance',
    subtitle: 'Where to Find Help and Resources in the App',
  },
  {
    id: 12,
    title: 'Communication Tips',
    subtitle: 'How to Effectively Communicate with Clients',
  },
  {
    id: 13,
    title: 'Emergency Situations',
    subtitle: 'What to Do and Who to Contact',
  },
  {
    id: 14,
    title: 'Care Plan Overview',
    subtitle: 'Understanding and Following Client Care Plans',
  },
  {
    id: 15,
    title: 'Time Management',
    subtitle: 'Maximizing Your Efficiency During Shifts',
  },
  {
    id: 16,
    title: 'Professional Boundaries',
    subtitle: 'Maintaining a Professional Relationship with Clients',
  },
  {id: 17, title: 'Do’s & Dont’s', subtitle: 'During Your Shift'},
  {
    id: 18,
    title: 'Health and Safety Guidelines',
    subtitle: 'Keeping Yourself and Clients Safe',
  },
  {
    id: 19,
    title: 'App Updates',
    subtitle: 'How to Stay Informed About New Features',
  },
  {
    id: 20,
    title: 'Referring a Friend',
    subtitle: 'How to Recommend the App to Other Caregivers',
  },
  {
    id: 21,
    title: 'Daily Checklist',
    subtitle: 'Ensuring All Tasks Are Completed During a Shift',
  },
  {
    id: 22,
    title: 'Client Privacy',
    subtitle: 'Understanding and Upholding Confidentiality',
  },
  {id: 23, title: 'Pausing, Deactivating, Logging Out', subtitle: ''},
];

export const ImageArray = [
  {
    name: 'Settings',
    image: ImageConstant.Settings,
    navigation: 'TabNavigation',
  },
  {name: 'Manage Services', image: ImageConstant.Manage_Services},
  {name: 'Wallet', image: ImageConstant.Wallet},
  {name: 'Redeem', image: ImageConstant.Redeem},
  {name: 'Appointments', image: ImageConstant.Appointments},
  {name: 'Leads', image: ImageConstant.Leads},
  {name: 'Employee Contract', image: ImageConstant.Employee_Contract},
  {name: 'Time Sheet', image: ImageConstant.Time_Sheet},
  {name: 'Performance Review', image: ImageConstant.Performance_Review},
  {name: 'Training Records', image: ImageConstant.Training_Records},
  {name: 'Qualification', image: ImageConstant.Qualification},
  {name: 'Indemnity Form', image: ImageConstant.Indemnity_Form},
  {name: 'Payroll Information', image: ImageConstant.Payroll_Information},
  {name: 'Incident Report', image: ImageConstant.Incident_Report},
  {name: 'Employee Information', image: ImageConstant.Employee_Information},
  {name: 'Employee Handbook', image: ImageConstant.Employee_Handbook},
  {name: 'Training & Upskilling', image: ImageConstant.Training_Upskilling},
  {name: 'Wellness Program', image: ImageConstant.Wellness_Program},
  {name: 'Join My Peers', image: ImageConstant.Join_My_Peers},
  {name: 'FAQ', image: ImageConstant.FAQ},
];

const menuItems = [
  {name: 'My Dashboard', image: ImageConstant.MyDashboard, navigate: 'Profile'},
  {
    name: 'My Schedule',
    image: ImageConstant.MyAppointments,
    navigate: 'MySchedule',
  },
  {name: 'My Profile', image: ImageConstant.MyProfile, navigate: ''},
  {name: 'My Wallet', image: ImageConstant.MyWallet, navigate: ''},
  {name: 'My Referral Code', image: ImageConstant.MyReferralCode, navigate: ''},
  {
    name: 'Verify My Profile',
    image: ImageConstant.VerifyMyProfile,
    navigate: '',
  },
  {name: 'Chat', image: ImageConstant.Chat, navigate: ''},
  {name: 'Logout', image: ImageConstant.logOut, navigate: ''},
];

export default menuItems;
