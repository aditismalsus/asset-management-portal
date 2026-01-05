
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Asset, User, ColumnDef, AssetType, AssetStatus, Request, RequestStatus, AssetFamily, SoftwareProfile, Config, Task, Vendor, AssignmentHistory, HardwareCondition, Site, Department } from './types';
import { initSPService, getAssetFamilies, getAssets, getUsers, getRequests, getVendors, getSites, getDepartments, addAssetFamily, updateAssetFamily, addUser, updateUser, deleteUser, addRequest, updateRequest, addAsset, bulkAddAssets, updateAsset, getSmartMetadata, updateSmartMetadata } from './services/SPService';


import './Custom.css';
import DataTable from '../aisPortal/components/DataTable';
import UserProfile from '../aisPortal/components/UserProfile';
import AssetFormModal from '../aisPortal/components/AssetFormModal';
import EditProfileModal from '../aisPortal/components/EditProfileModal';
import RequestAssetModal from '../aisPortal/components/RequestAssetModal';
import AssetProfile from '../aisPortal/components/AssetProfile';
import AdminDashboard from '../aisPortal/components/AdminDashboard';
import TaskModal from '../aisPortal/components/TaskModal';
import { ImportType } from '../aisPortal/components/DataImportModal';
import { Edit, Package, PackageOpen, Clock, Users, Tv, KeyRound, ArrowRight, User as UserIcon, Check, X, Layers, LayoutDashboard, FileSpreadsheet, Monitor, UserSquare2, ClipboardList, ShieldAlert, List, ChevronDown, Briefcase, UserPlus, AlertCircle, TrendingUp, ListTodo, Search, CheckCircle } from 'lucide-react';

