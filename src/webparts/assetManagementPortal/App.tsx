import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Asset, User, ColumnDef, AssetType, AssetStatus, Request, RequestStatus, AssetFamily, Config, Task, Vendor, AssignmentHistory } from './types';
import { mapSPUser, mapSPAssetFamily, mapSPAsset, mapSPRequest, mapSPVendor } from './services/mockData';
// import { getMockAssets, getMockUsers, getMockRequests, getMockAssetFamilies, getMockVendors } from './services/mockData';
import DataTable from './components/DataTable';
import UserProfile from './components/UserProfile';
import AssetFormModal from './components/AssetFormModal';
import EditProfileModal from './components/EditProfileModal';
import RequestAssetModal from './components/RequestAssetModal';
import AssetProfile from './components/AssetProfile';
import AdminDashboard from './components/AdminDashboard';
import TaskModal from './components/TaskModal';
import { ImportType } from './components/DataImportModal';
import { Edit, Package, PackageOpen, Clock, Users, Tv, KeyRound, ArrowRight, User as UserIcon, Check, X, Layers, LayoutDashboard, FileSpreadsheet, Monitor, UserSquare2, ClipboardList, ShieldAlert, List, ChevronDown, Briefcase, UserPlus, AlertCircle, TrendingUp, ListTodo, Search } from 'lucide-react';
import { Web } from 'sp-pnp-js';
import './custom.css';
type View = 'dashboard' | 'licenses' | 'hardware' | 'users' | 'requests' | 'reports' | 'admin';
type ModalMode = 'family' | 'instance';
type RequestCategory = 'Microsoft' | 'External' | 'Hardware';

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number, color: string, subtext?: string, onClick?: () => void }> = ({ icon: Icon, title, value, color, subtext, onClick }) => (
    <div
        onClick={onClick}
        className={`card shadow-sm border h-100 ${onClick ? 'cursor-pointer' : ''}`}
        style={{ transition: 'all 0.2s' }}
    >
        <div className="card-body d-flex justify-content-between align-items-start">
            <div>
                <p className="text-muted small fw-medium mb-1">{title}</p>
                <p className="h3 fw-bold text-dark mb-0">{value}</p>
                {subtext && <p className="text-muted small mt-1 mb-0">{subtext}</p>}
            </div>
            <div className="p-2 rounded" style={{ backgroundColor: `${color}1A` }}>
                <Icon className="h-6 w-6" style={{ color }} size={24} />
            </div>
        </div>
    </div>
);

