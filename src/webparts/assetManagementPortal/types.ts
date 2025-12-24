export type UserRole = 'admin' | 'user';

export interface Vendor {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
}

export interface AssignmentHistory {
  id: string;
  assetName: string;
  assetId: string;
  date: string;
  type: 'Assigned' | 'Returned' | 'Lost' | 'Reassigned' | 'Usage Update';
  notes?: string;
  assignedTo?: string; // Name of user assigned to
  assignedFrom?: string; // Name of previous user
}

export interface User {
  id: number | string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  isVerified: boolean;
  jobTitle: string;
  department: string;
  organization: string;
  dateOfJoining: string;
  dateOfExit: string | null;
  businessPhone: string;
  mobileNo: string;
  nonPersonalEmail?: string;
  homePhone?: string;
  address: string;
  city: string;
  postalCode: string;
  country?: string;
  webPage?: string;
  skype?: string;
  linkedin: string;
  twitter: string;
  facebook?: string;
  instagram?: string;
  userType: string;
  extension: string;
  permissionGroups: string[];
  principalName: string;
  userStatus: string;
  userTypeDetail: string;
  createdDate: string;
  modifiedDate: string;
  createdBy: string;
  modifiedBy: string;
  site: string[];
  typeOfContact: string[];
  notes?: string;
  suffix?: string;
  platformAccounts?: PlatformAccount[];
  history?: AssignmentHistory[];
}

export enum AssetType {
  LICENSE = 'License',
  HARDWARE = 'Hardware',
}

// Master record for a software product
export interface SoftwareProfile {
  id: string;
  assetType: AssetType.LICENSE;
  name: string;
  productCode: string;
  category: 'Microsoft' | 'External';
  vendor: string;
  description?: string;
  configuration?: string;
  attachments?: { name: string; url: string }[];
  createdDate: string;
  lastModifiedDate: string;
  responsibleUser?: User;
  variants: LicenseVariant[];
  assignmentModel?: 'Single' | 'Multiple';
}

// Defines license tiers under a Software Profile
export interface LicenseVariant {
  id: string;
  name: string;
  licenseType: LicenseType;
  cost: number;
  features?: string;
  userLimits?: number;
}

// Master record for a hardware product
export interface HardwareProduct {
  id: string;
  assetType: AssetType.HARDWARE;
  name: string;
  productCode: string;
  category: 'Laptop' | 'Monitor' | 'Keyboard' | 'Mac Mini' | 'Accessory';
  manufacturer: string;
  modelNumber?: string;
  standardConfiguration?: string;
  typicalUseCase?: string;
  averageCostRange?: [number, number];
  createdDate: string;
  lastModifiedDate: string;
  description?: string;
  assignmentModel?: 'Single' | 'Multiple';
}

export type AssetFamily = SoftwareProfile | HardwareProduct;

// Individual instance of a license or hardware item
export interface Asset {
  id: string;
  assetId: string;
  familyId: string;
  title: string;
  status: AssetStatus;
  purchaseDate: string;
  cost: number;
  created: string;
  modified: string;
  createdBy: string;
  modifiedBy: string;
  lastAuditDate?: string;
  maintenanceHistory?: { date: string; notes: string }[];
  assignmentHistory?: AssignmentHistory[];
  activeUsers?: User[];

  // Software-specific fields
  assetType: AssetType;
  variantType?: string;
  licenseKey?: string;
  renewalDate?: string;
  assignedUsers?: User[];
  email?: string;
  complianceStatus?: ComplianceStatus;

  // Hardware-specific fields
  serialNumber?: string;
  macAddress?: string;
  ipAddress?: string;
  warrantyExpiryDate?: string;
  assignedUser?: User | null;
  location?: string;
  condition?: HardwareCondition;
  configuration?: string;
  os?: string;
  modelNumber?: string;
  manufacturer?: string;
}

export enum AssetStatus {
  ACTIVE = 'Active',
  AVAILABLE = 'Available',
  EXPIRED = 'Expired',
  PENDING = 'Pending',
  SUSPENDED = 'Suspended',
  IN_REPAIR = 'In Repair',
  RETIRED = 'Retired',
  STORAGE = 'In Storage',
  INACTIVE = 'Inactive',
}

export enum LicenseType {
  SUBSCRIPTION = 'Subscription',
  PERPETUAL = 'Perpetual',
  VOLUME = 'Volume',
  SITE = 'Site-based',
}

export enum ComplianceStatus {
  COMPLIANT = 'Compliant',
  PENDING_AUDIT = 'Pending Audit',
  NON_COMPLIANT = 'Non-compliant',
}

export enum HardwareCondition {
  NEW = 'New',
  GOOD = 'Good',
  FAIR = 'Fair',
  POOR = 'Poor',
  BROKEN = 'Broken',
  WORKING = 'Working',
  DAMAGED = 'Damaged',
  NEEDS_REPAIR = 'Needs Repair',
}

export interface ColumnDef<T> {
  accessorKey: keyof T | string;
  header: string;
  cell?: (props: { row: { original: T } }) => React.ReactNode;
  width?: number;
}

export enum Platform {
  SHAREPOINT = 'SharePoint',
  GMAIL = 'Gmail',
  DOGADO = 'Dogado',
}

export enum AccountType {
  INTERNAL = 'Internal',
  EXTERNAL = 'External',
  GUEST = 'Guest',
}

export enum AccountStatus {
  ACTIVE = 'Active',
  DISABLED = 'Disabled',
}

export interface PlatformAccount {
  id: string;
  userId: number | string;
  platform: Platform;
  accountType: AccountType;
  email: string;
  status: AccountStatus;
  createdDate: string;
}

export enum RequestStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  FULFILLED = 'Fulfilled',
  IN_PROGRESS = 'In Progress'
}

export interface Request {
  id: string;
  type: 'Hardware' | 'Software';
  item: string;
  requestedBy: User;
  status: RequestStatus;
  requestDate: string;
  notes?: string;
  assetId?: string;
  familyId?: string;
  linkedTaskId?: string;
}

export enum TaskPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done'
}

export interface Task {
  id: string;
  requestId: string;
  title: string;
  assignedTo: User | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  description?: string;
  createdDate: string;
}

export type IdSectionType = 'static' | 'attribute' | 'sequence' | 'date';

export interface IdSection {
  id: string;
  type: IdSectionType;
  value: string;
  label: string;
  length?: number;
  paddingChar?: string;
  uppercase?: boolean;
}

export interface AssetTypeMetadata {
  id: string;
  name: string;
  prefix: string;
}

// --- Modal Configuration Types ---

export interface SectionDefinition {
  id: string;
  title: string;
  columns: number; // 1 | 2 | 3 | 4
  fields: string[]; // List of field keys
}

export interface TabDefinition {
  id: string;
  label: string;
  sections: SectionDefinition[];
}

export interface ModalLayout {
  tabs: TabDefinition[];
}

export interface ModalConfig {
  licenseFamily: ModalLayout;
  hardwareFamily: ModalLayout;
  licenseInstance: ModalLayout;
  hardwareInstance: ModalLayout;
  userProfile: ModalLayout;
}

export interface Config {
  softwareCategories: string[];
  hardwareCategories: string[];
  sites: string[];
  departments: string[];
  idConfiguration: IdSection[];
  idSeparator: string;
  assetTypes: AssetTypeMetadata[];
  modalLayouts: ModalConfig;
}
