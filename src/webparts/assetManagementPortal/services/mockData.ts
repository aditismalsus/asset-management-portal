
import { Asset, User, AssetType, AssetStatus, LicenseType, PlatformAccount, Platform, AccountType, AccountStatus, Request, RequestStatus, SoftwareProfile, HardwareProduct, HardwareCondition, AssetFamily, Vendor, AssignmentHistory, UserRole } from '../types';

// Provided Types from Prompt (Implicitly used to structure data)
interface MockUser {
  id: string | number;
  displayName: string;
  email: string;
}

interface RepoItem {
  id: string;
  title: string;
  assetType: 'ExternalLicense' | 'Hardware';
  prefix: string;
  configuration: string;
  description: string;
  totalCount: number;
  created: string;
  modified: string;
  author: MockUser;
  editor: MockUser;
  vendorName?: string; // Added to map to Vendor
}

interface InstanceItem {
  id: string;
  repoId: string;
  title: string;
  assignedTo?: MockUser;
  status: AssetStatus;
  purchaseDate?: string;
  expiryDate?: string;
  licenseType?: string;
  serialNumber?: string;
  modelNumber?: string;
  created: string;
  modified: string;
  cost?: number;
  assignmentHistory?: AssignmentHistory[];
  activeUsers?: User[];
}

// ... Users ...
const CURRENT_USER: User = {
  id: 'user-1',
  fullName: 'Abhishek Tiwari',
  firstName: 'Abhishek',
  lastName: 'Tiwari',
  email: 'abhishek.tiwari@hochhuth-consulting.de',
  avatarUrl: `https://i.pravatar.cc/150?u=user-1`,
  role: 'admin',
  isVerified: true,
  jobTitle: 'Junior Developer',
  department: 'SharePoint Framework (SPFx)',
  organization: 'Smalsus Infolabs Pvt Ltd',
  dateOfJoining: '2022-05-15',
  dateOfExit: null,
  businessPhone: '7042269388',
  mobileNo: '9350006744',
  address: '100C Jagriti Appartment sector 71 Noida',
  city: 'Noida',
  postalCode: '201307',
  linkedin: 'abhishek-tiwari-77385921b',
  twitter: '@abhishek_tiwari',
  userType: 'Internal User',
  extension: '201307',
  permissionGroups: ['Designers', 'GmbH Owners'],
  principalName: 'abhishek.tiwari@test.com',
  userStatus: 'Active Internal User',
  userTypeDetail: 'Member',
  createdDate: '15/05/2022',
  modifiedDate: '20/05/2024',
  createdBy: 'Admin',
  modifiedBy: 'Admin',
  site: ['SMALSUS'],
  typeOfContact: ['Employee'],
  history: [
    { id: 'h-1', assetName: 'Laptop (Windows)', assetId: 'HW-LAP-0001', date: '2022-05-15', type: 'Assigned', notes: 'Initial device' }
  ]
};