type View = 'dashboard' | 'licenses' | 'hardware' | 'users' | 'requests' | 'reports' | 'admin';
type ModalMode = 'family' | 'instance';
type RequestCategory = 'Microsoft' | 'External' | 'Hardware';

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number, color: string, subtext?: string, onClick?: () => void }> = ({ icon: Icon, title, value, color, subtext, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white p-4 rounded-3 shadow-sm d-flex align-items-start justify-content-between border ${onClick ? 'cursor-pointer border-primary-subtle' : 'border-light'}`}
        style={{ transition: 'box-shadow 0.3s' }}
    >
        <div>
            <p className="text-secondary small fw-medium mb-1">{title}</p>
            <p className="fs-4 fw-bold text-dark">{value}</p>
            {subtext && <p className="small text-muted mt-1" style={{ fontSize: '0.75rem' }}>{subtext}</p>}
        </div>
        <div className="p-2 rounded-3" style={{ backgroundColor: `${color}1A` }}>
            <Icon className="h-6 w-6" style={{ color }} />
        </div>
    </div>
);

const UserSwitcher: React.FC<{ users: User[], currentUser: User | null, onSwitch: (user: User) => void }> = ({ users, currentUser, onSwitch }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="position-relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="d-flex align-items-center gap-3 px-3 py-2 bg-light hover-bg-secondary-subtle rounded-pill border border-light transition"
                style={{ border: '1px solid #dee2e6' }}
            >
                <div className="rounded-circle bg-secondary-subtle d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '2rem', height: '2rem' }}>
                    {currentUser ? <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-100 h-100 object-fit-cover" /> : <UserIcon size={18} className="text-secondary" />}
                </div>
                <div className="text-start d-none d-sm-block">
                    <p className="small fw-semibold text-dark mb-0" style={{ fontSize: '0.875rem' }}>{currentUser?.fullName || 'Select User'}</p>
                    <p className="text-secondary text-uppercase mb-0" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>{currentUser?.role || 'Guest'}</p>
                </div>
                <ChevronDown size={14} className="text-secondary" />
            </button>

            {isOpen && (
                <div className="position-absolute end-0 mt-2 bg-white rounded-3 shadow border border-light py-2 z-3" style={{ width: '24rem', zIndex: 1050 }}>
                    <div className="px-4 py-2 border-bottom border-light text-secondary text-uppercase fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
                        Switch Account (Mock)
                    </div>
                    <div className="row g-0 overflow-y-auto" style={{ maxHeight: '400px' }}>
                        {users.map(user => (
                            <button
                                key={user.id}
                                onClick={() => { onSwitch(user); setIsOpen(false); }}
                                className={`col-6 text-start px-4 py-2 d-flex align-items-center gap-2 border-bottom border-transparent ${currentUser?.id === user.id ? 'bg-primary-subtle' : 'bg-white hover-bg-light'}`}
                                style={{ background: currentUser?.id === user.id ? 'var(--bs-primary-bg-subtle)' : 'transparent' }}
                            >
                                <img src={user.avatarUrl} alt={user.fullName} className="rounded-circle object-fit-cover flex-shrink-0" style={{ width: '1.5rem', height: '1.5rem' }} />
                                <div className="text-truncate" style={{ minWidth: 0 }}>
                                    <p className={`small fw-medium mb-0 text-truncate ${currentUser?.id === user.id ? 'text-primary' : 'text-dark'}`}>{user.fullName}</p>
                                    <p className="text-secondary text-uppercase mb-0" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>{user.role}</p>
                                </div>
                                {currentUser?.id === user.id && <Check size={12} className="ms-auto text-primary flex-shrink-0" />}
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
        <div className="position-relative w-100 mx-auto d-none d-lg-block" style={{ maxWidth: '28rem' }}>
            <div className="position-relative">
                <Search className="position-absolute top-50 translate-middle-y text-secondary" style={{ left: '0.75rem', width: '1rem', height: '1rem', pointerEvents: 'none' }} />
                <input
                    type="text"
                    placeholder="Search users, assets, products..."
                    value={query}
                    onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    className="form-control bg-light border-0 focus-ring ps-5 py-2 rounded-3 small"
                    style={{ paddingLeft: '2.5rem' }}
                />
            </div>
            {isOpen && query && hasResults && (
                <div className="position-absolute top-100 start-0 w-100 mt-2 bg-white rounded-3 shadow border border-light py-2 z-3 overflow-hidden" style={{ zIndex: 1050 }}>
                    {filteredResults.users.length > 0 && (
                        <div>
                            <div className="px-4 py-1 small fw-semibold text-secondary text-uppercase bg-light">Users</div>
                            {filteredResults.users.map(u => (
                                <button key={u.id} onMouseDown={() => onSelect('user', u)} className="w-100 text-start px-4 py-2 hover-bg-primary-subtle d-flex align-items-center gap-3 border-0 bg-white">
                                    <img src={u.avatarUrl} className="rounded-circle" style={{ width: '1.5rem', height: '1.5rem' }} />
                                    <span className="small text-dark">{u.fullName}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {filteredResults.assets.length > 0 && (
                        <div>
                            <div className="px-4 py-1 small fw-semibold text-secondary text-uppercase bg-light border-top border-light">Assets</div>
                            {filteredResults.assets.map(a => (
                                <button key={a.id} onMouseDown={() => onSelect('asset', a)} className="w-100 text-start px-4 py-2 hover-bg-primary-subtle border-0 bg-white">
                                    <p className="small text-dark fw-medium mb-0">{a.title}</p>
                                    <p className="small text-secondary font-monospace mb-0" style={{ fontSize: '0.75rem' }}>{a.assetId}</p>
                                </button>
                            ))}
                        </div>
                    )}
                    {filteredResults.families.length > 0 && (
                        <div>
                            <div className="px-4 py-1 small fw-semibold text-secondary text-uppercase bg-light border-top border-light">Products</div>
                            {filteredResults.families.map(f => (
                                <button key={f.id} onMouseDown={() => onSelect('family', f)} className="w-100 text-start px-4 py-2 hover-bg-primary-subtle border-0 bg-white">
                                    <p className="small text-dark fw-medium mb-0">{f.name}</p>
                                    <p className="small text-secondary mb-0">{f.assetType}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

import { WebPartContext } from '@microsoft/sp-webpart-base';
import { Web } from "@pnp/sp/webs";
import { SPFx } from "@pnp/sp";

interface IAppProps {
    context: WebPartContext;
}



const App: React.FC<IAppProps> = ({ context }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [assetFamilies, setAssetFamilies] = useState<AssetFamily[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [requests, setRequests] = useState<Request[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => { console.log("Loading state:", isLoading); }, [isLoading]);

    useEffect(() => {
        initSPService(context);

        const loadMetadata = async () => {
            const metadata = await getSmartMetadata('AssetType');
            setConfig(prev => ({
                ...prev,
                softwareCategories: metadata['Software'] || prev.softwareCategories,
                hardwareCategories: metadata['Hardware'] || prev.hardwareCategories
            }));
        };

        loadMetadata();
    }, [context]);

    const handleUpdateConfig = async (newConfig: Config) => {
        // Check for category changes and persist to SP
        if (JSON.stringify(newConfig.softwareCategories) !== JSON.stringify(config.softwareCategories)) {
            try {
                await updateSmartMetadata('AssetType', 'Software', newConfig.softwareCategories);
            } catch (e) {
                console.error("Failed to update Software categories", e);
                alert("Failed to save Software categories to SharePoint.");
            }
        }
        if (JSON.stringify(newConfig.hardwareCategories) !== JSON.stringify(config.hardwareCategories)) {
            try {
                await updateSmartMetadata('AssetType', 'Hardware', newConfig.hardwareCategories);
            } catch (e) {
                console.error("Failed to update Hardware categories", e);
                alert("Failed to save Hardware categories to SharePoint.");
            }
        }

        setConfig(newConfig);
    };

    const [config, setConfig] = useState<Config>({
        softwareCategories: [],
        hardwareCategories: [],
        sites: [],
        departments: departments.map(d => d.name),
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
                        label: 'Financials & Dates',
                        sections: [
                            { id: 'sec-li-fin', title: 'Costing', columns: 1, fields: ['currencyTool'] },
                            { id: 'sec-li-dates', title: 'Dates', columns: 2, fields: ['purchaseDate', 'expiryDate'] }
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
                            { id: 'sec-hi-dates', title: 'Dates', columns: 2, fields: ['purchaseDate', 'expiryDate'] }
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
                            { id: 'sec-u-con', title: 'Contacts', columns: 2, fields: ['businessPhone', 'mobileNo', 'email', 'nonPersonalEmail', 'homePhone', 'skype', 'address', 'city', 'postalCode'] },
                            { id: 'sec-u-com', title: 'Comments', columns: 1, fields: ['notes'] }
                        ]
                    },
                    {
                        id: 'image',
                        label: 'Image Information',
                        sections: [
                            { id: 'sec-u-img', title: 'Avatar', columns: 1, fields: ['avatarUpload'] }]
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
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [activeView, setActiveView] = useState<View>('dashboard');
    const [assetViewMode, setAssetViewMode] = useState<'families' | 'items'>('items');

    // Helper to close asset modal
    const closeAssetModal = useCallback(() => {
        setIsAssetModalOpen(false);
        setEditingAsset(null);
        setEditingFamily(null);
    }, []);

    // Helper to open asset modal for editing
    const handleEditAsset = useCallback((asset: Asset) => {
        setEditingAsset(asset);
        setModalMode('instance');
        setIsAssetModalOpen(true);
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [fetchedUsers, fetchedFamilies, fetchedAssets, fetchedRequests, fetchedVendors, fetchedSites, fetchedDepartments] = await Promise.all([
                    getUsers(),
                    getAssetFamilies(),
                    getAssets(),
                    getRequests(),
                    getVendors(),
                    getSites(),
                    getDepartments()
                ]);

                setUsers(fetchedUsers);
                setAssetFamilies(fetchedFamilies);
                setAssets(fetchedAssets);
                setRequests(fetchedRequests);
                setVendors(fetchedVendors);
                setSites(fetchedSites);
                setDepartments(fetchedDepartments);
                setConfig(prev => ({ ...prev, departments: fetchedDepartments.map(d => d.name), sites: fetchedSites.map(s => s.name) }));

                // Set default user (Admin) - Logic: find current user or first in list
                if (fetchedUsers.length > 0) {
                    // In a real app we'd check context.pageContext.user.email
                    // For now just pick the first one or try to match current context user
                    // For demo/dev: Force default to an Admin user
                    const adminUser = fetchedUsers.find(u => u.role?.toLowerCase() === 'admin');
                    setCurrentUser(adminUser || fetchedUsers[0]);
                }
            } catch (error) {
                console.error("Error loading SharePoint data:", error);
                // Fallback to mock data or show error? For now keeping mock data completely removed as requested
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [context]);

    // Update view mode when switching users to avoid restricted views
    // Update view mode when switching users to avoid restricted views
    useEffect(() => {
        // Check real role, but also respect the 'isAdmin' override logic
        if (currentUser && currentUser.role !== 'admin') {
            if (['users', 'admin', 'reports'].includes(activeView)) {
                setActiveView('dashboard');
            }

            setAssetViewMode('items');
        }
    }, [currentUser, activeView]);

    const isAdmin = currentUser?.role === 'admin';
    const adminUsers = useMemo(() => users.filter(u => u.role && u.role.toLowerCase() === 'admin'), [users]);

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
        // Restricted search actions for non-admins
        if (type === 'user') {
            if (isAdmin || item.id === currentUser?.id) {
                handleUserClick(item);
            }
        } else if (type === 'asset') {
            if (isAdmin) {
                handleEditAsset(item);
            } else {
                // Check if user owns it
                const isOwner = (item.assignedUser?.id === currentUser?.id) || (item.assignedUsers?.some((u: User) => u.id === currentUser?.id));
                if (isOwner) alert(`Your Asset: ${item.title}`);
            }
        } else if (type === 'family') {
            if (isAdmin) {
                handleFamilyClick(item);
            }
        }
    };

    const handleSaveFamily = async (family: AssetFamily) => {
        try {
            if (editingFamily) {
                const updatedFamily = await updateAssetFamily(family);
                setAssetFamilies(assetFamilies.map(f => f.id === family.id ? updatedFamily : f));
            } else {
                // Persist new family to SharePoint
                const savedFamily = await addAssetFamily(family);
                setAssetFamilies([...assetFamilies, savedFamily]);
            }
            closeAssetModal();
        } catch (error) {
            console.error("Error saving asset family:", error);
            // Optionally add UI notification logic here
        }
    };

    const handleBulkCreate = async (family: AssetFamily, variantName: string, quantity: number, commonData: Partial<Asset>) => {
        setIsLoading(true);
        try {
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
                } as Asset;
                newAssets.push(newAsset);
            }

            await bulkAddAssets(newAssets, family.id);

            // Log creation for each asset


            // Refresh logic to ensure we get the real IDs from SP
            const [fetchedAssets, fetchedFamilies] = await Promise.all([
                getAssets(),
                getAssetFamilies()
            ]);
            setAssets(fetchedAssets);
            setAssetFamilies(fetchedFamilies);
            alert(`Successfully created ${quantity} assets.`);

        } catch (error) {
            console.error("Bulk create failed", error);
            alert("Bulk create failed. Check console.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleImportData = async (type: ImportType, data: any[]) => {
        // Placeholder for data import logic
        console.log(`Importing ${data.length} records of type ${type}`);
        if (type === 'users') {
            alert(`Simulating import of ${data.length} users. Feature pending backend integration.`);
        } else if (type === 'hardware' || type === 'licenses') {
            alert(`Simulating import of ${data.length} assets. Feature pending backend integration.`);
        }
    };

    const handleSaveAsset = async (asset: Asset) => {
        setIsLoading(true);
        try {
            let finalAsset = { ...asset };
            const today = new Date().toISOString().split('T')[0];
            let newHistoryEntries: AssignmentHistory[] = [];

            if (editingAsset) {
                // --- Ownership Changes ---
                const oldUser = editingAsset.assignedUser;
                const newUser = asset.assignedUser;
                const oldUsers = editingAsset.assignedUsers || [];
                const newUsers = asset.assignedUsers || [];

                // Single User Check (Hardware typical)
                if (oldUser?.id !== newUser?.id) {
                    const changes = [];
                    if (newUser) changes.push(`Added: ${newUser.fullName}`);
                    if (oldUser) changes.push(`Removed: ${oldUser.fullName}`);

                    newHistoryEntries.push({
                        id: `hist-${Date.now()}-1`,
                        assetId: asset.assetId,
                        assetName: asset.title,
                        date: today,
                        type: 'Reassigned',
                        notes: `License assignment updated. ${changes.join('; ')}`,
                        assignedTo: newUser?.fullName || 'Unassigned',
                        assignedFrom: oldUser?.fullName
                    });
                }

                // Multiple Users Check (Software typical)
                const oldIds = oldUsers.map(u => u.id).sort().join(',');
                const newIds = newUsers.map(u => u.id).sort().join(',');
                if (oldIds !== newIds && (oldUsers.length > 0 || newUsers.length > 0)) {
                    const added = newUsers.filter(u => !oldUsers.some(old => old.id === u.id));
                    const removed = oldUsers.filter(u => !newUsers.some(newU => newU.id === u.id));

                    const changes = [];
                    if (added.length) changes.push(`Added: ${added.map(u => u.fullName).join(', ')}`);
                    if (removed.length) changes.push(`Removed: ${removed.map(u => u.fullName).join(', ')}`);

                    newHistoryEntries.push({
                        id: `hist-assign-${Date.now()}`,
                        assetId: asset.assetId,
                        assetName: asset.title,
                        date: today,
                        type: 'Reassigned',
                        notes: `Assignment updated. ${changes.join('; ')}`
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

                // Persist History Entries to Contacts List
                if (newHistoryEntries.length > 0) {
                    const usersToUpdate = new Map<string, User>();

                    newHistoryEntries.forEach(entry => {
                        const targetUsers: User[] = [];
                        if (entry.type === 'Usage Update') {
                            targetUsers.push(...(asset.activeUsers || []));
                        } else {
                            if (asset.assignedUser) targetUsers.push(asset.assignedUser);
                            if (asset.assignedUsers) targetUsers.push(...asset.assignedUsers);
                            if (oldUser && !targetUsers.find(u => u.id === oldUser.id)) targetUsers.push(oldUser);
                        }

                        targetUsers.forEach(u => {
                            const currentUserState = usersToUpdate.get(String(u.id)) || users.find(user => user.id === u.id);
                            if (currentUserState) {
                                const updatedUser = {
                                    ...currentUserState,
                                    history: [entry, ...(currentUserState.history || [])]
                                };
                                usersToUpdate.set(String(u.id), updatedUser);
                            }
                        });
                    });

                    for (const userEntry of Array.from(usersToUpdate.values())) {
                        await updateUser(userEntry);
                    }
                    setUsers(prev => prev.map(u => usersToUpdate.get(String(u.id)) || u));
                }

                const updatedAsset = await updateAsset(finalAsset);

                setAssets(prev => prev.map(a => a.id === asset.id ? { ...updatedAsset, assignmentHistory: [...(editingAsset.assignmentHistory || []), ...newHistoryEntries] } : a));

            } else {
                // New Asset Creation
                const family = assetFamilies.find(f => f.id === asset.familyId); // Fallback to ID check
                const familyPrefix = family?.assetType === AssetType.LICENSE ? 'SOFT' : 'HARD';
                const productCode = (family as any)?.productCode || 'GEN';
                const sequenceNumber = String(assets.filter(a => a.familyId === asset.familyId).length + 1).padStart(4, '0');
                const assetId = `${familyPrefix}-${productCode}-${sequenceNumber}`;

                const transientAsset = { ...asset, id: `inst-${new Date().toISOString()}`, assetId: asset.assetId || assetId };

                const savedAsset = await addAsset(transientAsset);

                // If assigned on creation
                if (savedAsset.assignedUser || (savedAsset.assignedUsers && savedAsset.assignedUsers.length > 0)) {
                    newHistoryEntries.push({
                        id: `hist-${Date.now()}`,
                        assetId: savedAsset.assetId,
                        assetName: savedAsset.title,
                        date: new Date().toISOString().split('T')[0],
                        type: 'Assigned',
                        assignedTo: savedAsset.assignedUser?.fullName || 'Multiple Users',
                        notes: 'Initial Assignment'
                    });
                }

                if (savedAsset.activeUsers && savedAsset.activeUsers.length > 0) {
                    newHistoryEntries.push({
                        id: `hist-usage-${Date.now()}`,
                        assetId: savedAsset.assetId,
                        assetName: savedAsset.title,
                        date: new Date().toISOString().split('T')[0],
                        type: 'Usage Update',
                        notes: `Initial active users: ${savedAsset.activeUsers.map((u: User) => u.fullName).join(', ')}`
                    });
                }

                if (newHistoryEntries.length > 0) {
                    const usersToUpdate = new Map<string, User>();
                    newHistoryEntries.forEach(entry => {
                        const targetUsers: User[] = [];
                        if (entry.type === 'Usage Update') targetUsers.push(...(savedAsset.activeUsers || []));
                        else {
                            if (savedAsset.assignedUser) targetUsers.push(savedAsset.assignedUser);
                            if (savedAsset.assignedUsers) targetUsers.push(...savedAsset.assignedUsers);
                        }
                        targetUsers.forEach(u => {
                            const currentUserState = usersToUpdate.get(String(u.id)) || users.find(user => user.id === u.id);
                            if (currentUserState) {
                                const updatedUser = { ...currentUserState, history: [entry, ...(currentUserState.history || [])] };
                                usersToUpdate.set(String(u.id), updatedUser);
                            }
                        });
                    });
                    for (const userEntry of Array.from(usersToUpdate.values())) {
                        await updateUser(userEntry);
                    }
                    setUsers(prev => prev.map(u => usersToUpdate.get(String(u.id)) || u));
                }

                setAssets(prev => [...prev, { ...savedAsset, assignmentHistory: newHistoryEntries }]);
            }
            closeAssetModal();
        } catch (error) {
            console.error("Error saving asset:", error);
            alert("Failed to save asset. Check console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    /*
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
            dateOfExit: undefined,
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
                assignedUser: assignedUser || undefined,
                licenseKey: row.licenseKey,
                expiryDate: row.expiryDate,
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
*/



    const closeRequestModal = () => {
        setIsRequestModalOpen(false);
        setRequestingUser(null);
        setRequestCategory(null);
    };



    const handleEditFamily = (family: AssetFamily) => {
        setEditingFamily(family);
        setModalMode('family');
        setIsAssetModalOpen(true);
    }

    // const handleAddFamily = () => {
    //     setEditingFamily(null);
    //     setModalMode('family');
    //     setIsAssetModalOpen(true);
    // }

    const handleAddInstance = (family: AssetFamily) => {
        setEditingAsset(null);
        setEditingFamily(family); // Pass family context
        setModalMode('instance');
        setIsAssetModalOpen(true);
    }

    const handleAddUser = () => {
        const newUser: User = {
            id: '0',
            fullName: '',
            firstName: '',
            lastName: '',
            email: '',
            avatarUrl: '',
            role: 'user',
            isVerified: false,
            jobTitle: '',
            department: '',
            organization: 'Smalsus Infolabs Pvt Ltd',
            dateOfJoining: new Date().toISOString().split('T')[0],
            dateOfExit: undefined,
            businessPhone: '',
            mobileNo: '',
            address: '',
            city: '',
            postalCode: '',
            linkedin: '',
            twitter: '',
            userType: 'Internal User',
            extension: '',
            permissionGroups: [],
            principalName: '',
            userStatus: 'Active',
            userTypeDetail: 'Member',
            createdDate: '',
            modifiedDate: '',
            createdBy: '',
            modifiedBy: '',
            site: [],
            typeOfContact: ['Employee'],
            history: []
        };
        setEditingUser(newUser);
        setIsProfileModalOpen(true);
    };

    const handleSaveUser = async (user: User) => {
        try {
            let savedUser = user;
            if (user.id === '0' || !user.id || user.id === 0) {
                savedUser = await addUser(user);
                setUsers(prev => [...prev, savedUser]);
            } else {
                await updateUser(user);
                setUsers(users.map(u => u.id === user.id ? user : u));
            }

            // Update assets if assigned user details changed
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
            setEditingUser(null);
        } catch (error) {
            console.error("Error saving user:", error);
            alert("Failed to save user. Please check console for details.");
        }
    };

    const handleDeleteUser = async (user: User) => {
        try {
            if (!user.id || user.id === '0') return;
            await deleteUser(String(user.id));
            setUsers(prev => prev.filter(u => u.id !== user.id));
            setIsProfileModalOpen(false);
            setEditingUser(null);
            setSelectedUser(null);
            alert("User deleted successfully.");
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user.");
        }
    };

    const handleSubmitRequest = async (familyId: string, notes: string) => {
        const family = assetFamilies.find(f => f.id === familyId);
        const user = requestingUser;

        if (!family || !user) {
            console.error("Could not create request: Missing family or user");
            closeRequestModal();
            return;
        }

        try {
            const newRequest = await addRequest(family, user, notes);
            setRequests(prev => [newRequest, ...prev]);
            alert("Request submitted successfully!");
            closeRequestModal();
        } catch (error) {
            console.error("Error submitting request:", error);
            alert("Failed to submit request.");
        }
    };

    const handleNewRequest = (category: RequestCategory, forUser?: User | null) => {
        setRequestingUser(forUser || currentUser); // Use provided user or fallback to current
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

    const handleRequestAction = async (requestId: string, newStatus: RequestStatus) => {
        const req = requests.find(r => r.id === requestId);
        if (!req) return;

        if (newStatus === RequestStatus.APPROVED) {
            // Defer SharePoint update until confirmed in the popup (Task Creation)
            handleCreateTask(req);
        } else if (newStatus === RequestStatus.FULFILLED) {
            handleFulfillRequest(req);
        } else {
            try {
                await updateRequest(requestId, newStatus);
                // Update local state
                setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
            } catch (error) {
                console.error("Error updating request status:", error);
                alert("Failed to update request status.");
            }
        }
    };

    const handleFulfillRequest = async (request: Request) => {
        // 1. Create Asset
        // 2. Update Request Status to Fulfilled

        try {
            // Construct base asset from request
            const assetFamily = assetFamilies.find(f => f.id === request.familyId);
            const familyName = assetFamily ? assetFamily.name : request.item;

            const newAsset: Asset = {
                id: 'temp', // Will be overwritten by SP ID
                familyId: request.familyId || '',
                assetId: `${familyName}-${request.requestedBy.fullName.split(' ')[0]}-${Date.now().toString().slice(-4)}`.toUpperCase().replace(/\s/g, ''),
                title: `${familyName} for ${request.requestedBy.fullName}`,
                status: AssetStatus.ACTIVE,
                purchaseDate: new Date().toISOString(),
                cost: 0,
                activeUsers: [request.requestedBy],
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                createdBy: "System",
                modifiedBy: "System",
                assetType: request.type === 'Hardware' ? AssetType.HARDWARE : AssetType.LICENSE,

                // Defaults
                serialNumber: "",
                modelNumber: "",
                macAddress: "",
                location: "Office",
                condition: HardwareCondition.GOOD,
                warrantyExpiryDate: "",
                licenseKey: "",
                variantType: "Standard",
                expiryDate: "",

                assignedUser: request.requestedBy,
                assignedUsers: [request.requestedBy],
                email: request.requestedBy.email,
                assignmentHistory: []
            };

            const createdAsset = await addAsset(newAsset);

            // Log initial assignment


            // Update Assets State
            setAssets(prev => [{ ...createdAsset, assignmentHistory: [{ id: 'new', assetId: createdAsset.assetId, assetName: createdAsset.title, date: new Date().toISOString().split('T')[0], type: 'Assigned', assignedTo: createdAsset.assignedUser?.fullName, notes: 'Assigned via fulfillment of request' }] }, ...prev]);

            // Update Request Status
            await updateRequest(request.id, RequestStatus.FULFILLED);
            setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: RequestStatus.FULFILLED } : r));

            alert("Request fulfilled and asset created successfully!");

        } catch (error) {
            console.error("Error fulfilling request:", error);
            alert("Failed to fulfill request. Check console for details.");
        }
    };

    const handleTaskSubmit = async (newTask: Task) => {
        const requestId = newTask.requestId!;
        const req = requests.find(r => r.id === requestId);
        if (!req) return;

        const spRequestId = parseInt(requestId.replace('req-', ''));

        // Check for Int32 overflow or invalid ID
        if (isNaN(spRequestId) || spRequestId > 2147483647) {
            alert("This request does not have a valid SharePoint ID. It may have been created locally or before the last fix. Please create a new request.");
            return;
        }

        const web = Web("https://smalsusinfolabs.sharepoint.com/sites/HHHHQA/AI").using(SPFx(context));

        try {
            // 1. Update Request to Approved in SharePoint (actual approval happens now)
            await web.lists.getByTitle("Request").items.getById(spRequestId).update({
                Status: RequestStatus.APPROVED
            });

            // 2. Try to auto-assign an asset instance
            const availableAsset = assets.find(a =>
                a.familyId === req.familyId &&
                a.status === AssetStatus.AVAILABLE
            );

            if (availableAsset) {
                const spAssetId = parseInt(availableAsset.id);

                // Update Asset in SharePoint
                await web.lists.getByTitle("AssetManagementSystem").items.getById(spAssetId).update({
                    assignToUserId: [parseInt(req.requestedBy.id.toString())],
                    Status: AssetStatus.ACTIVE
                });

                // Update Request to Fulfilled in SharePoint
                await web.lists.getByTitle("Request").items.getById(spRequestId).update({
                    Status: RequestStatus.FULFILLED
                });

                // Update local state
                const updatedUser = users.find(u => u.id.toString() === req.requestedBy.id.toString()) || req.requestedBy;
                const updatedAsset: Asset = {
                    ...availableAsset,
                    status: AssetStatus.ACTIVE,
                    assignedUser: updatedUser,
                    assignedUsers: [updatedUser],
                    activeUsers: [updatedUser],
                    modified: new Date().toISOString()
                };

                setAssets(prev => prev.map(a => a.id === availableAsset.id ? updatedAsset : a));
                setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: RequestStatus.FULFILLED, linkedTaskId: newTask.id } : r));

                alert(`Asset ${availableAsset.assetId} has been automatically assigned to ${req.requestedBy.fullName}.`);
            } else {
                // NO ASSET AVAILABLE: Create a new one and increment totalCount
                const familyIdNum = parseInt(req.familyId?.replace('repo-', '') || '0');
                const assetType = req.type === 'Hardware' ? AssetType.HARDWARE : AssetType.LICENSE;
                const parentFamily = assetFamilies.find(f => f.id === req.familyId);

                // Extract metadata from family
                const baseCost = parentFamily?.assetType === AssetType.LICENSE
                    ? (parentFamily as SoftwareProfile).variants?.[0]?.cost || 0
                    : 0;
                const licenseType = parentFamily?.assetType === AssetType.LICENSE
                    ? (parentFamily as SoftwareProfile).variants?.[0]?.licenseType || "Standard"
                    : undefined;

                // A. Create new item in AssetManagementSystem with enhanced metadata
                const newAssetResult = await web.lists.getByTitle("AssetManagementSystem").items.add({
                    Title: req.item,
                    Status: AssetStatus.ACTIVE,
                    AssetType: req.type, // SharePoint expects string
                    LicenseType: licenseType,
                    Cost: baseCost,
                    assetRepoId: familyIdNum,
                    assignToUserId: [parseInt(req.requestedBy.id.toString())],
                    purchaseDate: new Date().toISOString().split('T')[0],
                    expiryDate: parentFamily?.lastModifiedDate // Using family dates as default for new assets
                });

                let newAssetId = newAssetResult?.data?.Id;

                if (!newAssetId) {
                    // Fallback: Query for the latest item created in this family
                    // We assume the one we just added is the latest one for this family
                    try {
                        const items = await web.lists.getByTitle("AssetManagementSystem").items
                            .filter(`assetRepoId eq ${familyIdNum}`)
                            .orderBy("Id", false)
                            .top(1)
                            .select("Id")();

                        if (items && items.length > 0) {
                            newAssetId = items[0].Id;
                        } else {
                            throw new Error("Could not retrieve created asset ID: No items found.");
                        }
                    } catch (e) {
                        console.error("Fallback ID fetch failed:", e);
                        throw new Error(`Asset creation seems to have failed or ID could not be retrieved. ${e}`);
                    }
                }

                // B. Increment TotalCount in AssetRepository
                const familyItem = await web.lists.getByTitle("AssetRepository").items.getById(familyIdNum).select("TotalCount")();
                const currentTotal = familyItem.TotalCount || 0;
                await web.lists.getByTitle("AssetRepository").items.getById(familyIdNum).update({
                    TotalCount: currentTotal + 1
                });

                // C. Update Request to Fulfilled
                await web.lists.getByTitle("Request").items.getById(spRequestId).update({
                    Status: RequestStatus.FULFILLED
                });

                // D. Update Local States
                const updatedUser = users.find(u => u.id.toString() === req.requestedBy.id.toString()) || req.requestedBy;

                const localNewAsset: Asset = {
                    id: newAssetId.toString(),
                    assetId: newAssetId.toString(),
                    familyId: req.familyId || '',
                    title: req.item,
                    assetType: assetType,
                    status: AssetStatus.ACTIVE,
                    assignedUser: updatedUser,
                    assignedUsers: [updatedUser],
                    activeUsers: [updatedUser],
                    purchaseDate: new Date().toISOString().split('T')[0],
                    expiryDate: parentFamily?.lastModifiedDate,
                    variantType: licenseType,
                    cost: baseCost,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString(),
                    createdBy: 'System',
                    modifiedBy: 'System'
                };

                setAssets(prev => [localNewAsset, ...prev]);
                setAssetFamilies(prev => prev.map(f => f.id === req.familyId ? { ...f, totalCount: (f.totalCount || 0) + 1 } : f));
                setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: RequestStatus.FULFILLED, linkedTaskId: newTask.id } : r));

                alert(`New ${req.type} asset has been created and assigned to ${req.requestedBy.fullName} as no existing inventory was available.`);
            }

            setTasks(prev => [newTask, ...prev]);
            setIsTaskModalOpen(false);
            setRequestForTask(null);

        } catch (error) {
            console.error("Error confirming approval:", error);
            alert("Failed to process approval and asset creation. Please verify SharePoint list schemas.");
        }
    };

    // --- Filtering Logic ---

    const visibleAssets = useMemo(() => {
        if (isAdmin) return assets;
        return assets.filter(a =>
            (a.assignedUser?.id === currentUser?.id) ||
            (a.assignedUsers?.some(u => u.id === currentUser?.id)) ||
            (a.activeUsers?.some(u => u.id === currentUser?.id))
        );
    }, [assets, currentUser, isAdmin]);

    const visibleRequests = useMemo(() => {
        if (isAdmin) return requests;
        return requests.filter(r => r.requestedBy.id === currentUser?.id);
    }, [requests, currentUser, isAdmin]);

    const userColumns: ColumnDef<User>[] = [
        { accessorKey: 'fullName', header: 'Name', width: 250, cell: ({ row }) => (<button onClick={() => handleUserClick(row.original)} className="d-flex align-items-center gap-3 text-start w-100 border-0 bg-transparent p-0"> <img src={row.original.avatarUrl} alt={row.original.fullName} className="rounded-circle" style={{ width: '2rem', height: '2rem' }} /> <span className="fw-medium text-dark text-truncate">{row.original.fullName}</span> </button>) },
        { accessorKey: 'email', header: 'Email', width: 250 },
        {
            accessorKey: 'role',
            header: 'Role',
            width: 100,
            cell: ({ row }) => {
                const isAdmin = row.original.role === 'admin';
                return (
                    <span
                        className="badge rounded-pill"
                        style={{
                            backgroundColor: isAdmin ? '#CFE2FF' : '#E2E3E5',
                            color: isAdmin ? '#084298' : '#41464B',
                            fontWeight: 500
                        }}
                    >
                        {row.original.role}
                    </span>
                );
            }
        },
        { accessorKey: 'jobTitle', header: 'Job Title', width: 200 },
        { accessorKey: 'department', header: 'Department', width: 200 },
        {
            accessorKey: 'assets', header: 'Assigned Assets', width: 120, cell: ({ row }) => {
                const count = assets.filter(a => a.assignedUser?.id === row.original.id || a.assignedUsers?.some(u => u.id === row.original.id)).length;
                return (
                    <span
                        className="badge rounded-pill"
                        style={{
                            backgroundColor: '#CFF4FC',
                            color: '#055160',
                            fontWeight: 500
                        }}
                    >
                        {count}
                    </span>
                );
            }
        },
        { accessorKey: 'view', header: '', width: 100, cell: ({ row }) => (<button onClick={() => handleUserClick(row.original)} className="d-flex align-items-center gap-2 btn btn-link text-decoration-none p-0 small fw-medium"> View Profile <ArrowRight size={14} /> </button>) }
    ];

    const requestColumns: ColumnDef<Request>[] = [
        { accessorKey: 'item', header: 'Item', width: 300, cell: ({ row }) => (<div> <p className="mb-0 fw-medium text-dark">{row.original.item}</p> <p className="small text-secondary mb-0">{row.original.type}</p> </div>) },
        { accessorKey: 'requestedBy.fullName', header: 'Requested By', width: 200, cell: ({ row }) => (<button disabled={!isAdmin} onClick={() => handleUserClick(row.original.requestedBy)} className={`d-flex align-items-center gap-2 text-start w-100 border-0 bg-transparent p-0 ${!isAdmin ? 'cursor-default' : ''}`}> <img src={row.original.requestedBy.avatarUrl} alt={row.original.requestedBy.fullName} className="rounded-circle" style={{ width: '1.5rem', height: '1.5rem' }} /> <span className={`small fw-medium text-truncate ${isAdmin ? 'text-primary' : 'text-dark'}`}>{row.original.requestedBy.fullName}</span> </button>) },
        { accessorKey: 'requestDate', header: 'Request Date', width: 150 },
        {
            accessorKey: 'status', header: 'Status', width: 180, cell: ({ row }) => {
                const status = row.original.status;

                const statusStyles: Record<string, { bg: string, color: string }> = {
                    [RequestStatus.PENDING]: { bg: '#FFF4CE', color: '#664d03' }, // Warning/Yellow
                    [RequestStatus.APPROVED]: { bg: '#D1E7DD', color: '#0f5132' }, // Success/Green
                    [RequestStatus.REJECTED]: { bg: '#F8D7DA', color: '#842029' }, // Danger/Red
                    [RequestStatus.FULFILLED]: { bg: '#CFF4FC', color: '#055160' }, // Info/Cyan
                    [RequestStatus.IN_PROGRESS]: { bg: '#CFE2FF', color: '#084298' } // Primary/Blue
                };

                const style = statusStyles[status] || { bg: '#e9ecef', color: '#495057' };

                // Find linked task if in progress
                const linkedTask = row.original.linkedTaskId ? tasks.find(t => t.id === row.original.linkedTaskId) : null;

                return (
                    <div className="d-flex flex-column align-items-start gap-1">
                        <span
                            className="badge rounded-pill"
                            style={{
                                backgroundColor: style.bg,
                                color: style.color,
                                fontWeight: 500
                            }}
                        >
                            {status}
                        </span>
                        {status === RequestStatus.IN_PROGRESS && linkedTask && (
                            <div className="d-flex align-items-center gap-1 bg-light border border-light px-2 py-0 rounded small text-secondary mt-1" style={{ fontSize: '0.65rem' }}>
                                <ListTodo size={12} className="text-primary" />
                                <span className="fw-medium">Task: {linkedTask.assignedTo?.fullName || 'Unassigned'}</span>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: 'actions', header: 'Actions', width: 140, cell: ({ row }) => (isAdmin) ? (<div className="d-flex align-items-center gap-2">
                {row.original.status === RequestStatus.PENDING && (
                    <>
                        <button onClick={() => handleRequestAction(row.original.id, RequestStatus.APPROVED)} className="btn btn-sm btn-success rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '2rem', height: '2rem' }} title="Approve & Create Task"><Check size={16} /></button>
                        <button onClick={() => handleRequestAction(row.original.id, RequestStatus.REJECTED)} className="btn btn-sm btn-danger rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '2rem', height: '2rem' }} title="Reject"><X size={16} /></button>
                    </>
                )}
                {row.original.status === RequestStatus.IN_PROGRESS && (
                    <button onClick={() => handleRequestAction(row.original.id, RequestStatus.FULFILLED)} className="btn btn-sm btn-info text-white rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '2rem', height: '2rem' }} title="Mark as Fulfilled"><CheckCircle size={16} /></button>
                )}
            </div>) : null,
        },
    ];

    // Columns for Individual Item View
    const assetInstanceColumns: ColumnDef<Asset>[] = [
        { accessorKey: 'assetId', header: 'Asset ID', width: 140, cell: ({ row }) => <span className="font-monospace small text-secondary">{row.original.assetId}</span> },
        { accessorKey: 'title', header: 'Title', width: 200, cell: ({ row }) => <span className="fw-medium text-dark">{row.original.title}</span> },
        {
            accessorKey: 'familyId', header: 'Product/Family', width: 180, cell: ({ row }) => {
                const fam = assetFamilies.find(f => f.id === row.original.familyId);
                return <span className="small text-secondary">{fam?.name || '-'}</span>
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
                            <button
                                key={u.id}
                                disabled={!isAdmin}
                                onClick={(e) => { e.stopPropagation(); handleUserClick(u); }}
                                className="border-0 bg-transparent p-0 small text-start text-truncate"
                                style={{
                                    color: isAdmin ? '#0078D4' : '#323130',
                                    textDecoration: isAdmin ? 'none' : 'none',
                                    cursor: isAdmin ? 'pointer' : 'default'
                                }}
                                onMouseEnter={(e) => isAdmin && (e.currentTarget.style.textDecoration = 'underline')}
                                onMouseLeave={(e) => isAdmin && (e.currentTarget.style.textDecoration = 'none')}
                            >
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
                        <span
                            className="badge rounded-pill"
                            style={{
                                backgroundColor: count > 0 ? '#CFE2FF' : '#E2E3E5',
                                color: count > 0 ? '#084298' : '#41464B',
                                fontWeight: 500
                            }}
                        >
                            {count}
                        </span>
                    </div>
                );
            }
        },
        {
            accessorKey: 'status', header: 'Status', width: 120, cell: ({ row }) => {
                const status = row.original.status;
                const getColor = (s: string) => {
                    switch (s) {
                        case AssetStatus.ACTIVE: return '#198754';
                        case AssetStatus.AVAILABLE: return '#0dcaf0';
                        case AssetStatus.STORAGE: return '#6c757d';
                        case AssetStatus.EXPIRED:
                        case AssetStatus.RETIRED: return '#dc3545';
                        case AssetStatus.IN_REPAIR:
                        case AssetStatus.PENDING: return '#fd7e14';
                        case AssetStatus.SUSPENDED: return '#ffc107';
                        default: return '#6c757d';
                    }
                };

                return (
                    <span style={{ color: getColor(status), fontWeight: 600 }}>
                        {status}
                    </span>
                );
            }
        },
        { accessorKey: 'purchaseDate', header: 'Purchase Date', width: 120, cell: ({ row }) => <span className="small text-secondary">{row.original.purchaseDate}</span> },
        { accessorKey: 'cost', header: 'Cost', width: 100, cell: ({ row }) => <span className="small text-secondary">{isAdmin ? (row.original.cost ? `$${row.original.cost}` : '-') : '***'}</span> },
        {
            accessorKey: 'actions', header: '', width: 60, cell: ({ row }) => isAdmin && (
                <div className="text-center">
                    <button onClick={() => handleEditAsset(row.original)} className="btn btn-sm btn-light rounded-circle p-1 text-secondary hover-text-primary"><Edit size={16} /></button>
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
                if (asset.expiryDate && asset.status !== 'Retired') {
                    try {
                        const expiry = new Date(asset.expiryDate);
                        // Check if expiry is effectively before or within the next 30 days
                        return expiry <= thirtyDaysFromNow;
                    } catch (e) { return false; }
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

    //    // const topUsers = useMemo(() => {
    //    const userAssetCounts = assets.reduce((acc: Record<string, { user: User, count: number }>, asset) => {
    //        const usersToCount = asset.assignedUsers || (asset.assignedUser ? [asset.assignedUser] : []);
    //        usersToCount.forEach(user => {
    //            if (user) {
    //                const id = user.id;
    //                acc[id] = (acc[id] || { user: user, count: 0 });
    //                acc[id].count++;
    //            }
    //        });
    //        return acc;
    //    }, {} as Record<string, { user: User, count: number }>);
    //    return Object.values(userAssetCounts).sort((a: { count: number }, b: { count: number }) => b.count - a.count).slice(0, 5);
    //}, [assets]);

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
        { accessorKey: 'actions', header: '', width: 60, cell: ({ row }) => isAdmin && <div className="text-center"><button onClick={() => handleEditFamily(row.original)} className="btn btn-sm btn-light rounded-circle p-1 text-secondary hover-text-primary"><Edit size={16} /></button></div> },
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
        return (<button onClick={() => { setEditingFamily(null); setModalMode('family'); setIsAssetModalOpen(true); }} className="btn btn-primary shadow-sm d-flex align-items-center gap-2"> <Icon size={16} /> {text} </button>);
    }, [activeView, isAdmin]);

    const NavItem = ({ view, label, icon: Icon }: { view: View, label: string, icon: React.ElementType }) => (
        <button
            onClick={() => handleNavigation(view)}
            className={`d-flex align-items-center gap-2 px-4 py-2 small fw-medium text-decoration-none bg-transparent border-0 border-bottom border-2 ${activeView === view ? 'border-primary text-primary' : 'border-transparent text-secondary hover-bg-light text-body-emphasis'}`}
            style={{ transition: 'all 0.2s' }}
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
                (asset.assignedUsers?.some(u => u.id === selectedUser.id)) ||
                (asset.activeUsers?.some(u => u.id === selectedUser.id))
            );
            return (
                <div className="container-fluid p-0">
                    <button onClick={handleBackToList} className="btn btn-light border mb-4 shadow-sm fw-medium d-flex align-items-center gap-2"> &larr; Back to List </button>
                    <UserProfile user={selectedUser} userAssets={userAssets} assetFamilies={assetFamilies} onEditProfile={() => setIsProfileModalOpen(true)} onNewRequest={(c) => handleNewRequest(c, selectedUser)} onQuickRequest={handleQuickRequest} />
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
                <div className="container-fluid p-0 space-y-4">
                    {isAdmin ? (
                        <>
                            {/* Admin Header Stats */}
                            <div className="row g-4 mb-4">
                                <div className="col-12 col-md-6 col-lg-3"><StatCard icon={Users} title="Total Team" value={dashboardStats.totalUsers!} color="#4f46e5" subtext="Active Members" onClick={() => handleNavigation('users')} /></div>
                                <div className="col-12 col-md-6 col-lg-3"><StatCard icon={Package} title="Assets Managed" value={dashboardStats.total!} color="#10b981" subtext="Hardware & Licenses" onClick={() => handleNavigation('licenses')} /></div>
                                <div className="col-12 col-md-6 col-lg-3"><StatCard icon={ShieldAlert} title="Pending Actions" value={dashboardStats.pendingRequests!} color="#f59e0b" subtext="Requests needing approval" onClick={() => handleNavigation('requests')} /></div>
                                <div className="col-12 col-md-6 col-lg-3"><StatCard icon={Clock} title="Attention Needed" value={dashboardStats.expiringSoon!} color="#ef4444" subtext="Expiring in 30 days" onClick={() => handleNavigation('licenses')} /></div>
                            </div>

                            {/* Quick Action Toolbar */}
                            <div className="d-flex gap-3 overflow-x-auto pb-2 mb-4">
                                <button className="btn btn-light border bg-white shadow-sm d-flex align-items-center gap-2 text-secondary fw-medium text-nowrap" onClick={handleAddUser}>
                                    <UserPlus size={16} className="text-primary" /> Add Team Member
                                </button>
                                <button className="btn btn-light border bg-white shadow-sm d-flex align-items-center gap-2 text-secondary fw-medium text-nowrap" onClick={() => { setEditingFamily(null); setModalMode('family'); setIsAssetModalOpen(true); }}>
                                    <PackageOpen size={16} className="text-success" /> Procure New Asset
                                </button>
                            </div>

                            <div className="row g-4">
                                {/* Column 1: Action Center & Requests */}
                                <div className="col-12 col-lg-6">
                                    <div className="d-flex flex-column gap-4">
                                        {/* Pending Requests Widget */}
                                        <div className="card border-0 shadow-sm overflow-hidden">
                                            <div className="card-header bg-light border-bottom p-3 d-flex justify-content-between align-items-center">
                                                <h3 className="h6 fw-semibold text-dark mb-0 d-flex align-items-center gap-2">
                                                    <AlertCircle size={18} className="text-warning" /> Action Center
                                                </h3>
                                                <span className="badge bg-secondary-subtle text-secondary-emphasis rounded-pill">{requests.filter(r => r.status === 'Pending').length} Pending</span>
                                            </div>
                                            <div className="list-group list-group-flush">
                                                {requests.filter(r => r.status === 'Pending').slice(0, 5).map(req => (
                                                    <div key={req.id} className="list-group-item list-group-item-action p-3 d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <img src={req.requestedBy.avatarUrl} className="rounded-circle border" style={{ width: '2.5rem', height: '2.5rem' }} alt={req.requestedBy.fullName} />
                                                            <div>
                                                                <p className="small fw-medium text-dark mb-0">{req.requestedBy.fullName}</p>
                                                                <p className="small text-secondary mb-0" style={{ fontSize: '0.75rem' }}>Requested: <span className="fw-medium text-dark">{req.item}</span></p>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex gap-2">
                                                            <button onClick={() => handleRequestAction(req.id, RequestStatus.APPROVED)} className="btn btn-sm btn-success rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '2rem', height: '2rem' }} title="Approve & Create Task"><Check size={16} /></button>
                                                            <button onClick={() => handleRequestAction(req.id, RequestStatus.REJECTED)} className="btn btn-sm btn-danger rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '2rem', height: '2rem' }} title="Reject"><X size={16} /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {requests.filter(r => r.status === 'Pending').length === 0 && (
                                                    <div className="p-5 text-center text-secondary small">
                                                        <Check size={24} className="mx-auto mb-2 opacity-50" />
                                                        All caught up! No pending actions.
                                                    </div>
                                                )}
                                            </div>
                                            <div className="card-footer bg-light p-2 text-center border-top">
                                                <button onClick={() => handleNavigation('requests')} className="btn btn-link text-decoration-none small fw-medium text-primary">View All Requests &rarr;</button>
                                            </div>
                                        </div>

                                        {/* Asset Health Widget */}
                                        <div className="card border-0 shadow-sm p-4">
                                            <h3 className="h6 fw-semibold text-dark mb-4 d-flex align-items-center gap-2"><TrendingUp size={18} className="text-primary" /> Asset Utilization</h3>
                                            <div className="d-flex flex-column gap-3">
                                                <div>
                                                    <div className="d-flex justify-content-between small mb-1">
                                                        <span className="text-secondary">Licenses Assigned</span>
                                                        <span className="fw-medium text-dark">{Math.round((assets.filter(a => a.assetType === AssetType.LICENSE && a.assignedUsers?.length).length / assets.filter(a => a.assetType === AssetType.LICENSE).length) * 100 || 0)}%</span>
                                                    </div>
                                                    <div className="progress" style={{ height: '0.5rem' }}>
                                                        <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${(assets.filter(a => a.assetType === AssetType.LICENSE && a.assignedUsers?.length).length / assets.filter(a => a.assetType === AssetType.LICENSE).length) * 100}%` }}></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="d-flex justify-content-between small mb-1">
                                                        <span className="text-secondary">Hardware Assigned</span>
                                                        <span className="fw-medium text-dark">{Math.round((assets.filter(a => a.assetType === AssetType.HARDWARE && a.assignedUser).length / assets.filter(a => a.assetType === AssetType.HARDWARE).length) * 100 || 0)}%</span>
                                                    </div>
                                                    <div className="progress" style={{ height: '0.5rem' }}>
                                                        <div className="progress-bar bg-success" role="progressbar" style={{ width: `${(assets.filter(a => a.assetType === AssetType.HARDWARE && a.assignedUser).length / assets.filter(a => a.assetType === AssetType.HARDWARE).length) * 100}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-3 border-top grid grid-cols-2 row">
                                                <div className="col-6 text-center border-end">
                                                    <p className="fs-4 fw-bold text-dark mb-0">{assetTypeCounts.licenses}</p>
                                                    <p className="small text-secondary text-uppercase fw-semibold mb-0" style={{ fontSize: '0.7rem' }}>License Types</p>
                                                </div>
                                                <div className="col-6 text-center">
                                                    <p className="fs-4 fw-bold text-dark mb-0">{assetTypeCounts.hardware}</p>
                                                    <p className="small text-secondary text-uppercase fw-semibold mb-0" style={{ fontSize: '0.7rem' }}>Hardware Types</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: Team & Activity */}
                                <div className="col-12 col-lg-6">
                                    <div className="d-flex flex-column gap-4">
                                        {/* Team Composition Widget */}
                                        <div className="card border-0 shadow-sm p-4">
                                            <h3 className="h6 fw-semibold text-dark mb-4 d-flex align-items-center gap-2"><Briefcase size={18} className="text-info" /> Department Distribution</h3>
                                            <div className="d-flex flex-column gap-3">
                                                {departmentStats.map(([dept, count]) => (
                                                    <div key={dept} className="d-flex flex-column gap-1">
                                                        <div className="d-flex justify-content-between small mb-1">
                                                            <span className="fw-medium text-dark">{dept}</span>
                                                            <span className="text-secondary">{count} Members</span>
                                                        </div>
                                                        <div className="progress" style={{ height: '0.375rem' }}>
                                                            <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${(count / users.length) * 100}%` }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* New Joiners / Recent Users */}
                                        <div className="card border-0 shadow-sm overflow-hidden">
                                            <div className="card-header bg-white border-bottom p-3">
                                                <h3 className="h6 fw-semibold text-dark mb-0">New Joiners</h3>
                                            </div>
                                            <div className="p-3">
                                                <div className="row g-3">
                                                    {users.slice(0, 4).map(user => (
                                                        <div key={user.id} className="col-12 col-sm-6">
                                                            <div onClick={() => handleUserClick(user)} className="d-flex align-items-center gap-3 p-2 rounded border hover-border-primary hover-bg-light cursor-pointer transition">
                                                                <img src={user.avatarUrl} className="rounded-circle" style={{ width: '2.5rem', height: '2.5rem' }} alt={user.fullName} />
                                                                <div className="text-truncate">
                                                                    <p className="small fw-medium text-dark mb-0 text-truncate">{user.fullName}</p>
                                                                    <p className="small text-secondary mb-0 text-truncate" style={{ fontSize: '0.75rem' }}>{user.jobTitle}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <button onClick={() => handleNavigation('users')} className="w-100 btn btn-light rounded-0 text-secondary small fw-medium border-top">
                                                View Full Team Directory
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        // User Stats Dashboard
                        <div className="row g-4">
                            <div className="col-12 col-md-6 col-lg-3"><StatCard icon={Package} title="My Total Assets" value={dashboardStats.myAssets!} color="#4f46e5" onClick={() => { handleNavigation('licenses'); setAssetViewMode('items'); }} /></div>
                            <div className="col-12 col-md-6 col-lg-3"><StatCard icon={KeyRound} title="My Licenses" value={dashboardStats.myLicenses!} color="#10b981" onClick={() => { handleNavigation('licenses'); setAssetViewMode('items'); }} /></div>
                            <div className="col-12 col-md-6 col-lg-3"><StatCard icon={Tv} title="My Hardware" value={dashboardStats.myHardware!} color="#f59e0b" onClick={() => { handleNavigation('hardware'); setAssetViewMode('items'); }} /></div>
                            <div className="col-12 col-md-6 col-lg-3"><StatCard icon={ClipboardList} title="My Active Requests" value={dashboardStats.myRequests!} color="#ef4444" onClick={() => handleNavigation('requests')} /></div>

                            <div className="col-12">
                                <div className="card border-0 shadow-sm p-4 mt-2">
                                    <h3 className="h5 fw-semibold text-dark mb-4">My Quick Actions</h3>
                                    <div className="d-flex gap-3">
                                        <button onClick={() => handleNewRequest('Hardware')} className="d-flex align-items-center gap-3 p-3 bg-light rounded border border-light hover-border-primary hover-bg-light-subtle transition text-decoration-none border-0" style={{ minWidth: '200px' }}>
                                            <div className="p-2 bg-white rounded-circle shadow-sm text-primary"><Tv size={20} /></div>
                                            <span className="fw-medium text-dark">Request Hardware</span>
                                        </button>
                                        <button onClick={() => handleNewRequest('Microsoft')} className="d-flex align-items-center gap-3 p-3 bg-light rounded border border-light hover-border-primary hover-bg-light-subtle transition text-decoration-none border-0" style={{ minWidth: '200px' }}>
                                            <div className="p-2 bg-white rounded-circle shadow-sm text-info"><KeyRound size={20} /></div>
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

                    <div className="container-fluid p-0">
                        {/* View Toggle and Action Bar */}
                        <div className="card border-0 shadow-sm p-3 mb-4 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
                            <div className="d-flex bg-light p-1 rounded">
                                <button
                                    onClick={() => setAssetViewMode('items')}
                                    className={`btn btn-sm d-flex align-items-center gap-2 fw-medium border-0 ${assetViewMode === 'items' ? 'bg-white shadow-sm text-primary' : 'text-secondary hover-bg-light-subtle'}`}
                                >
                                    <List size={16} /> {isAdmin ? 'Individual Items' : 'My Items'}
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={() => setAssetViewMode('families')}
                                        className={`btn btn-sm d-flex align-items-center gap-2 fw-medium border-0 ${assetViewMode === 'families' ? 'bg-white shadow-sm text-primary' : 'text-secondary hover-bg-light-subtle'}`}
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
                    onUpdateConfig={handleUpdateConfig}
                    users={users}
                    assets={assets}
                    families={assetFamilies}
                    vendors={vendors}
                    onUpdateVendors={setVendors}
                    sites={sites}
                    onUpdateSites={setSites}
                    departments={departments}
                    onUpdateDepartments={setDepartments}
                    onImportData={handleImportData}
                    onNavigateToFamily={(f) => {
                        handleNavigation(f.assetType === AssetType.LICENSE ? 'licenses' : 'hardware');
                        handleFamilyClick(f);
                    }}
                    onEditFamily={(f) => {
                        setEditingFamily(f);
                        setEditingAsset(null);
                        setModalMode('family');
                        setIsAssetModalOpen(true);
                    }}
                    onAddFamily={() => {
                        setEditingFamily(null);
                        setEditingAsset(null);
                        setModalMode('family');
                        setIsAssetModalOpen(true);
                    }}
                />
            </div> : null;
            default: return null;
        }
    };


    return (
        <div className="d-flex flex-column min-vh-100 bg-light">
            {/* Top Navigation Bar */}
            <header className="bg-white border-bottom sticky-top shadow-sm z-3">
                <div className="container-fluid px-4">
                    <div className="d-flex justify-content-between align-items-center py-3">
                        <div className="d-flex align-items-center gap-4">
                            <div className="flex-shrink-0 d-flex align-items-center gap-2 cursor-pointer" onClick={() => handleNavigation('dashboard')}>
                                <LayoutDashboard className="h-8 w-8 text-primary" style={{ width: '2rem', height: '2rem' }} />
                            </div>
                            <nav className="d-none d-md-flex gap-1">
                                <NavItem view="dashboard" label="Dashboard" icon={LayoutDashboard} />
                                <NavItem view="licenses" label="Licenses" icon={FileSpreadsheet} />
                                <NavItem view="hardware" label="Hardware" icon={Monitor} />
                                {isAdmin && <NavItem view="users" label="Users" icon={UserSquare2} />}
                                <NavItem view="requests" label="Requests" icon={ClipboardList} />
                                {isAdmin && <NavItem view="admin" label="Admin" icon={ShieldAlert} />}
                            </nav>
                        </div>
                        {/* Global Search Bar */}
                        <div className="flex-grow-1 mx-4">
                            <GlobalSearch users={users} assets={assets} families={assetFamilies} onSelect={handleGlobalSearchSelect} />
                        </div>
                        <div className="d-flex align-items-center gap-4">
                            <UserSwitcher users={users} currentUser={currentUser} onSwitch={setCurrentUser} />
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow-1 p-4 px-sm-5">
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

            {isProfileModalOpen && (editingUser || selectedUser) && <EditProfileModal isOpen={isProfileModalOpen} onClose={() => { setIsProfileModalOpen(false); setEditingUser(null); }} onSave={handleSaveUser} onDelete={handleDeleteUser} user={editingUser || selectedUser} config={config} />}
            {isRequestModalOpen && requestingUser && <RequestAssetModal isOpen={isRequestModalOpen} onClose={closeRequestModal} onSubmit={handleSubmitRequest} user={requestingUser} assetFamilies={assetFamilies} category={requestCategory} />}
            {isTaskModalOpen && requestForTask && <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} request={requestForTask} adminUsers={adminUsers} allUsers={users} onCreateTask={handleTaskSubmit} />}
        </div>
    );
};

export default App;