const UserSwitcher: React.FC<{ users: User[], currentUser: User | null, onSwitch: (user: User) => void }> = ({ users, currentUser, onSwitch }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="position-relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn btn-light border d-flex align-items-center gap-2 rounded-pill px-3 py-1"
            >
                <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center overflow-hidden" style={{ width: 32, height: 32 }}>
                    {currentUser ? <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-100 h-100 object-cover" /> : <UserIcon size={18} className="text-white" />}
                </div>
                <div className="text-start d-none d-sm-block lh-1">
                    <div className="small fw-semibold text-dark">{currentUser?.fullName || 'Select User'}</div>
                    <div className="text-muted text-uppercase" style={{ fontSize: '10px' }}>{currentUser?.role || 'Guest'}</div>
                </div>
                <ChevronDown size={14} className="text-muted ms-1" />
            </button>

            {isOpen && (
                <div className="card position-absolute end-0 mt-2 shadow-lg border-0 z-3" style={{ width: '300px', maxHeight: '400px', overflowY: 'auto' }}>
                    <div className="card-header bg-white border-bottom py-2">
                        <small className="text-muted fw-bold text-uppercase">Switch Account (Mock)</small>
                    </div>
                    <div className="list-group list-group-flush">
                        {users.map(user => (
                            <button
                                key={user.id}
                                onClick={() => { onSwitch(user); setIsOpen(false); }}
                                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 py-2 px-3 ${currentUser?.id === user.id ? 'bg-light text-primary' : ''}`}
                            >
                                <img src={user.avatarUrl} alt={user.fullName} className="rounded-circle object-cover" style={{ width: 24, height: 24 }} />
                                <div className="text-truncate flex-grow-1">
                                    <div className="small fw-medium">{user.fullName}</div>
                                </div>
                                {currentUser?.id === user.id && <Check size={12} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

const GlobalSearch: React.FC<{ users: User[], assets: Asset[], families: AssetFamily[], onSelect: (type: 'user' | 'asset' | 'family', item: any) => void }> = ({ users, assets, families, onSelect }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredResults = useMemo(() => {
        if (!query) return { users: [], assets: [], families: [] };
        const q = query.toLowerCase();
        return {
            users: users.filter(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)).slice(0, 3),
            assets: assets.filter(a => a.title.toLowerCase().includes(q) || a.assetId.toLowerCase().includes(q)).slice(0, 3),
            families: families.filter(f => f.name.toLowerCase().includes(q)).slice(0, 3)
        }
    }, [query, users, assets, families]);

    const hasResults = filteredResults.users.length > 0 || filteredResults.assets.length > 0 || filteredResults.families.length > 0;

    return (
        <div className="position-relative w-100 d-none d-lg-block" style={{ maxWidth: '400px' }}>
            <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><Search size={16} className="text-muted" /></span>
                <input
                    type="text"
                    placeholder="Search users, assets, products..."
                    value={query}
                    onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    className="form-control bg-light border-start-0"
                />
            </div>
            {isOpen && query && hasResults && (
                <div className="card position-absolute top-100 start-0 w-100 mt-2 shadow-lg border-0 z-3 overflow-hidden">
                    {filteredResults.users.length > 0 && (
                        <div>
                            <div className="px-3 py-2 bg-light text-uppercase text-muted" style={{ fontSize: '11px', fontWeight: 600 }}>Users</div>
                            {filteredResults.users.map(u => (
                                <button key={u.id} onMouseDown={() => onSelect('user', u)} className="list-group-item list-group-item-action border-0 px-3 py-2 d-flex align-items-center gap-2">
                                    <img src={u.avatarUrl} className="rounded-circle" style={{ width: 24, height: 24 }} />
                                    <span className="small">{u.fullName}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {filteredResults.assets.length > 0 && (
                        <div>
                            <div className="px-3 py-2 bg-light text-uppercase text-muted border-top" style={{ fontSize: '11px', fontWeight: 600 }}>Assets</div>
                            {filteredResults.assets.map(a => (
                                <button key={a.id} onMouseDown={() => onSelect('asset', a)} className="list-group-item list-group-item-action border-0 px-3 py-2">
                                    <div className="small fw-medium">{a.title}</div>
                                    <div className="small text-muted font-monospace" style={{ fontSize: '10px' }}>{a.assetId}</div>
                                </button>
                            ))}
                        </div>
                    )}
                    {filteredResults.families.length > 0 && (
                        <div>
                            <div className="px-3 py-2 bg-light text-uppercase text-muted border-top" style={{ fontSize: '11px', fontWeight: 600 }}>Products</div>
                            {filteredResults.families.map(f => (
                                <button key={f.id} onMouseDown={() => onSelect('family', f)} className="list-group-item list-group-item-action border-0 px-3 py-2">
                                    <div className="small fw-medium">{f.name}</div>
                                    <div className="small text-muted">{f.assetType}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export interface IAppProps {
    description: string;
    isDarkTheme: boolean;
    environmentMessage: string;
    hasTeamsContext: boolean;
    userDisplayName: string;
}

const App: React.FC<IAppProps> = (props) => {
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [assetFamilies, setAssetFamilies] = useState<AssetFamily[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [requests, setRequests] = useState<Request[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);

    const [config, setConfig] = useState<Config>({
        softwareCategories: ['Microsoft', 'External'],
        hardwareCategories: ['Laptop', 'Monitor', 'Keyboard', 'Mac Mini', 'Accessory'],
        sites: ['HR', 'GMBH', 'SMALSUS'],
        departments: ['SharePoint Framework (SPFx)', 'Cloud Services', 'Testing', 'Design', 'Infrastructure', 'Management'],
        idConfiguration: [
            { id: 'sec-1', type: 'attribute', value: 'prefix', label: 'Prefix', length: 4, uppercase: true },
            { id: 'sec-3', type: 'attribute', value: 'productCode', label: 'Product Code', length: 4, uppercase: true },
            { id: 'sec-5', type: 'attribute', value: 'version', label: 'Version Code', length: 3, uppercase: true },
            { id: 'sec-7', type: 'sequence', value: 'sequence', label: 'Sequence', length: 4, paddingChar: '0' },
        ],
        idSeparator: '-',
        assetTypes: [
            { id: 'at-1', name: 'License', prefix: 'LIC' },
            { id: 'at-2', name: 'Hardware', prefix: 'HW' },
            { id: 'at-3', name: 'Platform Accounts', prefix: 'ACC' },
        ],
        modalLayouts: {
            licenseFamily: {
                tabs: [
                    {
                        id: 'profile',
                        label: 'Profile Information',
                        sections: [
                            { id: 'sec-ident', title: 'Identity', columns: 2, fields: ['name', 'productCode', 'vendor', 'assignmentModel'] },
                            { id: 'sec-class', title: 'Classification', columns: 2, fields: ['category', 'description'] }
                        ]
                    },
                    {
                        id: 'variants',
                        label: 'Variants',
                        sections: [
                            { id: 'sec-var', title: 'Tier Configuration', columns: 1, fields: ['variants'] }
                        ]
                    }
                ]
            },
            hardwareFamily: {
                tabs: [
                    {
                        id: 'profile',
                        label: 'General Details',
                        sections: [
                            { id: 'sec-hw-ident', title: 'Identity', columns: 2, fields: ['name', 'productCode', 'modelNumber', 'manufacturer', 'assignmentModel'] },
                            { id: 'sec-hw-class', title: 'Classification', columns: 2, fields: ['category', 'description'] }
                        ]
                    }
                ]
            },
            licenseInstance: {
                tabs: [
                    {
                        id: 'general',
                        label: 'General Details',
                        sections: [
                            { id: 'sec-li-gen', title: 'Core Info', columns: 2, fields: ['title', 'assetId', 'status', 'variantType', 'licenseKey', 'email'] }
                        ]
                    },
                    {
                        id: 'assignment',
                        label: 'Assignments',
                        sections: [
                            { id: 'sec-li-assign', title: 'Ownership & Active Users', columns: 2, fields: ['assignedUsers', 'activeUsers'] }
                        ]
                    },
                    {
                        id: 'financials',
                        label: 'Financials & Compliance',
                        sections: [
                            { id: 'sec-li-fin', title: 'Costing', columns: 1, fields: ['currencyTool'] },
                            { id: 'sec-li-dates', title: 'Dates & Status', columns: 2, fields: ['purchaseDate', 'renewalDate', 'complianceStatus'] }
                        ]
                    },
                    {
                        id: 'history',
                        label: 'History',
                        sections: [
                            { id: 'sec-li-hist', title: 'Assignment & Usage Log', columns: 1, fields: ['assignmentHistory'] }
                        ]
                    }
                ]
            },
            hardwareInstance: {
                tabs: [
                    {
                        id: 'general',
                        label: 'General Details',
                        sections: [
                            { id: 'sec-hi-gen', title: 'Core Info', columns: 2, fields: ['title', 'assetId', 'status', 'serialNumber', 'macAddress', 'location', 'condition'] }
                        ]
                    },
                    {
                        id: 'assignment',
                        label: 'Assignments',
                        sections: [
                            { id: 'sec-hi-assign', title: 'Ownership & Active Users', columns: 2, fields: ['assignedUser', 'activeUsers'] }
                        ]
                    },
                    {
                        id: 'financials',
                        label: 'Financials & Dates',
                        sections: [
                            { id: 'sec-hi-fin', title: 'Costing', columns: 1, fields: ['currencyTool'] },
                            { id: 'sec-hi-dates', title: 'Dates', columns: 2, fields: ['purchaseDate', 'warrantyExpiryDate'] }
                        ]
                    },
                    {
                        id: 'history',
                        label: 'History',
                        sections: [
                            { id: 'sec-hi-hist', title: 'Assignment & Usage Log', columns: 1, fields: ['assignmentHistory'] }
                        ]
                    }
                ]
            },
            userProfile: {
                tabs: [
                    {
                        id: 'basic',
                        label: 'Basic Information',
                        sections: [
                            { id: 'sec-u-gen', title: 'General', columns: 3, fields: ['firstName', 'lastName', 'suffix', 'jobTitle', 'department', 'site', 'typeOfContact'] },
                            { id: 'sec-u-soc', title: 'Social Media Accounts', columns: 2, fields: ['linkedin', 'twitter', 'facebook', 'instagram'] },
                            { id: 'sec-u-con', title: 'Contacts', columns: 2, fields: ['businessPhone', 'mobileNo', 'email', 'nonPersonalEmail', 'homePhone', 'skype', 'address', 'city'] },
                            { id: 'sec-u-com', title: 'Comments', columns: 1, fields: ['notes'] }
                        ]
                    },
                    {
                        id: 'image',
                        label: 'Image Information',
                        sections: [
                            { id: 'sec-u-img', title: 'Avatar', columns: 1, fields: ['avatarUpload'] }
                        ]
                    }
                ]
            }
        }
    });

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);

    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('instance');
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [editingFamily, setEditingFamily] = useState<AssetFamily | null>(null);

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [requestingUser, setRequestingUser] = useState<User | null>(null);
    const [requestCategory, setRequestCategory] = useState<RequestCategory | null>(null);

    // Task Modal State
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [requestForTask, setRequestForTask] = useState<Request | null>(null);

    const [activeView, setActiveView] = useState<View>('dashboard');
    const [assetViewMode, setAssetViewMode] = useState<'families' | 'items'>('items');

    const getMockUsers = async (): Promise<User[]> => {
        try {
            const res = new Web("https://smalsusinfolabs.sharepoint.com/sites/HHHHQA/AI");
            const usersRaw = await res.lists.getByTitle("Contacts").items.getAll();
            console.log('Fetched users:', usersRaw);

            const mappedUsers: User[] = usersRaw.map(mapSPUser);
            return mappedUsers;
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    };

    const getMockAssetFamilies = async (): Promise<AssetFamily[]> => {
        try {
            const res = new Web("https://smalsusinfolabs.sharepoint.com/sites/HHHHQA/AI");
            const familiesRaw = await res.lists.getByTitle("AssetRepository").items.getAll();
            console.log('Fetched asset families:', familiesRaw);

            const mappedFamilies: AssetFamily[] = familiesRaw.map(mapSPAssetFamily);
            return mappedFamilies;
        } catch (error) {
            console.error('Error fetching asset families:', error);
            return [];
        }
    };

    const getMockAssets = async (allUsers: User[]): Promise<Asset[]> => {
        try {
            const res = new Web("https://smalsusinfolabs.sharepoint.com/sites/HHHHQA/AI");
            const assetsRaw = await res.lists.getByTitle("AssetManagementSystem").items.getAll();
            console.log('Fetched assets:', assetsRaw);

            const mappedAssets: Asset[] = assetsRaw.map((a: any) => mapSPAsset(a, allUsers));
            return mappedAssets;
        } catch (error) {
            console.error('Error fetching assets:', error);
            return [];
        }
    };

    const getMockRequests = async (allUsers: User[]): Promise<Request[]> => {
        try {
            const res = new Web("https://smalsusinfolabs.sharepoint.com/sites/HHHHQA/AI");
            const requestsRaw = await res.lists.getByTitle("Request").items.getAll();
            console.log('Fetched requests:', requestsRaw);

            const mappedRequests: Request[] = requestsRaw.map((r: any) => mapSPRequest(r, allUsers));
            return mappedRequests;
        } catch (error) {
            console.error('Error fetching requests:', error);
            return [];
        }
    };

    const getMockVendors = async (): Promise<Vendor[]> => {
        try {
            const res = new Web("https://smalsusinfolabs.sharepoint.com/sites/HHHHQA/AI");
            const vendorsRaw = await res.lists.getByTitle("Vendors").items.getAll();
            console.log('Fetched vendors:', vendorsRaw);

            const mappedVendors: Vendor[] = vendorsRaw.map(mapSPVendor);
            return mappedVendors;
        } catch (error) {
            console.error('Error fetching vendors:', error);
            return [];
        }
    };

    useEffect(() => {
        const loadData = async () => {
            const mockUsers = await getMockUsers();
            setUsers(mockUsers);

            // Load other data after users are loaded so we can link them
            const [mockFamilies, mockAssets, mockRequests, mockVendors] = await Promise.all([
                getMockAssetFamilies(),
                getMockAssets(mockUsers),
                getMockRequests(mockUsers),
                getMockVendors()
            ]);

            setAssetFamilies(mockFamilies);
            setAssets(mockAssets);
            setRequests(mockRequests);
            setVendors(mockVendors);

            // Set default user (Admin)
            if (mockUsers.length > 0) {
                setCurrentUser(mockUsers[0]);
            }
        };

        loadData();
    }, []);

    // Update view mode when switching users to avoid restricted views
    useEffect(() => {
        if (currentUser && currentUser.role !== 'admin') {
            if (['users', 'admin', 'reports'].includes(activeView)) {
                setActiveView('dashboard');
            }
            // Normal users default to Item view
            setAssetViewMode('items');
        }
    }, [currentUser, activeView]);

    const isAdmin = currentUser?.role === 'admin';
    const adminUsers = useMemo(() => users.filter(u => u.role === 'admin'), [users]);

    const handleNavigation = (view: View) => {
        setActiveView(view);
        setSelectedUser(null);
        setSelectedFamilyId(null);
        // Admins default to Items view as per request, with toggle available
        if (view === 'licenses' || view === 'hardware') {
            setAssetViewMode('items');
        }
    };

    const handleUserClick = (user: User) => {
        // Only admins can view other profiles
        if (isAdmin || user.id === currentUser?.id) {
            setSelectedUser(user);
            setSelectedFamilyId(null);
        }
    };

    const handleFamilyClick = (family: AssetFamily) => {
        setSelectedFamilyId(family.id);
        setSelectedUser(null);
    };

    const handleBackToList = () => {
        setSelectedUser(null);
        setSelectedFamilyId(null);
    };

    const handleGlobalSearchSelect = (type: 'user' | 'asset' | 'family', item: any) => {
        if (type === 'user') {
            handleUserClick(item);
        } else if (type === 'asset') {
            // If asset, we might want to edit it or view its family?
            // For now, let's open the edit modal as a quick view if admin
            if (isAdmin) {
                handleEditAsset(item);
            } else {
                // Just console log or maybe navigate to my items if owned?
                alert(`Selected Asset: ${item.title}`);
            }
        } else if (type === 'family') {
            if (isAdmin) {
                handleFamilyClick(item);
            }
        }
    };

    const handleSaveFamily = (family: AssetFamily) => {
        if (editingFamily) {
            setAssetFamilies(assetFamilies.map(f => f.id === family.id ? { ...family, lastModifiedDate: new Date().toISOString() } : f));
        } else {
            const productCode = family.name.substring(0, 4).toUpperCase();
            const newFamily = { ...family, id: `fam-${new Date().toISOString()}`, productCode, createdDate: new Date().toISOString(), lastModifiedDate: new Date().toISOString() };
            setAssetFamilies([...assetFamilies, newFamily as AssetFamily]);
        }
        closeAssetModal();
    };

    const handleBulkCreate = (family: AssetFamily, variantName: string, quantity: number, commonData: Partial<Asset>) => {
        const newAssets: Asset[] = [];
        const familyPrefix = family.assetType === AssetType.LICENSE ? 'SOFT' : 'HARD';
        const productCode = (family as any).productCode || 'GEN';
        const familyInstances = assets.filter(a => a.familyId === family.id);
        let sequenceStart = familyInstances.length + 1;

        for (let i = 0; i < quantity; i++) {
            const sequenceNumber = String(sequenceStart + i).padStart(4, '0');
            const assetId = `${familyPrefix}-${productCode}-${sequenceNumber}`;
            const newAsset: Asset = {
                purchaseDate: new Date().toISOString().split('T')[0],
                cost: 0,
                ...commonData,
                id: `inst-${new Date().getTime() + i}`,
                assetId,
                familyId: family.id,
                title: `${family.name} ${sequenceStart + i}`,
                status: AssetStatus.AVAILABLE,
                assetType: family.assetType,
                variantType: variantName,
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                createdBy: 'Admin (Bulk)',
                modifiedBy: 'Admin (Bulk)',
            };
            newAssets.push(newAsset);
        }
        setAssets(prev => [...prev, ...newAssets]);
    };

    const handleSaveAsset = (asset: Asset) => {
        let finalAsset = { ...asset };
        const today = new Date().toISOString().split('T')[0];
        let newHistoryEntries: AssignmentHistory[] = [];

        // Assignment History Logic
        if (editingAsset) {
            // --- Ownership Changes ---
            const oldUser = editingAsset.assignedUser;
            const newUser = asset.assignedUser;
            const oldUsers = editingAsset.assignedUsers || [];
            const newUsers = asset.assignedUsers || [];

            // Single User Check
            if (oldUser?.id !== newUser?.id) {
                if (oldUser) {
                    newHistoryEntries.push({
                        id: `hist-${Date.now()}-1`,
                        assetId: asset.assetId,
                        assetName: asset.title,
                        date: today,
                        type: 'Reassigned',
                        assignedFrom: oldUser.fullName,
                        assignedTo: newUser?.fullName || 'Unassigned',
                        notes: `Reassigned from ${oldUser.fullName} to ${newUser ? newUser.fullName : 'Inventory'}`
                    });
                } else if (newUser) {
                    newHistoryEntries.push({
                        id: `hist-${Date.now()}-1`,
                        assetId: asset.assetId,
                        assetName: asset.title,
                        date: today,
                        type: 'Assigned',
                        assignedTo: newUser.fullName,
                        notes: `Assigned to ${newUser.fullName}`
                    });
                }
            }

            // Multiple Users Check
            const oldIds = oldUsers.map(u => u.id).sort().join(',');
            const newIds = newUsers.map(u => u.id).sort().join(',');
            if (oldIds !== newIds && newUsers.length > 0) {
                newHistoryEntries.push({
                    id: `hist-${Date.now()}-2`,
                    assetId: asset.assetId,
                    assetName: asset.title,
                    date: today,
                    type: 'Reassigned',
                    notes: `License assignment updated. Now assigned to ${newUsers.length} users.`
                });
            }

            // --- Usage Changes (Active Users) ---
            const oldActive = (editingAsset.activeUsers || []).map(u => u.id).sort().join(',');
            const newActive = (asset.activeUsers || []).map(u => u.id).sort().join(',');

            if (oldActive !== newActive) {
                const added = (asset.activeUsers || []).filter(u => !editingAsset.activeUsers?.some(old => old.id === u.id));
                const removed = (editingAsset.activeUsers || []).filter(u => !asset.activeUsers?.some(newU => newU.id === u.id));

                const changes = [];
                if (added.length) changes.push(`Added: ${added.map(u => u.fullName).join(', ')}`);
                if (removed.length) changes.push(`Removed: ${removed.map(u => u.fullName).join(', ')}`);

                newHistoryEntries.push({
                    id: `hist-usage-${Date.now()}`,
                    assetId: asset.assetId,
                    assetName: asset.title,
                    date: today,
                    type: 'Usage Update',
                    notes: `Active users updated. ${changes.join('; ')}`
                });
            }

            if (newHistoryEntries.length > 0) {
                finalAsset.assignmentHistory = [...(finalAsset.assignmentHistory || []), ...newHistoryEntries];
            }

            finalAsset = { ...finalAsset, modified: new Date().toISOString(), modifiedBy: 'Admin' };
            setAssets(assets.map(a => a.id === asset.id ? finalAsset : a));
        } else {
            // New Asset Creation
            const family = assetFamilies.find(f => f.id === asset.familyId);
            const familyPrefix = family?.assetType === AssetType.LICENSE ? 'SOFT' : 'HARD';
            const productCode = (family as any)?.productCode || 'GEN';
            const sequenceNumber = String(assets.filter(a => a.familyId === asset.familyId).length + 1).padStart(4, '0');
            const assetId = `${familyPrefix}-${productCode}-${sequenceNumber}`;

            const newAsset = { ...asset, id: `inst-${new Date().toISOString()}`, assetId: asset.assetId || assetId, created: new Date().toISOString(), modified: new Date().toISOString(), createdBy: 'Admin', modifiedBy: 'Admin' };

            // If assigned on creation
            if (newAsset.assignedUser || (newAsset.assignedUsers && newAsset.assignedUsers.length > 0)) {
                newHistoryEntries.push({
                    id: `hist-${Date.now()}`,
                    assetId: newAsset.assetId,
                    assetName: newAsset.title,
                    date: new Date().toISOString().split('T')[0],
                    type: 'Assigned',
                    assignedTo: newAsset.assignedUser?.fullName || 'Multiple Users',
                    notes: 'Initial Assignment'
                });
            }

            if (newAsset.activeUsers && newAsset.activeUsers.length > 0) {
                newHistoryEntries.push({
                    id: `hist-usage-${Date.now()}`,
                    assetId: newAsset.assetId,
                    assetName: newAsset.title,
                    date: new Date().toISOString().split('T')[0],
                    type: 'Usage Update',
                    notes: `Initial active users: ${newAsset.activeUsers.map(u => u.fullName).join(', ')}`
                });
            }

            newAsset.assignmentHistory = newHistoryEntries;

            setAssets([...assets, newAsset as Asset]);
        }
        closeAssetModal();
    };

    const handleDataImport = (type: ImportType, data: any[]) => {
        // Import logic (same as previous, omitted for brevity but preserved in component)
        // This is an Admin only function anyway
        if (type === 'users') {
            const newUsers: User[] = data.map((row, index) => ({
                id: Math.max(...users.map(u => Number(u.id) || 0), 0) + index + 1,
                fullName: row.fullName || 'Unknown',
                email: row.email,
                firstName: row.fullName?.split(' ')[0] || '',
                lastName: row.fullName?.split(' ').slice(1).join(' ') || '',
                avatarUrl: `https://i.pravatar.cc/150?u=${Math.random()}`,
                role: 'user', // Default role for imports
                isVerified: false,
                jobTitle: row.jobTitle || 'Staff',
                department: row.department || 'General',
                organization: 'Company',
                dateOfJoining: new Date().toISOString().split('T')[0],
                dateOfExit: null,
                businessPhone: row.businessPhone || '',
                mobileNo: '',
                address: row.location || '',
                city: '',
                postalCode: '',
                linkedin: '',
                twitter: '',
                userType: 'Internal',
                extension: '',
                permissionGroups: [],
                principalName: row.email,
                userStatus: 'Active',
                userTypeDetail: '',
                createdDate: new Date().toISOString(),
                modifiedDate: new Date().toISOString(),
                createdBy: 'Import',
                modifiedBy: 'Import',
                site: row.location ? [row.location] : [],
                typeOfContact: ['Employee'],
                platformAccounts: []
            }));
            const existingEmails = new Set(users.map(u => u.email.toLowerCase()));
            const filteredNewUsers = newUsers.filter(u => !existingEmails.has(u.email.toLowerCase()));
            setUsers(prev => [...prev, ...filteredNewUsers]);
            alert(`Imported ${filteredNewUsers.length} new users.`);
        } else {
            const isHardware = type === 'hardware';
            const assetType = isHardware ? AssetType.HARDWARE : AssetType.LICENSE;
            let updatedFamilies = [...assetFamilies];
            const newAssets: Asset[] = [];
            data.forEach((row, index) => {
                const familyName = row.familyName || (isHardware ? 'Imported Hardware' : 'Imported Software');
                let family = updatedFamilies.find(f => f.name.toLowerCase() === familyName.toLowerCase() && f.assetType === assetType);
                if (!family) {
                    const newFamilyId = `fam-imp-${Date.now()}-${index}`;
                    const newFamily: any = {
                        id: newFamilyId,
                        assetType,
                        name: familyName,
                        productCode: familyName.substring(0, 3).toUpperCase(),
                        category: isHardware ? 'Accessory' : 'External',
                        vendor: row.manufacturer || 'Unknown',
                        manufacturer: row.manufacturer || 'Unknown',
                        description: 'Imported via Excel',
                        createdDate: new Date().toISOString(),
                        lastModifiedDate: new Date().toISOString(),
                        variants: !isHardware ? [{ id: `var-${Date.now()}`, name: 'Standard', licenseType: 'Subscription', cost: 0 }] : undefined,
                        responsibleUser: currentUser,
                        assignmentModel: isHardware ? 'Single' : 'Multiple'
                    };
                    updatedFamilies.push(newFamily);
                    family = newFamily;
                }
                let assignedUser = null;
                let assignedUsers: User[] = [];
                if (row.assignedUserEmail) {
                    const foundUser = users.find(u => u.email.toLowerCase() === row.assignedUserEmail.toLowerCase());
                    if (foundUser) { assignedUser = foundUser; assignedUsers = [foundUser]; }
                }
                const prefix = isHardware ? 'HARD' : 'SOFT';
                const code = (family as any).productCode || 'IMP';
                const seq = String(assets.length + newAssets.length + 1).padStart(4, '0');
                const assetId = `${prefix}-${code}-${seq}`;
                const newAsset: Asset = {
                    id: `inst-imp-${Date.now()}-${index}`,
                    assetId,
                    familyId: family!.id,
                    title: row.title || `${family!.name} ${seq}`,
                    assetType,
                    status: row.status || AssetStatus.AVAILABLE,
                    purchaseDate: row.purchaseDate || new Date().toISOString().split('T')[0],
                    cost: row.cost || 0,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString(),
                    createdBy: 'Import',
                    modifiedBy: 'Import',
                    serialNumber: row.serialNumber,
                    modelNumber: row.modelNumber,
                    manufacturer: row.manufacturer,
                    location: row.location,
                    assignedUser,
                    licenseKey: row.licenseKey,
                    renewalDate: row.renewalDate,
                    variantType: row.variantType || 'Standard',
                    assignedUsers: assignedUsers.length > 0 ? assignedUsers : undefined,
                    email: row.assignedUserEmail
                };
                newAssets.push(newAsset);
            });
            setAssetFamilies(updatedFamilies);
            setAssets(prev => [...prev, ...newAssets]);
            alert(`Imported ${newAssets.length} assets.`);
        }
    };

    const closeAssetModal = () => {
        setIsAssetModalOpen(false);
        setEditingAsset(null);
        setEditingFamily(null);
    };

    const closeRequestModal = () => {
        setIsRequestModalOpen(false);
        setRequestingUser(null);
        setRequestCategory(null);
    };

    const handleEditAsset = (asset: Asset) => {
        setEditingAsset(asset);
        setModalMode('instance');
        setIsAssetModalOpen(true);
    };

    const handleEditFamily = (family: AssetFamily) => {
        setEditingFamily(family);
        setModalMode('family');
        setIsAssetModalOpen(true);
    }

    const handleAddFamily = () => {
        setEditingFamily(null);
        setModalMode('family');
        setIsAssetModalOpen(true);
    }

    const handleAddInstance = (family: AssetFamily) => {
        setEditingAsset(null);
        setEditingFamily(family); // Pass family context
        setModalMode('instance');
        setIsAssetModalOpen(true);
    }

    const handleSaveUser = (user: User) => {
        const updatedUsers = users.map(u => u.id === user.id ? user : u);
        setUsers(updatedUsers);

        setAssets(prevAssets => prevAssets.map(asset => {
            if (asset.assetType === AssetType.LICENSE && asset.assignedUsers?.some(u => u.id === user.id)) {
                return { ...asset, assignedUsers: asset.assignedUsers.map(u => u.id === user.id ? user : u) };
            }
            if (asset.assetType === AssetType.HARDWARE && asset.assignedUser?.id === user.id) {
                return { ...asset, assignedUser: user };
            }
            return asset;
        }));

        if (selectedUser?.id === user.id) setSelectedUser(user);
        if (currentUser?.id === user.id) setCurrentUser(user);
        setIsProfileModalOpen(false);
    };

    const handleSubmitRequest = (familyId: string, notes: string) => {
        const family = assetFamilies.find(f => f.id === familyId);
        const user = requestingUser;

        if (!family || !user) {
            console.error("Could not create request: Missing family or user");
            closeRequestModal();
            return;
        }

        const newRequest: Request = {
            id: `req-${new Date().getTime()}`,
            type: family.assetType === AssetType.HARDWARE ? 'Hardware' : 'Software',
            item: family.name,
            requestedBy: user,
            status: RequestStatus.PENDING,
            requestDate: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
            notes: notes,
            familyId: family.id
        };

        setRequests(prev => [newRequest, ...prev]);
        closeRequestModal();
    };

    const handleNewRequest = (category: RequestCategory) => {
        setRequestingUser(currentUser); // Always request as current user
        setRequestCategory(category);
        setIsRequestModalOpen(true);
    };

    const handleQuickRequest = (assetId: string) => {
        console.log("Quick request for assetId:", assetId);
    };

    const handleCreateTask = (request: Request) => {
        setRequestForTask(request);
        setIsTaskModalOpen(true);
    };

    const handleRequestAction = (requestId: string, newStatus: RequestStatus) => {
        if (newStatus === RequestStatus.APPROVED) {
            // Find request and trigger task creation workflow instead of direct status change
            const req = requests.find(r => r.id === requestId);
            if (req) {
                handleCreateTask(req);
            }
        } else {
            setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
        }
    };

    const handleTaskSubmit = (newTask: Task) => {
        setTasks(prev => [newTask, ...prev]);
        // Automatically update request status to In Progress and link task
        setRequests(prev => prev.map(r => r.id === newTask.requestId ? { ...r, status: RequestStatus.IN_PROGRESS, linkedTaskId: newTask.id } : r));
        setIsTaskModalOpen(false);
        setRequestForTask(null);
    };

    // --- Filtering Logic ---

    const visibleAssets = useMemo(() => {
        if (isAdmin) return assets;
        return assets.filter(a =>
            (a.assignedUser?.id === currentUser?.id) ||
            (a.assignedUsers?.some(u => u.id === currentUser?.id))
        );
    }, [assets, currentUser, isAdmin]);

    const visibleRequests = useMemo(() => {
        if (isAdmin) return requests;
        return requests.filter(r => r.requestedBy?.id === currentUser?.id);
    }, [requests, currentUser, isAdmin]);

    const userColumns: ColumnDef<User>[] = [
        { accessorKey: 'fullName', header: 'Name', width: 250, cell: ({ row }) => (<button onClick={() => handleUserClick(row.original)} className="d-flex align-items-center gap-3 text-start w-100 bg-transparent border-0 p-0 text-dark hover:text-primary"> <img src={row.original.avatarUrl} alt={row.original.fullName} className="rounded-circle" style={{ width: 32, height: 32 }} /> <span className="fw-medium text-truncate">{row.original.fullName}</span> </button>) },
        { accessorKey: 'email', header: 'Email', width: 250 },
        { accessorKey: 'role', header: 'Role', width: 100, cell: ({ row }) => <span className={`badge ${row.original.role === 'admin' ? 'text-bg-warning' : 'text-bg-secondary'}`}>{row.original.role}</span> },
        { accessorKey: 'jobTitle', header: 'Job Title', width: 200 }, { accessorKey: 'department', header: 'Department', width: 200 },
        {
            accessorKey: 'assets', header: 'Assigned Assets', width: 120, cell: ({ row }) => {
                const count = assets.filter(a => a.assignedUser?.id === row.original.id || a.assignedUsers?.some(u => u.id === row.original.id)).length;
                return <span className="badge bg-primary-subtle text-primary-emphasis rounded-pill">{count}</span>
            }
        },
        { accessorKey: 'view', header: '', width: 100, cell: ({ row }) => (<button onClick={() => handleUserClick(row.original)} className="btn btn-link btn-sm text-decoration-none d-flex align-items-center gap-1"> View Profile <ArrowRight size={14} /> </button>) }
    ];

    const requestColumns: ColumnDef<Request>[] = [
        { accessorKey: 'item', header: 'Item', width: 300, cell: ({ row }) => (<div> <p className="fw-medium text-dark mb-0">{row.original.item}</p> <p className="small text-muted mb-0">{row.original.type}</p> </div>) },
        { accessorKey: 'requestedBy.fullName', header: 'Requested By', width: 200, cell: ({ row }) => (<button disabled={!isAdmin} onClick={() => handleUserClick(row.original.requestedBy)} className={`d-flex align-items-center gap-2 text-start w-100 bg-transparent border-0 p-0 ${isAdmin ? 'text-primary' : 'text-dark'} ${!isAdmin ? 'cursor-default' : ''}`}> <img src={row.original.requestedBy.avatarUrl} alt={row.original.requestedBy.fullName} className="rounded-circle" style={{ width: 24, height: 24 }} /> <span className="small fw-medium text-truncate">{row.original.requestedBy.fullName}</span> </button>) },
        { accessorKey: 'requestDate', header: 'Request Date', width: 150 },
        {
            accessorKey: 'status', header: 'Status', width: 180, cell: ({ row }) => {
                const status = row.original.status;
                let badgeClass = 'text-bg-secondary';
                if (status === RequestStatus.PENDING) badgeClass = 'text-bg-warning';
                if (status === RequestStatus.APPROVED) badgeClass = 'text-bg-success';
                if (status === RequestStatus.REJECTED) badgeClass = 'text-bg-danger';
                if (status === RequestStatus.FULFILLED) badgeClass = 'text-bg-primary';
                if (status === RequestStatus.IN_PROGRESS) badgeClass = 'text-bg-info';

                // Find linked task if in progress
                const linkedTask = row.original.linkedTaskId ? tasks.find(t => t.id === row.original.linkedTaskId) : null;

                return (
                    <div className="d-flex flex-column align-items-start gap-1">
                        <span className={`badge rounded-pill ${badgeClass}`}>{status}</span>
                        {status === RequestStatus.IN_PROGRESS && linkedTask && (
                            <div className="d-flex align-items-center gap-1 bg-light border px-2 py-0 rounded text-muted mt-1" style={{ fontSize: '10px' }}>
                                <ListTodo size={10} className="text-primary" />
                                <span className="fw-medium">Task: {linkedTask.assignedTo?.fullName || 'Unassigned'}</span>
                            </div>
                        )}
                    </div>
                );
            }
        },
        { accessorKey: 'actions', header: 'Actions', width: 120, cell: ({ row }) => (isAdmin && row.original.status === RequestStatus.PENDING) ? (<div className="d-flex gap-2"> <button onClick={() => handleRequestAction(row.original.id, RequestStatus.APPROVED)} className="btn btn-sm btn-success rounded-circle p-1" title="Approve & Create Task"><Check size={14} /></button> <button onClick={() => handleRequestAction(row.original.id, RequestStatus.REJECTED)} className="btn btn-sm btn-danger rounded-circle p-1" title="Reject"><X size={14} /></button> </div>) : null, },
    ];

    // Columns for Individual Item View
    const assetInstanceColumns: ColumnDef<Asset>[] = [
        { accessorKey: 'assetId', header: 'Asset ID', width: 140, cell: ({ row }) => <span className="font-monospace small text-muted">{row.original.assetId}</span> },
        { accessorKey: 'title', header: 'Title', width: 200, cell: ({ row }) => <span className="fw-medium text-dark">{row.original.title}</span> },
        {
            accessorKey: 'familyId', header: 'Product/Family', width: 180, cell: ({ row }) => {
                const fam = assetFamilies.find(f => f.id === row.original.familyId);
                return <span className="small text-muted">{fam?.name || '-'}</span>
            }
        },
        {
            accessorKey: 'assignedUser', header: 'Assigned To', width: 200, cell: ({ row }) => {
                const users = row.original.assignedUsers && row.original.assignedUsers.length > 0
                    ? row.original.assignedUsers
                    : (row.original.assignedUser ? [row.original.assignedUser] : []);

                if (users.length === 0) return <span className="text-muted small">-</span>;

                return (
                    <div className="d-flex flex-column gap-1">
                        {users.map(u => (
                            <button key={u.id} disabled={!isAdmin} onClick={(e) => { e.stopPropagation(); handleUserClick(u); }} className={`small text-start text-truncate bg-transparent border-0 p-0 ${isAdmin ? 'text-primary' : 'text-dark'}`}>
                                {u.fullName}
                            </button>
                        ))}
                    </div>
                );
            }
        },
        {
            accessorKey: 'activeUsers', header: 'Active Users', width: 120, cell: ({ row }) => {
                const count = row.original.activeUsers?.length || 0;
                return (
                    <div className="d-flex align-items-center gap-1">
                        <span className={`badge rounded-pill ${count > 0 ? 'bg-primary-subtle text-primary-emphasis' : 'bg-secondary-subtle text-secondary-emphasis'}`}>{count}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: 'status', header: 'Status', width: 120, cell: ({ row }) => {
                let badgeClass = 'text-bg-secondary';
                if (row.original.status === AssetStatus.ACTIVE) badgeClass = 'text-bg-success';
                if (row.original.status === AssetStatus.AVAILABLE || row.original.status === AssetStatus.STORAGE) badgeClass = 'text-bg-info';
                if (row.original.status === AssetStatus.EXPIRED || row.original.status === AssetStatus.RETIRED) badgeClass = 'text-bg-danger';
                if (row.original.status === AssetStatus.IN_REPAIR || row.original.status === AssetStatus.PENDING) badgeClass = 'text-bg-warning';
                return <span className={`badge rounded-pill ${badgeClass}`}>{row.original.status}</span>
            }
        },
        { accessorKey: 'purchaseDate', header: 'Purchase Date', width: 120, cell: ({ row }) => <span className="small text-muted">{row.original.purchaseDate}</span> },
        { accessorKey: 'cost', header: 'Cost', width: 100, cell: ({ row }) => <span className="small text-muted">{isAdmin ? (row.original.cost ? `$${row.original.cost}` : '-') : '***'}</span> },
        {
            accessorKey: 'actions', header: '', width: 60, cell: ({ row }) => isAdmin && (
                <div className="text-center">
                    <button onClick={() => handleEditAsset(row.original)} className="btn btn-sm btn-light text-muted hover-text-primary rounded-circle p-1"><Edit size={16} /></button>
                </div>
            )
        },
    ];

    const dashboardStats = useMemo(() => {
        if (isAdmin) {
            const total = assets.length;
            const totalUsers = users.length;
            const pendingRequests = requests.filter(r => r.status === RequestStatus.PENDING).length;

            const now = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(now.getDate() + 30);
            const expiringSoon = assets.filter(asset => {
                if (asset.renewalDate) {
                    try { const expiry = new Date(asset.renewalDate); return expiry > now && expiry <= thirtyDaysFromNow; } catch (e) { return false; }
                }
                return false;
            }).length;
            return { total, totalUsers, pendingRequests, expiringSoon };
        } else {
            // User Stats
            const myAssets = visibleAssets.length;
            const myRequests = visibleRequests.length;
            const myLicenses = visibleAssets.filter(a => a.assetType === AssetType.LICENSE).length;
            const myHardware = visibleAssets.filter(a => a.assetType === AssetType.HARDWARE).length;
            return { myAssets, myRequests, myLicenses, myHardware };
        }
    }, [assets, visibleAssets, visibleRequests, isAdmin, users, requests]);

    // const recentActivity = useMemo(() => [...visibleAssets].sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()).slice(0, 5), [visibleAssets]);
    const assetTypeCounts = useMemo(() => ({ licenses: assetFamilies.filter(a => a.assetType === AssetType.LICENSE).length, hardware: assetFamilies.filter(a => a.assetType === AssetType.HARDWARE).length }), [assetFamilies]);

    const departmentStats = useMemo(() => {
        const depts: Record<string, number> = {};
        users.forEach(u => {
            const d = u.department || 'Unassigned';
            depts[d] = (depts[d] || 0) + 1;
        });
        return Object.entries(depts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [users]);

    //   const topUsers = useMemo(() => {
    //     const userAssetCounts = assets.reduce((acc: Record<string, { user: User, count: number }>, asset) => {
    //       const usersToCount = asset.assignedUsers || (asset.assignedUser ? [asset.assignedUser] : []);
    //       usersToCount.forEach(user => {
    //         if (user) {
    //           const id = user.id;
    //           acc[id] = (acc[id] || { user: user, count: 0 });
    //           acc[id].count++;
    //         }
    //       });
    //       return acc;
    //     }, {} as Record<string, { user: User, count: number }>);
    //     return Object.values(userAssetCounts).sort((a: { count: number }, b: { count: number }) => b.count - a.count).slice(0, 5);
    //   }, [assets]);

    const familiesWithCounts = useMemo(() => {
        return assetFamilies.map(family => {
            const instances = assets.filter(a => a.familyId === family.id);
            const assignedCount = instances.filter(i => (i.assignedUser || (i.assignedUsers && i.assignedUsers.length > 0))).length;
            return { ...family, total: instances.length, assigned: assignedCount, available: instances.length - assignedCount };
        });
    }, [assetFamilies, assets]);

    const assetFamilyColumns: ColumnDef<AssetFamily & { total: number; assigned: number; available: number; }>[] = [
        { accessorKey: 'name', header: 'Name', width: 250, cell: ({ row }) => isAdmin ? <button onClick={() => handleFamilyClick(row.original)} className="fw-semibold text-primary btn btn-link p-0 text-decoration-none">{row.original.name}</button> : <span className="fw-semibold text-dark">{row.original.name}</span> },
        { accessorKey: 'category', header: 'Category', width: 200 },
        { accessorKey: 'vendor', header: 'Vendor/Manufacturer', width: 200, cell: ({ row }) => <span>{(row.original as any).vendor || (row.original as any).manufacturer}</span> },
        { accessorKey: 'total', header: 'Total Units', width: 120, cell: ({ row }) => <div className="font-monospace text-end pe-2">{row.original.total}</div> },
        { accessorKey: 'assigned', header: 'Assigned', width: 120, cell: ({ row }) => <div className="font-monospace text-end pe-2">{row.original.assigned}</div> },
        { accessorKey: 'available', header: 'Available', width: 120, cell: ({ row }) => <div className="font-monospace text-success fw-bold text-end pe-2">{row.original.available}</div> },
        { accessorKey: 'actions', header: '', width: 60, cell: ({ row }) => isAdmin && <div className="text-center"><button onClick={() => handleEditFamily(row.original)} className="btn btn-sm btn-light text-muted hover-text-primary rounded-circle p-1"><Edit size={16} /></button></div> },
    ];

    const filteredFamilies = useMemo(() => {
        if (activeView === 'licenses') return familiesWithCounts.filter(f => f.assetType === AssetType.LICENSE);
        if (activeView === 'hardware') return familiesWithCounts.filter(f => f.assetType === AssetType.HARDWARE);
        return [];
    }, [familiesWithCounts, activeView]);

    const addButton = useMemo(() => {
        const config = {
            licenses: { text: 'Add License Profile', assetType: AssetType.LICENSE, icon: KeyRound },
            hardware: { text: 'Add Hardware Product', assetType: AssetType.HARDWARE, icon: Tv },
        };
        if ((activeView !== 'licenses' && activeView !== 'hardware') || !isAdmin) return null;
        const { text, icon: Icon } = config[activeView];
        return (<button onClick={() => { setEditingFamily(null); setModalMode('family'); setIsAssetModalOpen(true); }} className="btn btn-primary btn-sm d-flex align-items-center gap-2"> <Icon size={16} /> {text} </button>);
    }, [activeView, isAdmin]);

    const NavItem = ({ view, label, icon: Icon }: { view: View, label: string, icon: React.ElementType }) => (
        <button
            onClick={() => handleNavigation(view)}
            className={`nav-link d-flex align-items-center gap-2 px-3 ${activeView === view ? 'active fw-bold' : ''}`}
        >
            <Icon size={18} />
            <span className="d-none d-sm-inline">{label}</span>
        </button>
    );

    const renderContent = () => {
        // If a user is selected (Drill down mode)
        if (selectedUser) {
            // Filter assets for this specific selected user
            const userAssets = assets.filter(asset =>
                (asset.assignedUser?.id === selectedUser.id) ||
                (asset.assignedUsers?.some(u => u.id === selectedUser.id))
            );
            return (
                <div className="container-fluid p-0">
                    <button onClick={handleBackToList} className="btn btn-outline-secondary btn-sm mb-4"> &larr; Back to List </button>
                    <UserProfile user={selectedUser} userAssets={userAssets} assetFamilies={assetFamilies} onEditProfile={() => setIsProfileModalOpen(true)} onNewRequest={handleNewRequest} onQuickRequest={handleQuickRequest} />
                </div>
            );
        }

        // Family Detail View
        if (selectedFamilyId && isAdmin) {
            const family = assetFamilies.find(f => f.id === selectedFamilyId);
            if (!family) return <div>Family not found</div>;
            return (
                <AssetProfile
                    family={family}
                    allAssets={assets}
                    onBack={handleBackToList}
                    onEditAsset={handleEditAsset}
                    onUserClick={handleUserClick}
                    onAddInstance={handleAddInstance}
                    onEditFamily={handleEditFamily}
                    onBulkCreate={handleBulkCreate}
                />
            );
        }

        // Main Views
        switch (activeView) {
            case 'dashboard': return (
                <div className="container-fluid p-0">
                    {isAdmin ? (
                        <div className="d-grid gap-4">
                            {/* Admin Header Stats */}
                            <div className="row g-4">
                                <div className="col-12 col-md-6 col-lg-3"><StatCard icon={Users} title="Total Team" value={dashboardStats.totalUsers!} color="#4f46e5" subtext="Active Members" onClick={() => handleNavigation('users')} /></div>
                                <div className="col-12 col-md-6 col-lg-3"><StatCard icon={Package} title="Assets Managed" value={dashboardStats.total!} color="#10b981" subtext="Hardware & Licenses" onClick={() => handleNavigation('licenses')} /></div>
                                <div className="col-12 col-md-6 col-lg-3"><StatCard icon={ShieldAlert} title="Pending Actions" value={dashboardStats.pendingRequests!} color="#f59e0b" subtext="Requests needing approval" onClick={() => handleNavigation('requests')} /></div>
                                <div className="col-12 col-md-6 col-lg-3"><StatCard icon={Clock} title="Attention Needed" value={dashboardStats.expiringSoon!} color="#ef4444" subtext="Expiring in 30 days" onClick={() => handleNavigation('licenses')} /></div>
                            </div>

                            {/* Quick Action Toolbar */}
                            <div className="d-flex gap-3 overflow-x-auto pb-2">
                                <button className="btn btn-light border d-flex align-items-center gap-2 text-nowrap" onClick={() => prompt('Feature not implemented: Add User')}>
                                    <UserPlus size={16} className="text-primary" /> Add Team Member
                                </button>
                                <button className="btn btn-light border d-flex align-items-center gap-2 text-nowrap" onClick={() => { setEditingFamily(null); setModalMode('family'); setIsAssetModalOpen(true); }}>
                                    <PackageOpen size={16} className="text-success" /> Procure New Asset
                                </button>
                            </div>

                            <div className="row g-4">
                                {/* Column 1: Action Center & Requests */}
                                <div className="col-lg-6 d-grid gap-4">
                                    {/* Pending Requests Widget */}
                                    <div className="card shadow-sm border-0">
                                        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                                            <h6 className="m-0 fw-bold text-dark d-flex align-items-center gap-2">
                                                <AlertCircle size={18} className="text-warning" /> Action Center
                                            </h6>
                                            <span className="badge bg-light text-dark border">{requests.filter(r => r.status === 'Pending').length} Pending</span>
                                        </div>
                                        <ul className="list-group list-group-flush">
                                            {requests.filter(r => r.status === 'Pending').slice(0, 5).map(req => (
                                                <li key={req.id} className="list-group-item d-flex align-items-center justify-content-between py-3">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <img src={req.requestedBy.avatarUrl} className="rounded-circle border" style={{ width: 40, height: 40 }} alt={req.requestedBy.fullName} />
                                                        <div>
                                                            <p className="mb-0 small fw-bold text-dark">{req.requestedBy.fullName}</p>
                                                            <p className="mb-0 small text-muted">Requested: <span className="fw-medium text-dark">{req.item}</span></p>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex gap-2">
                                                        <button onClick={() => handleRequestAction(req.id, RequestStatus.APPROVED)} className="btn btn-sm btn-success p-1" title="Approve & Create Task"><Check size={16} /></button>
                                                        <button onClick={() => handleRequestAction(req.id, RequestStatus.REJECTED)} className="btn btn-sm btn-danger p-1" title="Reject"><X size={16} /></button>
                                                    </div>
                                                </li>
                                            ))}
                                            {requests.filter(r => r.status === 'Pending').length === 0 && (
                                                <li className="list-group-item py-5 text-center text-muted small">
                                                    <Check size={24} className="mx-auto mb-2 opacity-50" />
                                                    All caught up! No pending actions.
                                                </li>
                                            )}
                                        </ul>
                                        <div className="card-footer bg-light text-center border-top">
                                            <button onClick={() => handleNavigation('requests')} className="btn btn-link btn-sm text-decoration-none">View All Requests &rarr;</button>
                                        </div>
                                    </div>

                                    {/* Asset Health Widget */}
                                    <div className="card shadow-sm border-0 p-4">
                                        <h6 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2"><TrendingUp size={18} className="text-primary" /> Asset Utilization</h6>
                                        <div className="d-grid gap-3">
                                            <div>
                                                <div className="d-flex justify-content-between small mb-1">
                                                    <span className="text-muted">Licenses Assigned</span>
                                                    <span className="fw-medium text-dark">{Math.round((assets.filter(a => a.assetType === AssetType.LICENSE && a.assignedUsers?.length).length / assets.filter(a => a.assetType === AssetType.LICENSE).length) * 100 || 0)}%</span>
                                                </div>
                                                <div className="progress" style={{ height: '8px' }}>
                                                    <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${(assets.filter(a => a.assetType === AssetType.LICENSE && a.assignedUsers?.length).length / assets.filter(a => a.assetType === AssetType.LICENSE).length) * 100}%` }}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="d-flex justify-content-between small mb-1">
                                                    <span className="text-muted">Hardware Assigned</span>
                                                    <span className="fw-medium text-dark">{Math.round((assets.filter(a => a.assetType === AssetType.HARDWARE && a.assignedUser).length / assets.filter(a => a.assetType === AssetType.HARDWARE).length) * 100 || 0)}%</span>
                                                </div>
                                                <div className="progress" style={{ height: '8px' }}>
                                                    <div className="progress-bar bg-success" role="progressbar" style={{ width: `${(assets.filter(a => a.assetType === AssetType.HARDWARE && a.assignedUser).length / assets.filter(a => a.assetType === AssetType.HARDWARE).length) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-top row text-center">
                                            <div className="col-6">
                                                <p className="h4 fw-bold text-dark mb-0">{assetTypeCounts.licenses}</p>
                                                <p className="small text-muted text-uppercase mb-0">License Types</p>
                                            </div>
                                            <div className="col-6 border-start">
                                                <p className="h4 fw-bold text-dark mb-0">{assetTypeCounts.hardware}</p>
                                                <p className="small text-muted text-uppercase mb-0">Hardware Types</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: Team & Activity */}
                                <div className="col-lg-6 d-grid gap-4">
                                    {/* Team Composition Widget */}
                                    <div className="card shadow-sm border-0 p-4">
                                        <h6 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2"><Briefcase size={18} className="text-purple-500" /> Department Distribution</h6>
                                        <div className="d-grid gap-3">
                                            {departmentStats.map(([dept, count]) => (
                                                <div key={dept}>
                                                    <div className="d-flex justify-content-between small mb-1">
                                                        <span className="fw-medium text-dark">{dept}</span>
                                                        <span className="text-muted">{count} Members</span>
                                                    </div>
                                                    <div className="progress" style={{ height: '6px' }}>
                                                        <div className="progress-bar bg-primary" style={{ width: `${(count / users.length) * 100}%` }}></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* New Joiners / Recent Users */}
                                    <div className="card shadow-sm border-0">
                                        <div className="card-header bg-white border-bottom py-3">
                                            <h6 className="m-0 fw-bold text-dark">New Joiners</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row g-3">
                                                {users.slice(0, 4).map(user => (
                                                    <div key={user.id} className="col-sm-6">
                                                        <div onClick={() => handleUserClick(user)} className="d-flex align-items-center gap-3 p-2 rounded border bg-light cursor-pointer hover-bg-light-dark transition-all">
                                                            <img src={user.avatarUrl} className="rounded-circle" style={{ width: 40, height: 40 }} alt={user.fullName} />
                                                            <div className="overflow-hidden">
                                                                <p className="small fw-medium text-dark text-truncate mb-0">{user.fullName}</p>
                                                                <p className="small text-muted text-truncate mb-0">{user.jobTitle}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="card-footer bg-light text-center border-top">
                                            <button onClick={() => handleNavigation('users')} className="btn btn-link btn-sm text-decoration-none text-muted">View Full Team Directory</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // User Stats Dashboard
                        <div className="row g-4">
                            <div className="col-12 col-md-6 col-lg-3"><StatCard icon={Package} title="My Total Assets" value={dashboardStats.myAssets!} color="#4f46e5" onClick={() => { handleNavigation('licenses'); setAssetViewMode('items'); }} /></div>
                            <div className="col-12 col-md-6 col-lg-3"><StatCard icon={KeyRound} title="My Licenses" value={dashboardStats.myLicenses!} color="#10b981" onClick={() => { handleNavigation('licenses'); setAssetViewMode('items'); }} /></div>
                            <div className="col-12 col-md-6 col-lg-3"><StatCard icon={Tv} title="My Hardware" value={dashboardStats.myHardware!} color="#f59e0b" onClick={() => { handleNavigation('hardware'); setAssetViewMode('items'); }} /></div>
                            <div className="col-12 col-md-6 col-lg-3"><StatCard icon={ClipboardList} title="My Active Requests" value={dashboardStats.myRequests!} color="#ef4444" onClick={() => handleNavigation('requests')} /></div>

                            <div className="col-12 mt-4">
                                <div className="card shadow-sm border-0 p-4">
                                    <h5 className="fw-bold text-dark mb-4">My Quick Actions</h5>
                                    <div className="d-flex gap-3">
                                        <button onClick={() => handleNewRequest('Hardware')} className="btn btn-light border p-3 d-flex align-items-center gap-3 flex-grow-1 justify-content-center">
                                            <div className="bg-white rounded-circle p-2 shadow-sm text-primary"><Tv size={20} /></div>
                                            <span className="fw-medium text-dark">Request Hardware</span>
                                        </button>
                                        <button onClick={() => handleNewRequest('Microsoft')} className="btn btn-light border p-3 d-flex align-items-center gap-3 flex-grow-1 justify-content-center">
                                            <div className="bg-white rounded-circle p-2 shadow-sm text-primary"><KeyRound size={20} /></div>
                                            <span className="fw-medium text-dark">Request License</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
            case 'licenses':
            case 'hardware':
                const isHardware = activeView === 'hardware';
                const currentType = isHardware ? AssetType.HARDWARE : AssetType.LICENSE;

                // Filter Data based on view mode
                const familiesData = filteredFamilies;
                const itemsData = visibleAssets.filter(a => a.assetType === currentType);

                return (
                    <div className="container-fluid p-0 d-flex flex-column gap-3">
                        {/* View Toggle and Action Bar */}
                        <div className="card shadow-sm border-0 p-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
                            <div className="btn-group bg-light p-1 rounded" role="group">
                                <button
                                    onClick={() => setAssetViewMode('items')}
                                    className={`btn btn-sm border-0 rounded d-flex align-items-center gap-2 ${assetViewMode === 'items' ? 'bg-white shadow-sm text-primary' : 'text-muted'}`}
                                >
                                    <List size={16} /> {isAdmin ? 'Individual Items' : 'My Items'}
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={() => setAssetViewMode('families')}
                                        className={`btn btn-sm border-0 rounded d-flex align-items-center gap-2 ${assetViewMode === 'families' ? 'bg-white shadow-sm text-primary' : 'text-muted'}`}
                                    >
                                        <Layers size={16} /> Asset Families
                                    </button>
                                )}
                            </div>
                            {addButton}
                        </div>

                        {assetViewMode === 'families' && isAdmin ? (
                            <DataTable
                                columns={assetFamilyColumns}
                                data={familiesData}
                            />
                        ) : (
                            <DataTable
                                columns={assetInstanceColumns}
                                data={itemsData}
                            />
                        )}
                    </div>
                );
            case 'users': return isAdmin ? <div className="container-fluid p-0"><DataTable columns={userColumns} data={users} /></div> : null;
            case 'requests': return <div className="container-fluid p-0"><DataTable columns={requestColumns} data={visibleRequests} /></div>;
            case 'admin': return isAdmin ? <div className="container-fluid p-0">
                <AdminDashboard
                    config={config}
                    onUpdateConfig={setConfig}
                    users={users}
                    assets={assets}
                    families={assetFamilies}
                    vendors={vendors}
                    onUpdateVendors={setVendors}
                    onImportData={handleDataImport}
                    onNavigateToFamily={handleFamilyClick}
                    onEditFamily={handleEditFamily}
                    onAddFamily={handleAddFamily}
                />
            </div> : null;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-light d-flex flex-column">
            {/* Top Navigation Bar */}
            <header className="navbar navbar-expand-md navbar-light bg-white border-bottom sticky-top shadow-sm">
                <div className="container-fluid px-4">
                    <div className="d-flex align-items-center gap-4">
                        <a className="navbar-brand d-flex align-items-center gap-2 cursor-pointer" onClick={() => handleNavigation('dashboard')}>
                            <LayoutDashboard className="text-primary" size={32} />
                            <span className="fw-bold d-none d-lg-block">GeminiAM</span>
                        </a>
                        <div className="vr d-none d-md-block text-muted"></div>
                        <nav className="nav nav-pills d-none d-md-flex">
                            <NavItem view="dashboard" label="Dashboard" icon={LayoutDashboard} />
                            <NavItem view="licenses" label="Licenses" icon={FileSpreadsheet} />
                            <NavItem view="hardware" label="Hardware" icon={Monitor} />
                            {isAdmin && <NavItem view="users" label="Users" icon={UserSquare2} />}
                            <NavItem view="requests" label="Requests" icon={ClipboardList} />
                            {isAdmin && <NavItem view="admin" label="Admin" icon={ShieldAlert} />}
                        </nav>
                    </div>

                    <div className="flex-grow-1 mx-4 d-flex justify-content-center">
                        <GlobalSearch users={users} assets={assets} families={assetFamilies} onSelect={handleGlobalSearchSelect} />
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        <UserSwitcher users={users} currentUser={currentUser} onSwitch={setCurrentUser} />
                    </div>
                </div>
            </header>

            <main className="flex-grow-1 p-4">
                {renderContent()}
            </main>

            {isAssetModalOpen && isAdmin && (
                <AssetFormModal
                    isOpen={isAssetModalOpen}
                    onClose={closeAssetModal}
                    onSaveFamily={handleSaveFamily}
                    onSaveAsset={handleSaveAsset}
                    family={editingFamily}
                    asset={editingAsset}
                    mode={modalMode}
                    assetType={
                        editingFamily ? editingFamily.assetType :
                            editingAsset ? editingAsset.assetType :
                                (activeView === 'hardware' ? AssetType.HARDWARE : AssetType.LICENSE)
                    }
                    allUsers={users}
                    allAssets={assets}
                    config={config}
                    vendors={vendors}
                />
            )}

            {isProfileModalOpen && selectedUser && <EditProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onSave={handleSaveUser} user={selectedUser} config={config} />}
            {isRequestModalOpen && requestingUser && <RequestAssetModal isOpen={isRequestModalOpen} onClose={closeRequestModal} onSubmit={handleSubmitRequest} user={requestingUser} assetFamilies={assetFamilies} category={requestCategory} />}
            {isTaskModalOpen && requestForTask && <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} request={requestForTask} adminUsers={adminUsers} onCreateTask={handleTaskSubmit} />}
        </div>
    );
};

export default App;