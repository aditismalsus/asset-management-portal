import * as React from 'react';
import { useState, useMemo } from 'react';
import { User, Asset, AccountStatus, Platform, AssetFamily, AssetType } from '../../assetManagementPortal/types';
import { CheckCircle, Edit, Phone, Mail, MapPin, Building, Voicemail, User as UserIcon, Linkedin, Twitter, Plus, FileText, Briefcase, Edit2, Trash2, KeyRound, Tv, Clock, History } from 'lucide-react';

type RequestCategory = 'Microsoft' | 'External' | 'Hardware';
interface UserProfileProps {
    user: User;
    userAssets: Asset[];
    assetFamilies: AssetFamily[];
    onEditProfile: () => void;
    onNewRequest: (category: RequestCategory) => void;
    onQuickRequest: (assetId: string) => void;
}

const InfoItem: React.FC<{ icon: React.ElementType, label: string, value: string | React.ReactNode, fullWidth?: boolean }> = ({ icon: Icon, label, value, fullWidth = false }) => (
    <div className={`col-12 ${fullWidth ? 'col-sm-12' : 'col-sm-6'}`}>
        <div className="bg-light rounded p-3 d-flex align-items-start gap-3 h-100">
            <div className="bg-white rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center">
                <Icon className="text-primary" size={20} />
            </div>
            <div>
                <p className="small text-muted fw-medium mb-1">{label}</p>
                <p className="mb-0 fw-semibold text-dark text-break">{value || '-'}</p>
            </div>
        </div>
    </div>
);