const MOCK_USERS_RAW: MockUser[] = [
  { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' }, // Matches CURRENT_USER
  { id: 'user-2', displayName: 'Deepak Trivedi', email: 'deepak.trivedi@example.com' },
  { id: 'user-3', displayName: 'Garima Arya', email: 'garima.arya@hochhuth-consulting.de' },
  { id: 'user-4', displayName: 'Piyoosh Bharadwaj', email: 'piyoosh.bhardwaj@hochhuth-consulting.de' },
  { id: 'user-5', displayName: 'Pravesh Kumar', email: 'Pravesh.Kumar@hochhuth-consulting.de' },
  { id: 'user-6', displayName: 'Ranu Trivedi', email: 'ranu.trivedi@hochhuth-consulting.de' },
  { id: 'user-7', displayName: 'Santosh Kumar', email: 'santosh.kumar@hochhuth-consulting.de' },
  { id: 'user-8', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
  { id: 'user-9', displayName: 'Aditi Mishra', email: 'aditi.mishra@hochhuth-consulting.de' },
  { id: 'user-10', displayName: 'Aman Munjal', email: 'aman.munjal@hochhuth-consulting.de' },
  { id: 'user-11', displayName: 'Amit Kumar', email: 'amit.kumar@hochhuth-consulting.de' },
  { id: 'user-12', displayName: 'Juli Kumari', email: 'juli@example.com' },
  { id: 'user-13', displayName: 'Shivdutt Mishra', email: 'shivdutt@example.com' },
  { id: 'user-14', displayName: 'Udbhav Sharma', email: 'udbhav@example.com' },
];

const mockPlatformAccounts: PlatformAccount[] = [
  { id: 'acc-1', userId: 'user-1', platform: Platform.SHAREPOINT, accountType: AccountType.INTERNAL, email: 'abhishek.tiwari@test.com', status: AccountStatus.ACTIVE, createdDate: '15/05/2022' },
  { id: 'acc-2', userId: 'user-1', platform: Platform.GMAIL, accountType: AccountType.INTERNAL, email: 'abhishek.tiwari@smalsus.com', status: AccountStatus.ACTIVE, createdDate: '15/05/2022' },
  // Linked to Deepak Trivedi (user-2 in this mock set)
  { id: 'acc-3', userId: 'user-2', platform: Platform.SHAREPOINT, accountType: AccountType.INTERNAL, email: 'deepak@example.com', status: AccountStatus.ACTIVE, createdDate: '21/04/2021' },
  { id: 'acc-4', userId: 'user-2', platform: Platform.DOGADO, accountType: AccountType.INTERNAL, email: 'deepak.trivedi@dogado.de', status: AccountStatus.ACTIVE, createdDate: '22/08/2021' },
  { id: 'acc-5', userId: 'user-2', platform: Platform.GMAIL, accountType: AccountType.GUEST, email: 'deepak.t.guest@gmail.com', status: AccountStatus.DISABLED, createdDate: '10/01/2022' },
];

const MOCK_VENDORS: Vendor[] = [
  { id: 'v-1', name: 'Apple', website: 'https://apple.com', contactName: 'Business Support', email: 'business@apple.com' },
  { id: 'v-2', name: 'Dell', website: 'https://dell.com', contactName: 'Sales Rep', email: 'sales@dell.com' },
  { id: 'v-3', name: 'Microsoft', website: 'https://microsoft.com', contactName: 'Licensing Team', email: 'licenses@microsoft.com' },
  { id: 'v-4', name: 'Lenovo', website: 'https://lenovo.com' },
  { id: 'v-5', name: 'Logitech', website: 'https://logitech.com' },
  { id: 'v-6', name: 'OpenAI', website: 'https://openai.com' },
  { id: 'v-7', name: 'Perplexity', website: 'https://perplexity.ai' },
  { id: 'v-8', name: 'TechSmith', website: 'https://techsmith.com' },
];

const INITIAL_REPO_ITEMS: RepoItem[] = [
  {
    id: 'repo-1',
    title: 'ChatGPT',
    assetType: 'ExternalLicense',
    prefix: 'GPT',
    configuration: '<p>Standard Enterprise Subscription</p>',
    description: 'ChatGPT has diverse use cases...',
    totalCount: 5,
    created: '2025-06-11T16:43:00Z',
    modified: '2025-07-30T10:34:00Z',
    author: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    editor: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    vendorName: 'OpenAI'
  },
  {
    id: 'repo-pex',
    title: 'Perplexity',
    assetType: 'ExternalLicense',
    prefix: 'PPX',
    configuration: '<p>Standard Subscription</p>',
    description: "Perplexity AI can be used for a wide range of tasks...",
    totalCount: 18,
    created: '2025-06-11T16:43:00Z',
    modified: '2025-07-30T10:34:00Z',
    author: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    editor: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    vendorName: 'Perplexity'
  },
  {
    id: 'repo-snap17',
    title: 'Snap17',
    assetType: 'ExternalLicense',
    prefix: 'S17',
    configuration: '<p>Screen capture tool</p>',
    description: 'Professional screen capturing...',
    totalCount: 4,
    created: '2025-06-11T16:43:00Z',
    modified: '2025-07-30T10:34:00Z',
    author: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    editor: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    vendorName: 'TechSmith'
  },
  {
    id: 'repo-snap10',
    title: 'Snap10',
    assetType: 'ExternalLicense',
    prefix: 'S10',
    configuration: '<p>Legacy Screen capture tool</p>',
    description: 'Professional screen capturing...',
    totalCount: 4,
    created: '2025-06-11T16:43:00Z',
    modified: '2025-07-30T10:34:00Z',
    author: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    editor: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    vendorName: 'TechSmith'
  },
  {
    id: 'repo-msteams',
    title: 'MS Teams (External)',
    assetType: 'ExternalLicense',
    prefix: 'MSTX',
    configuration: '<p>External collaboration license</p>',
    description: 'MS Teams License outside of the organization',
    totalCount: 19,
    created: '2025-06-11T16:43:00Z',
    modified: '2025-07-30T10:34:00Z',
    author: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    editor: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    vendorName: 'Microsoft'
  },
  {
    id: 'repo-mbp',
    title: 'MacBook',
    assetType: 'Hardware',
    prefix: 'MM',
    configuration: '<p>M2 Pro, 16GB RAM, 512GB SSD</p>',
    description: 'High performance laptop',
    totalCount: 22,
    created: '2025-01-15T09:00:00Z',
    modified: '2025-02-20T14:20:00Z',
    author: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    editor: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    vendorName: 'Apple'
  },
  {
    id: 'repo-sha',
    title: 'Headphones',
    assetType: 'Hardware',
    prefix: 'SHA',
    configuration: '<p>Noise cancelling</p>',
    description: 'Standard issue headphones',
    totalCount: 30,
    created: '2025-01-15T09:00:00Z',
    modified: '2025-02-20T14:20:00Z',
    author: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    editor: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    vendorName: 'Logitech'
  },
  {
    id: 'repo-macmini',
    title: 'Mac-mini',
    assetType: 'Hardware',
    prefix: 'MM',
    configuration: '<p>M2, 8GB</p>',
    description: 'Desktop unit',
    totalCount: 22,
    created: '2025-01-15T09:00:00Z',
    modified: '2025-02-20T14:20:00Z',
    author: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    editor: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    vendorName: 'Apple'
  },
  {
    id: 'repo-wkb',
    title: 'Keyboard(wire-less)',
    assetType: 'Hardware',
    prefix: 'WKB',
    configuration: '<p>Standard</p>',
    description: 'Wireless keyboard',
    totalCount: 19,
    created: '2025-01-15T09:00:00Z',
    modified: '2025-02-20T14:20:00Z',
    author: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    editor: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    vendorName: 'Logitech'
  },
  {
    id: 'repo-lap',
    title: 'Laptop (Windows)',
    assetType: 'Hardware',
    prefix: 'LAP',
    configuration: '<p>Dell Latitude 5420, i7, 16GB</p>',
    description: 'Standard developer laptop',
    totalCount: 25,
    created: '2025-03-10T11:00:00Z',
    modified: '2025-03-10T11:00:00Z',
    author: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    editor: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    vendorName: 'Dell'
  },
  {
    id: 'repo-mnt',
    title: 'Monitor',
    assetType: 'Hardware',
    prefix: 'MNT',
    configuration: '<p>27 inch 4k</p>',
    description: 'External Display',
    totalCount: 28,
    created: '2025-03-10T11:00:00Z',
    modified: '2025-03-10T11:00:00Z',
    author: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    editor: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    vendorName: 'Dell'
  },
  {
    id: 'repo-mse',
    title: 'Mouse',
    assetType: 'Hardware',
    prefix: 'MSE',
    configuration: '<p>Wireless</p>',
    description: 'Standard mouse',
    totalCount: 13,
    created: '2025-03-10T11:00:00Z',
    modified: '2025-03-10T11:00:00Z',
    author: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    editor: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    vendorName: 'Logitech'
  },
  {
    id: 'repo-lac',
    title: 'Laptop Charger',
    assetType: 'Hardware',
    prefix: 'LAC',
    configuration: '<p>65W USB-C</p>',
    description: 'Standard charger',
    totalCount: 20,
    created: '2025-03-10T11:00:00Z',
    modified: '2025-03-10T11:00:00Z',
    author: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    editor: { id: 'user-1', displayName: 'Abhishek Tiwari', email: 'abhishek.tiwari@hochhuth-consulting.de' },
    vendorName: 'Dell'
  },
];

const INITIAL_INSTANCES: InstanceItem[] = [
  // ... (Previous instances maintained)
  { id: 'LIC-PPX-0001', repoId: 'repo-pex', title: 'Perplexity 01', assignedTo: { id: 'u-105', displayName: 'Prashant Kumar', email: 'prashant@example.com' }, status: AssetStatus.ACTIVE, purchaseDate: '2025-06-06', expiryDate: '2026-06-05', licenseType: 'Subscription', created: '2025-06-23T10:00:00Z', modified: '2025-07-10T10:00:00Z', cost: 20 },
  { id: 'LIC-PPX-0002', repoId: 'repo-pex', title: 'Perplexity 02', assignedTo: { id: 'u-103', displayName: 'Kristina Kovach', email: 'kristina@example.com' }, status: AssetStatus.ACTIVE, purchaseDate: '2025-06-06', expiryDate: '2026-06-05', licenseType: 'Subscription', created: '2025-06-23T10:00:00Z', modified: '2025-11-24T10:00:00Z', cost: 20 },
  { id: 'LIC-PPX-0003', repoId: 'repo-pex', title: 'Perplexity 03', assignedTo: { id: 'u-104', displayName: 'Mattis Hahn-Temba', email: 'mattis@example.com' }, status: AssetStatus.ACTIVE, purchaseDate: '2025-06-06', expiryDate: '2026-06-05', licenseType: 'Subscription', created: '2025-06-23T10:00:00Z', modified: '2025-11-24T10:00:00Z', cost: 20 },
  { id: 'LIC-PPX-0004', repoId: 'repo-pex', title: 'Perplexity 04', assignedTo: MOCK_USERS_RAW[1], status: AssetStatus.ACTIVE, purchaseDate: '2025-05-07', expiryDate: '2026-05-06', licenseType: 'Subscription', created: '2025-06-23T10:00:00Z', modified: '2025-09-22T10:00:00Z', cost: 20 },
  { id: 'LIC-PPX-0005', repoId: 'repo-pex', title: 'Perplexity 05', status: AssetStatus.AVAILABLE, purchaseDate: '2025-05-07', expiryDate: '2025-05-06', licenseType: 'Subscription', created: '2025-06-23T10:00:00Z', modified: '2025-07-10T10:00:00Z', cost: 20 },
  { id: 'LIC-PPX-0006', repoId: 'repo-pex', title: 'Perplexity 06', assignedTo: { id: 'u-106', displayName: 'Robert Ungethuem', email: 'robert@example.com' }, status: AssetStatus.ACTIVE, purchaseDate: '2025-06-06', licenseType: 'Subscription', created: '2025-06-23T10:00:00Z', modified: '2025-11-24T10:00:00Z', cost: 20 },
  { id: 'LIC-PPX-0007', repoId: 'repo-pex', title: 'Perplexity 07', assignedTo: { id: 'u-107', displayName: 'Stefan Hochhuth', email: 'stefan@example.com' }, status: AssetStatus.ACTIVE, purchaseDate: '2025-06-06', licenseType: 'Subscription', created: '2025-06-23T10:00:00Z', modified: '2025-11-24T10:00:00Z', cost: 20 },

  { id: 'LIC-S17-0008', repoId: 'repo-snap17', title: 'Snap17 01', assignedTo: { id: 'u-105', displayName: 'Prashant Kumar', email: 'prashant@example.com' }, status: AssetStatus.ACTIVE, purchaseDate: '2025-02-15', licenseType: 'Subscription', created: '2025-06-23T10:00:00Z', modified: '2025-07-10T10:00:00Z', cost: 45 },
  { id: 'LIC-S17-0009', repoId: 'repo-snap17', title: 'Snap17 02', assignedTo: { id: 'u-108', displayName: 'Alina Chyhasova', email: 'alina.chyhasova@hochhuth-consulting.de' }, status: AssetStatus.INACTIVE, purchaseDate: '2025-02-15', licenseType: 'Subscription', created: '2025-06-23T10:00:00Z', modified: '2025-11-04T10:00:00Z', cost: 45 },
  { id: 'LIC-S17-00010', repoId: 'repo-snap17', title: 'Snap17 03', assignedTo: { id: 'u-104', displayName: 'Mattis Hahn-Temba', email: 'mattis@example.com' }, status: AssetStatus.ACTIVE, purchaseDate: '2025-02-15', licenseType: 'Subscription', created: '2025-06-23T10:00:00Z', modified: '2025-07-10T10:00:00Z', cost: 45 },
  { id: 'LIC-S17-00011', repoId: 'repo-snap17', title: 'Snap17 04', status: AssetStatus.AVAILABLE, purchaseDate: '2025-02-15', licenseType: 'Subscription', created: '2025-06-23T10:00:00Z', modified: '2025-07-10T10:00:00Z', cost: 45 },

  { id: 'LIC-S10-00012', repoId: 'repo-snap10', title: 'Snap10 01', assignedTo: { id: 'u-105', displayName: 'Prashant Kumar', email: 'prashant@example.com' }, status: AssetStatus.INACTIVE, purchaseDate: '2024-01-10', licenseType: 'Subscription', created: '2025-06-23T10:00:00Z', modified: '2025-11-04T10:00:00Z', cost: 30 },
  { id: 'LIC-S10-00013', repoId: 'repo-snap10', title: 'Snap10 02', assignedTo: { id: 'u-108', displayName: 'Alina Chyhasova', email: 'alina@example.com' }, status: AssetStatus.ACTIVE, purchaseDate: '2024-01-10', licenseType: 'Subscription', created: '2025-06-23T10:00:00Z', modified: '2025-07-10T10:00:00Z', cost: 30 },

  { id: 'LIC-GPT-00016', repoId: 'repo-1', title: 'ChatGPT 1', status: AssetStatus.AVAILABLE, purchaseDate: '2025-07-01', created: '2025-07-11T10:00:00Z', modified: '2025-07-11T10:00:00Z', cost: 25 },
  { id: 'LIC-GPT-00017', repoId: 'repo-1', title: 'ChatGPT 2', status: AssetStatus.AVAILABLE, purchaseDate: '2025-07-01', created: '2025-07-11T10:00:00Z', modified: '2025-07-11T10:00:00Z', cost: 25 },

  { id: 'LIC-MSTX-00021', repoId: 'repo-msteams', title: 'MS Teams (External) 1', assignedTo: MOCK_USERS_RAW[11], status: AssetStatus.ACTIVE, purchaseDate: '2025-05-20', created: '2025-07-11T10:00:00Z', modified: '2025-07-11T10:00:00Z', cost: 12 },
  { id: 'LIC-MSTX-00022', repoId: 'repo-msteams', title: 'MS Teams (External) 2', assignedTo: { id: 'u-101', displayName: 'Anshika Choudhary', email: 'anshika@example.com' }, status: AssetStatus.ACTIVE, purchaseDate: '2025-05-20', created: '2025-07-14T10:00:00Z', modified: '2025-07-14T10:00:00Z', cost: 12 },
  { id: 'LIC-MSTX-00023', repoId: 'repo-msteams', title: 'MS Teams (External) 3', assignedTo: MOCK_USERS_RAW[12], status: AssetStatus.ACTIVE, purchaseDate: '2025-05-20', created: '2025-07-14T10:00:00Z', modified: '2025-07-14T10:00:00Z', cost: 12 },

  // --- HARDWARE ASSETS ---
  {
    id: 'HW-MM-000100',
    repoId: 'repo-mbp',
    title: 'MacBook 1',
    assignedTo: MOCK_USERS_RAW[7],
    status: AssetStatus.ACTIVE,
    purchaseDate: '2025-01-15',
    expiryDate: '2026-01-15',
    serialNumber: 'YHT9T6F3HG',
    created: '2025-06-19T10:00:00Z',
    modified: '2025-09-11T10:00:00Z',
    cost: 2499,
    // Adding mock history here
    assignmentHistory: [
      { id: 'h-1', assetId: 'HW-MM-000100', assetName: 'MacBook 1', date: '2025-01-20', type: 'Assigned', assignedTo: MOCK_USERS_RAW[7].displayName, notes: 'Initial assignment' }
    ]
  },

  { id: 'HW-SHA-0009', repoId: 'repo-sha', title: 'Headphones 09', assignedTo: MOCK_USERS_RAW[7], status: AssetStatus.INACTIVE, purchaseDate: '2025-03-10', created: '2025-06-24T10:00:00Z', modified: '2025-09-12T10:00:00Z', cost: 150 },

  { id: 'HW-MM-000108', repoId: 'repo-macmini', title: 'Mac-mini 16', assignedTo: MOCK_USERS_RAW[8], status: AssetStatus.ACTIVE, purchaseDate: '2025-02-20', expiryDate: '2026-02-20', modelNumber: 'Mac mini 2024', serialNumber: 'v59QW5H44Q', created: '2025-06-19T10:00:00Z', modified: '2025-11-04T10:00:00Z', cost: 899 },

  { id: 'HW-WKB-00057', repoId: 'repo-wkb', title: 'Keyboard(wire-less) 17', assignedTo: MOCK_USERS_RAW[8], status: AssetStatus.ACTIVE, purchaseDate: '2025-03-01', created: '2025-06-24T10:00:00Z', modified: '2025-11-04T10:00:00Z', cost: 99 },

  { id: 'HW-LAP-00066', repoId: 'repo-lap', title: 'Laptop 06', assignedTo: MOCK_USERS_RAW[8], status: AssetStatus.ACTIVE, modelNumber: 'Lenovo', purchaseDate: '2025-04-12', created: '2025-06-24T10:00:00Z', modified: '2025-10-09T10:00:00Z', cost: 1200 },

  { id: 'HW-MNT-000117', repoId: 'repo-mnt', title: 'Monitor 28', assignedTo: MOCK_USERS_RAW[8], status: AssetStatus.ACTIVE, purchaseDate: '2025-04-15', created: '2025-11-04T10:00:00Z', modified: '2025-11-04T10:00:00Z', cost: 350 },

  { id: 'HW-SHA-00025', repoId: 'repo-sha', title: 'Headphones 25', assignedTo: MOCK_USERS_RAW[9], status: AssetStatus.ACTIVE, modelNumber: 'Logi', purchaseDate: '2025-03-10', created: '2025-06-24T10:00:00Z', modified: '2025-08-29T10:00:00Z', cost: 80 },

  { id: 'HW-LAP-00071', repoId: 'repo-lap', title: 'Laptop 11', assignedTo: MOCK_USERS_RAW[9], status: AssetStatus.ACTIVE, modelNumber: 'Lenovo', purchaseDate: '2025-04-12', created: '2025-06-24T10:00:00Z', modified: '2025-07-10T10:00:00Z', cost: 1200 },

  { id: 'HW-MSE-000146', repoId: 'repo-mse', title: 'Mouse 10', assignedTo: MOCK_USERS_RAW[9], status: AssetStatus.ACTIVE, modelNumber: 'Dell', purchaseDate: '2025-03-20', created: '2025-06-24T10:00:00Z', modified: '2025-07-10T10:00:00Z', cost: 25 },

  { id: 'HW-LAC-00091', repoId: 'repo-lac', title: 'Laptop Charger 07', assignedTo: MOCK_USERS_RAW[9], status: AssetStatus.ACTIVE, modelNumber: 'Lenovo', purchaseDate: '2025-04-12', created: '2025-07-04T10:00:00Z', modified: '2025-07-10T10:00:00Z', cost: 45 },

  { id: 'HW-SHA-00024', repoId: 'repo-sha', title: 'Headphones 24', assignedTo: MOCK_USERS_RAW[10], status: AssetStatus.ACTIVE, purchaseDate: '2025-03-10', created: '2025-06-24T10:00:00Z', modified: '2025-07-10T10:00:00Z', cost: 80 },

  { id: 'HW-LAP-00063', repoId: 'repo-lap', title: 'Laptop 03', assignedTo: MOCK_USERS_RAW[10], status: AssetStatus.ACTIVE, modelNumber: 'Asus', serialNumber: 'N3N0CX14152410B', purchaseDate: '2025-05-05', created: '2025-06-24T10:00:00Z', modified: '2025-07-10T10:00:00Z', cost: 1100 },

  { id: 'HW-MSE-000139', repoId: 'repo-mse', title: 'DELL', assignedTo: MOCK_USERS_RAW[10], status: AssetStatus.ACTIVE, purchaseDate: '2025-03-20', created: '2025-06-24T10:00:00Z', modified: '2025-07-10T10:00:00Z', cost: 25 },

  { id: 'HW-LAC-00092', repoId: 'repo-lac', title: 'Laptop Charger 03', assignedTo: MOCK_USERS_RAW[10], status: AssetStatus.ACTIVE, purchaseDate: '2025-05-05', created: '2025-09-12T10:00:00Z', modified: '2025-09-12T10:00:00Z', cost: 45 },
];

// Mapping Logic
const mockUsers: User[] = MOCK_USERS_RAW.map((u, index) => {
  if (u.id === CURRENT_USER.id) return { ...CURRENT_USER, platformAccounts: mockPlatformAccounts.filter(p => p.userId === u.id) };
  return {
    id: u.id,
    fullName: u.displayName,
    firstName: u.displayName.split(' ')[0] || '',
    lastName: u.displayName.split(' ').slice(1).join(' ') || '',
    email: u.email,
    avatarUrl: `https://i.pravatar.cc/150?u=${u.id}`,
    role: 'user',
    isVerified: false,
    jobTitle: 'Employee',
    department: 'General',
    organization: 'Smalsus Infolabs Pvt Ltd',
    dateOfJoining: '2023-01-01',
    dateOfExit: null,
    businessPhone: '',
    mobileNo: '',
    address: '',
    city: '',
    postalCode: '',
    userType: 'Internal User',
    extension: '',
    permissionGroups: [],
    principalName: u.email,
    userStatus: 'Active',
    userTypeDetail: 'Member',
    createdDate: new Date().toISOString(),
    modifiedDate: new Date().toISOString(),
    createdBy: 'Admin',
    modifiedBy: 'Admin',
    site: ['SMALSUS'],
    typeOfContact: ['Employee'],
    platformAccounts: mockPlatformAccounts.filter(p => p.userId === u.id),
    history: index % 2 === 0 ? [{ id: `hist-${index}`, assetName: 'Standard Laptop', assetId: `OLD-LAP-${index}`, date: '2023-01-01', type: 'Assigned' }] : [],
    linkedin: '',
    twitter: ''
  } as User;
});

const mockAssetFamilies: AssetFamily[] = INITIAL_REPO_ITEMS.map(item => {
  const isHardware = item.assetType === 'Hardware';
  const type = isHardware ? AssetType.HARDWARE : AssetType.LICENSE;

  const base = {
    id: item.id,
    assetType: type,
    name: item.title,
    productCode: item.prefix,
    category: isHardware ? 'Accessory' : 'External',
    createdDate: item.created,
    lastModifiedDate: item.modified,
    description: item.description,
    assignmentModel: isHardware ? 'Single' : 'Multiple' // Default assignment model
  };

  if (isHardware) {
    return {
      ...base,
      manufacturer: item.vendorName || 'Generic',
      category: item.title.toLowerCase().includes('laptop') ? 'Laptop'
        : item.title.toLowerCase().includes('monitor') ? 'Monitor'
          : item.title.toLowerCase().includes('keyboard') ? 'Keyboard'
            : item.title.toLowerCase().includes('mac') ? 'Mac Mini'
              : 'Accessory',
    } as HardwareProduct;
  } else {
    return {
      ...base,
      vendor: item.vendorName || 'Unknown',
      responsibleUser: CURRENT_USER,
      variants: [{ id: `var-${item.id}`, name: 'Standard', licenseType: LicenseType.SUBSCRIPTION, cost: 20 }]
    } as SoftwareProfile;
  }
});

const mockAssets: Asset[] = INITIAL_INSTANCES.map(inst => {
  const repo = INITIAL_REPO_ITEMS.find(r => r.id === inst.repoId);
  const isHardware = repo?.assetType === 'Hardware';
  const type = isHardware ? AssetType.HARDWARE : AssetType.LICENSE;

  let assignedUser: User | null = null;
  let assignedUsers: User[] = [];

  if (inst.assignedTo) {
    const found = mockUsers.find(u => u.id === inst.assignedTo?.id || u.email === inst.assignedTo?.email);
    if (found) { assignedUser = found; }
    else {
      assignedUser = {
        id: inst.assignedTo.id,
        fullName: inst.assignedTo.displayName,
        firstName: inst.assignedTo.displayName.split(' ')[0],
        lastName: inst.assignedTo.displayName.split(' ').slice(1).join(' '),
        email: inst.assignedTo.email,
        avatarUrl: `https://i.pravatar.cc/150?u=${inst.assignedTo.id}`,
        role: 'user',
        isVerified: false,
        jobTitle: 'External/Temp',
        department: 'External',
        organization: '',
        dateOfJoining: '',
        dateOfExit: null,
        businessPhone: '',
        mobileNo: '',
        address: '',
        city: '',
        postalCode: '',
        userType: 'External',
        extension: '',
        permissionGroups: [],
        principalName: inst.assignedTo.email,
        userStatus: 'Active',
        userTypeDetail: '',
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        createdBy: 'System',
        modifiedBy: 'System',
        site: [],
        typeOfContact: [],
        platformAccounts: [],
        linkedin: '',
        twitter: '',
      };
      mockUsers.push(assignedUser);
    }
    if (assignedUser) assignedUsers = [assignedUser];
  }

  return {
    id: inst.id,
    assetId: inst.id,
    familyId: inst.repoId,
    title: inst.title,
    status: inst.status || AssetStatus.AVAILABLE,
    purchaseDate: inst.purchaseDate || '2025-01-01',
    cost: inst.cost || 0,
    created: inst.created,
    modified: inst.modified,
    createdBy: 'Admin',
    modifiedBy: 'Admin',
    assetType: type,
    variantType: inst.licenseType || 'Standard',
    renewalDate: inst.expiryDate,
    assignedUsers: assignedUsers,
    email: assignedUser?.email,
    serialNumber: inst.serialNumber,
    modelNumber: inst.modelNumber,
    warrantyExpiryDate: inst.expiryDate,
    assignedUser: assignedUser,
    location: 'Office',
    condition: HardwareCondition.GOOD,
    assignmentHistory: (inst as any).assignmentHistory,
    activeUsers: assignedUser ? [assignedUser] : [] // Initialize activeUsers same as owner for now
  } as Asset;
});

const mockRequests: Request[] = [
  { id: 'req-1', type: 'Hardware', item: 'Dell UltraSharp 27"', familyId: 'repo-mnt', requestedBy: mockUsers[1], status: RequestStatus.PENDING, requestDate: '2025-12-20', notes: 'My current monitor has dead pixels.' },
  { id: 'req-2', type: 'Software', item: 'Perplexity', familyId: 'repo-pex', requestedBy: mockUsers[3], status: RequestStatus.PENDING, requestDate: '2025-12-18' },
];


// --- SharePoint Mapping Functions ---

export const mapSPUser = (u: any): User => ({
  id: u.Id || u.ID || Math.random(),
  fullName: u.FullName || u.Title || 'Unknown',
  firstName: u.FirstName || (u.FullName || '').split(' ')[0] || '',
  lastName: (u.FullName || '').split(' ').slice(1).join(' ') || '',
  email: u.Email || '',
  avatarUrl: u.AvatarUrl || `https://i.pravatar.cc/150?u=${u.Id || u.ID}`,
  role: (u.Role || 'user').toLowerCase() as UserRole,
  isVerified: !!u.isVerified,
  jobTitle: u.JobTitle || '',
  department: u.Department || '',
  organization: u.Company || '',
  dateOfJoining: u.Date_x0020_Of_x0020_Joining || u.DOJ || new Date().toISOString(),
  dateOfExit: u.DateOfExit || u.DOE || null,
  businessPhone: u.WorkPhone || '',
  mobileNo: u.CellPhone || '',
  address: u.WorkAddress || '',
  city: u.WorkCity || '',
  postalCode: u.WorkZip || '',
  linkedin: u.LinkedIn?.Url || '',
  twitter: u.Twitter?.Url || '',
  userType: u.User_x0020_Type || 'Internal',
  extension: u.Extension || '',
  permissionGroups: u.PermissionGroups || [],
  principalName: u.Email || '',
  userStatus: u.UserStatus || 'Active',
  userTypeDetail: u.UserTypeDetail || '',
  createdDate: u.Created || new Date().toISOString(),
  modifiedDate: u.Modified || new Date().toISOString(),
  createdBy: u.AuthorId ? String(u.AuthorId) : 'System',
  modifiedBy: u.EditorId ? String(u.EditorId) : 'System',
  site: u.Site || [],
  typeOfContact: u.TypeOfContact || ['Employee'],
  platformAccounts: []
});

export const mapSPAssetFamily = (f: any): AssetFamily => {
  const isHardware = f.AssetType === 'Hardware';
  const type = isHardware ? AssetType.HARDWARE : AssetType.LICENSE;

  const base = {
    id: String(f.Id || f.ID),
    assetType: type,
    name: f.Title || 'Unknown',
    productCode: f.Prefix || 'GEN',
    category: f.Category || (isHardware ? 'Accessory' : 'External'),
    createdDate: f.Created || new Date().toISOString(),
    lastModifiedDate: f.Modified || new Date().toISOString(),
    description: f.Description || '',
    assignmentModel: f.AssignmentModel || (isHardware ? 'Single' : 'Multiple')
  };

  if (isHardware) {
    return {
      ...base,
      manufacturer: f.Manufacturer || 'Generic',
    } as HardwareProduct;
  } else {
    return {
      ...base,
      vendor: String(f.VendorNameId || 'Unknown'),
      variants: f.Variants ? (typeof f.Variants === 'string' ? JSON.parse(f.Variants) : f.Variants) : [{ id: `var-${f.Id || f.ID}`, name: 'Standard', licenseType: LicenseType.SUBSCRIPTION, cost: Number(f.cost || 0) }]
    } as SoftwareProfile;
  }
};

export const mapSPAsset = (a: any, allUsers: User[]): Asset => {
  const isHardware = a.AssetType === 'Hardware';
  const type = isHardware ? AssetType.HARDWARE : AssetType.LICENSE;

  let assignedUser: User | null = null;
  let assignedUsers: User[] = [];

  const userIds = a.assignToUserId || [];
  if (Array.isArray(userIds) && userIds.length > 0) {
    assignedUsers = allUsers.filter(u => userIds.includes(Number(u.id) || u.id));
    assignedUser = assignedUsers[0] || null;
  }

  return {
    id: String(a.Id || a.ID),
    assetId: a.AssetId || String(a.Id || a.ID),
    familyId: String(a.assetRepoId || a.FamilyId || a.RepoId),
    title: a.Title || 'Untitled Asset',
    status: a.Status || AssetStatus.AVAILABLE,
    purchaseDate: a.purchaseDate || new Date().toISOString().split('T')[0],
    cost: Number(a.Cost || 0),
    created: a.Created || new Date().toISOString(),
    modified: a.Modified || new Date().toISOString(),
    createdBy: a.AuthorId ? String(a.AuthorId) : 'System',
    modifiedBy: a.EditorId ? String(a.EditorId) : 'System',
    assetType: type,
    variantType: a.LicenseType || 'Standard',
    renewalDate: a.expiryDate,
    assignedUsers: assignedUsers,
    email: a.Email || assignedUser?.email,
    serialNumber: a.serialNumber,
    modelNumber: a.modelNumber,
    warrantyExpiryDate: a.expiryDate,
    assignedUser: assignedUser,
    location: a.Location || 'Office',
    condition: a.Condition || HardwareCondition.GOOD,
    activeUsers: assignedUser ? [assignedUser] : [],
    licenseKey: a.licenseKey,
    ipAddress: a.ipAddress,
    macAddress: a.macAddress
  } as Asset;
};

export const mapSPRequest = (r: any, allUsers: User[]): Request => {
  let requestedBy: User | undefined;
  if (r.RequestedById) {
    requestedBy = allUsers.find(u => String(u.id) === String(r.RequestedById));
  }

  return {
    id: String(r.Id || r.ID),
    type: r.RequestType || 'Hardware',
    item: r.Title || 'Unknown Item',
    requestedBy: requestedBy || { id: 'unknown', fullName: 'Unknown User', email: '' } as User,
    status: r.Status || RequestStatus.PENDING,
    requestDate: r.RequestDate || new Date().toISOString().split('T')[0],
    notes: r.Comment || '',
    familyId: String(r.AssetFamilyId || '')
  } as Request;
};

export const mapSPVendor = (v: any): Vendor => ({
  id: String(v.Id || v.ID),
  name: v.Title || 'Unknown Vendor',
  contactName: v.ContactName || '',
  email: v.Email || '',
  website: v.Website?.Url || '',
  notes: v.Notes || ''
});

export const getMockAssetFamilies = (): AssetFamily[] => JSON.parse(JSON.stringify(mockAssetFamilies));
export const getMockAssets = (): Asset[] => JSON.parse(JSON.stringify(mockAssets));
export const getMockUsers = (): User[] => JSON.parse(JSON.stringify(mockUsers));
export const getMockRequests = (): Request[] => JSON.parse(JSON.stringify(mockRequests));
export const getMockVendors = (): Vendor[] => JSON.parse(JSON.stringify(MOCK_VENDORS));