const PlatformAccountsTab: React.FC<{ user: User }> = ({ user }) => {
    const platformAccounts = user.platformAccounts || [];
    const getPlatformIcon = (platform: Platform) => {
        switch (platform) {
            case Platform.SHAREPOINT: return <Briefcase className="text-primary" size={20} />;
            case Platform.GMAIL: return <Mail className="text-danger" size={20} />;
            case Platform.DOGADO: return <Mail className="text-warning" size={20} />;
            default: return <Briefcase className="text-secondary" size={20} />;
        }
    }

    return (
        <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                    <Briefcase className="text-secondary" size={24} />
                    <h5 className="mb-0 fw-bold text-dark">Platform Accounts</h5>
                </div>
                <button className="btn btn-primary btn-sm d-flex align-items-center gap-2"> <Plus size={16} /> Add Account </button>
            </div>
            <div className="table-responsive">
                <table className="table table-hover mb-0">
                    <thead className="table-light"><tr><th>Platform</th><th>Email</th><th>Type</th><th>Status</th><th>Created</th><th></th></tr></thead>
                    <tbody>
                        {platformAccounts.map(account => (
                            <tr key={account.id}>
                                <td><div className="d-flex align-items-center gap-2">{getPlatformIcon(account.platform)}<span className="fw-medium">{account.platform}</span></div></td>
                                <td className="text-muted small">{account.email}</td>
                                <td className="text-muted small">{account.accountType}</td>
                                <td><span className={`badge rounded-pill ${account.status === AccountStatus.ACTIVE ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>{account.status}</span></td>
                                <td className="text-muted small">{account.createdDate}</td>
                                <td className="text-end"><div className="d-flex justify-content-end gap-2"><button className="btn btn-sm btn-light text-muted hover-text-primary rounded-circle p-1"><Edit2 size={16} /></button><button className="btn btn-sm btn-light text-muted hover-text-danger rounded-circle p-1"><Trash2 size={16} /></button></div></td>
                            </tr>
                        ))}
                        {platformAccounts.length === 0 && <tr><td colSpan={6} className="text-center py-5 text-muted">No platform accounts assigned.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const HistoryTab: React.FC<{ user: User }> = ({ user }) => {
    const history = user.history || [];

    return (
        <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3">
                <div className="d-flex align-items-center gap-2">
                    <History className="text-secondary" size={24} />
                    <h5 className="mb-0 fw-bold text-dark">Assignment History</h5>
                </div>
            </div>
            <div className="table-responsive">
                <table className="table table-hover mb-0">
                    <thead className="table-light"><tr><th>Date</th><th>Action</th><th>Asset Name</th><th>Asset ID</th><th>Notes</th></tr></thead>
                    <tbody>
                        {history.map(item => (
                            <tr key={item.id}>
                                <td className="text-muted small text-nowrap">{item.date}</td>
                                <td><span className={`badge rounded-pill ${item.type === 'Assigned' ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>{item.type}</span></td>
                                <td className="fw-medium text-dark small">{item.assetName}</td>
                                <td className="text-muted small font-monospace">{item.assetId}</td>
                                <td className="text-muted small">{item.notes || '-'}</td>
                            </tr>
                        ))}
                        {history.length === 0 && <tr><td colSpan={5} className="text-center py-5 text-muted">No history available.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AssignedAssetsTab: React.FC<{ assets: Asset[]; families: AssetFamily[]; onNewRequest: (category: RequestCategory) => void; }> = ({ assets, families, onNewRequest }) => {
    const assetsWithFamily = useMemo(() => assets.map(asset => {
        const family = families.find(f => f.id === asset.familyId);
        return { ...asset, family };
    }), [assets, families]);

    const licenses = useMemo(() => assetsWithFamily.filter(a => a.assetType === AssetType.LICENSE), [assetsWithFamily]);
    const hardware = useMemo(() => assetsWithFamily.filter(a => a.assetType === AssetType.HARDWARE), [assetsWithFamily]);

    return (
        <div className="d-grid gap-4">
            <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <KeyRound className="text-secondary" size={24} />
                        <h5 className="mb-0 fw-bold text-dark">Assigned Licenses</h5>
                    </div>
                    <button onClick={() => onNewRequest('External')} className="btn btn-primary btn-sm d-flex align-items-center gap-2"> <Plus size={16} /> Request License </button>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light"><tr><th>Software Name</th><th>Variant</th><th>Asset-ID</th><th>Email/Username</th><th>Renewal Date</th></tr></thead>
                        <tbody>
                            {licenses.map(asset => (
                                <tr key={asset.id}>
                                    <td className="fw-medium text-dark small">{asset.family?.name || '-'}</td>
                                    <td className="text-muted small">{asset.variantType}</td>
                                    <td className="text-muted small font-monospace">{asset.assetId}</td>
                                    <td className="text-muted small">{asset.email || '-'}</td>
                                    <td className="text-muted small">{asset.renewalDate}</td>
                                </tr>
                            ))}
                            {licenses.length === 0 && <tr><td colSpan={5} className="text-center py-5 text-muted">No licenses assigned.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <Tv className="text-secondary" size={24} />
                        <h5 className="mb-0 fw-bold text-dark">Assigned Hardware</h5>
                    </div>
                    <button onClick={() => onNewRequest('Hardware')} className="btn btn-primary btn-sm d-flex align-items-center gap-2"> <Plus size={16} /> Request Hardware </button>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light"><tr><th>Hardware Name</th><th>Asset-ID</th><th>Serial Number</th><th>Warranty Status</th></tr></thead>
                        <tbody>
                            {hardware.map(asset => (
                                <tr key={asset.id}>
                                    <td className="fw-medium text-dark small">{asset.family?.name || '-'}</td>
                                    <td className="text-muted small font-monospace">{asset.assetId}</td>
                                    <td className="text-muted small">{asset.serialNumber}</td>
                                    <td className="text-muted small">{asset.warrantyExpiryDate}</td>
                                </tr>
                            ))}
                            {hardware.length === 0 && <tr><td colSpan={4} className="text-center py-5 text-muted">No hardware assigned.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const UserProfile: React.FC<UserProfileProps> = ({ user, userAssets, assetFamilies, onEditProfile, onNewRequest, onQuickRequest }) => {
    const [activeTab, setActiveTab] = useState('general');

    // Guard against null/undefined user
    if (!user) return <div className="p-5 text-center text-muted">User profile not found.</div>;

    const renderGeneralInfo = () => (
        <div className="row g-4">
            <div className="col-lg-8">
                <section className="mb-4">
                    <h6 className="fw-bold text-dark mb-3">Contact Information</h6>
                    <div className="row g-3">
                        <InfoItem icon={Phone} label="Business Phone" value={user.businessPhone} />
                        <InfoItem icon={Phone} label="Mobile No" value={user.mobileNo} />
                        <InfoItem icon={Mail} label="Official Email" value={<a href={`mailto:${user.email}`} className="text-primary text-decoration-none hover-underline">{user.email}</a>} fullWidth />
                        {user.nonPersonalEmail && <InfoItem icon={Mail} label="Non-Personal Email" value={<a href={`mailto:${user.nonPersonalEmail}`} className="text-primary text-decoration-none hover-underline">{user.nonPersonalEmail}</a>} fullWidth />}
                    </div>
                </section>
                <section className="mb-4">
                    <h6 className="fw-bold text-dark mb-3">Address Information</h6>
                    <div className="row g-3">
                        <InfoItem icon={MapPin} label="Address" value={user.address} fullWidth />
                        <InfoItem icon={Building} label="City" value={user.city} />
                        <InfoItem icon={Mail} label="Postal Code" value={user.postalCode} />
                    </div>
                </section>
                {user.notes && <section><h6 className="fw-bold text-dark mb-3">Notes</h6><div className="bg-light rounded p-3 d-flex gap-3"><div className="bg-white rounded-circle p-2 shadow-sm d-flex align-items-center"><FileText className="text-primary" size={20} /></div><p className="small text-dark mb-0 whitespace-pre-wrap">{user.notes}</p></div></section>}
            </div>
            <div className="col-lg-4">
                <section className="bg-light rounded p-4 mb-4">
                    <h6 className="fw-bold text-dark mb-3">Social Media</h6>
                    <div className="d-grid gap-3">
                        {user.linkedin ? <a href={`https://linkedin.com/in/${user.linkedin}`} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center gap-2 text-decoration-none text-primary small"><Linkedin size={20} /><span>{user.linkedin}</span></a> : <span className="small text-muted">No LinkedIn</span>}
                        {user.twitter ? <a href={`https://twitter.com/${user.twitter.startsWith('@') ? user.twitter.substring(1) : user.twitter}`} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center gap-2 text-decoration-none text-primary small"><Twitter size={20} /><span>{user.twitter}</span></a> : <span className="small text-muted">No Twitter</span>}
                    </div>
                </section>
                <section className="bg-light rounded p-4">
                    <h6 className="fw-bold text-dark mb-3">Additional Information</h6>
                    <div className="d-grid gap-3">
                        <div className="d-flex gap-3"><UserIcon className="text-secondary mt-1" size={20} /><div><p className="small text-muted mb-0">User Type</p><p className="small fw-bold text-dark mb-0">{user.userType || '-'}</p></div></div>
                        <div className="d-flex gap-3"><Voicemail className="text-secondary mt-1" size={20} /><div><p className="small text-muted mb-0">Extension</p><p className="small fw-bold text-dark mb-0">{user.extension || '-'}</p></div></div>
                        <div className="d-flex gap-3"><Clock className="text-secondary mt-1" size={20} /><div><p className="small text-muted mb-0">Total Assets</p><p className="small fw-bold text-dark mb-0">{userAssets.length}</p></div></div>
                    </div>
                </section>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'general': return renderGeneralInfo();
            case 'accounts': return <PlatformAccountsTab user={user} />;
            case 'assets': return <AssignedAssetsTab assets={userAssets} families={assetFamilies} onNewRequest={onNewRequest} />;
            case 'history': return <HistoryTab user={user} />;
            default: return renderGeneralInfo();
        }
    }

    return (
        <div className="card shadow border-0 overflow-hidden">
            <header className="bg-light p-4">
                <div className="d-flex flex-column flex-sm-row align-items-center align-items-sm-start gap-4">
                    <div className="position-relative flex-shrink-0">
                        <img src={user.avatarUrl || 'https://i.pravatar.cc/150'} alt={user.fullName} className="rounded-circle border border-4 border-white shadow-sm" style={{ width: 96, height: 96, objectFit: 'cover' }} />
                        {user.isVerified && <div className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-1 border border-2 border-white d-flex align-items-center justify-content-center"><CheckCircle className="text-white" size={14} /></div>}
                    </div>
                    <div className="flex-grow-1 text-center text-sm-start">
                        <h2 className="h3 fw-bold text-dark mb-1">{user.fullName || 'Unknown User'}</h2>
                        <p className="text-muted mb-3">{user.jobTitle || 'No Title'}</p>
                        <div className="row g-2 text-muted small">
                            <div className="col-6 col-md-auto"><span className="fw-bold">Staff ID:</span> -</div>
                            <div className="col-6 col-md-auto"><span className="fw-bold">Department:</span> {user.department || '-'}</div>
                            <div className="col-6 col-md-auto"><span className="fw-bold">Organization:</span> {user.organization || '-'}</div>
                            <div className="col-6 col-md-auto"><span className="fw-bold">Joined:</span> {user.dateOfJoining || '-'}</div>
                            <div className="col-6 col-md-auto"><span className="fw-bold">Exited:</span> {user.dateOfExit || '-'}</div>
                        </div>
                    </div>
                    <button onClick={onEditProfile} className="btn btn-primary btn-sm d-flex align-items-center gap-2 flex-shrink-0"><Edit size={16} />Edit Profile</button>
                </div>
            </header>
            <div className="card-body p-4 border-top">
                <ul className="nav nav-tabs mb-4">
                    <li className="nav-item"><button onClick={() => setActiveTab('general')} className={`nav-link ${activeTab === 'general' ? 'active fw-bold' : ''}`}>GENERAL INFORMATION</button></li>
                    <li className="nav-item"><button onClick={() => setActiveTab('assets')} className={`nav-link ${activeTab === 'assets' ? 'active fw-bold' : ''}`}>ASSIGNED ASSETS</button></li>
                    <li className="nav-item"><button onClick={() => setActiveTab('accounts')} className={`nav-link ${activeTab === 'accounts' ? 'active fw-bold' : ''}`}>PLATFORM ACCOUNTS</button></li>
                    <li className="nav-item"><button onClick={() => setActiveTab('history')} className={`nav-link ${activeTab === 'history' ? 'active fw-bold' : ''}`}>HISTORY</button></li>
                </ul>
                {renderContent()}
            </div>
        </div>
    );
};

export default UserProfile;