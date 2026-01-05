
import React, { useState, useMemo } from 'react';
import { User, Asset, AccountStatus, Platform, AssetFamily, AssetType } from '../types';
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
  <div className={`col-12 ${!fullWidth ? 'col-sm-6' : ''}`}>
    <div className="d-flex align-items-start gap-3 p-3 bg-light rounded text-break">
      <div className="bg-white rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center flex-shrink-0">
        <Icon className="text-primary" size={18} />
      </div>
      <div>
        <p className="small fw-semibold text-secondary mb-0">{label}</p>
        <div className="fw-semibold text-dark">{value || '-'}</div>
      </div>
    </div>
  </div>
);

const PlatformAccountsTab: React.FC<{ user: User }> = ({ user }) => {
  const platformAccounts = user.platformAccounts || [];
  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case Platform.SHAREPOINT: return <Briefcase className="text-primary" size={18} />;
      case Platform.GMAIL: return <Mail className="text-danger" size={18} />;
      case Platform.DOGADO: return <Mail className="text-warning" size={18} />;
      default: return <Briefcase className="text-secondary" size={18} />;
    }
  }

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-0 py-3 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <Briefcase className="text-secondary" size={20} />
          <h5 className="mb-0 fw-bold text-dark">Platform Accounts</h5>
        </div>
        <button className="btn btn-sm btn-primary d-flex align-items-center gap-2 fw-medium"> <Plus size={16} /> Add Account </button>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light"><tr><th scope="col" className="px-3 fw-bold text-secondary text-uppercase small">Platform</th><th scope="col" className="px-3 fw-bold text-secondary text-uppercase small">Email</th><th scope="col" className="px-3 fw-bold text-secondary text-uppercase small">Type</th><th scope="col" className="px-3 fw-bold text-secondary text-uppercase small">Status</th><th scope="col" className="px-3 fw-bold text-secondary text-uppercase small">Created</th><th scope="col" className="px-3"></th></tr></thead>
            <tbody>
              {platformAccounts.map(account => (
                <tr key={account.id}>
                  <td className="px-3"><div className="d-flex align-items-center gap-2">{getPlatformIcon(account.platform)}<span className="small fw-bold text-dark">{account.platform}</span></div></td>
                  <td className="px-3 small text-secondary">{account.email}</td>
                  <td className="px-3 small text-secondary">{account.accountType}</td>
                  <td className="px-3"><span className={`badge rounded-pill ${account.status === AccountStatus.ACTIVE ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>{account.status}</span></td>
                  <td className="px-3 small text-secondary">{account.createdDate}</td>
                  <td className="px-3 text-end"><div className="d-flex justify-content-end gap-1"><button className="btn btn-sm btn-light text-secondary hover-text-primary p-1 rounded-circle"><Edit2 size={16} /></button><button className="btn btn-sm btn-light text-secondary hover-text-danger p-1 rounded-circle"><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {platformAccounts.length === 0 && <div className="text-center py-5 text-muted small"><p className="mb-0">No platform accounts assigned.</p></div>}
      </div>
    </div>
  );
};

const HistoryTab: React.FC<{ user: User; assets: Asset[] }> = ({ user, assets }) => {
  const staticHistory = user.history || [];

  // Derive history from currently assigned assets
  const derivedHistory: any[] = [];
  assets.forEach(asset => {
    // 1. Current Assignment
    derivedHistory.push({
      id: `hist-curr-${asset.id}`,
      assetName: asset.title || asset.assetId,
      assetId: asset.assetId,
      date: asset.created ? asset.created.split('T')[0] : new Date().toISOString().split('T')[0],
      type: 'Assigned',
      notes: 'Current active assignment',
      assignedTo: user.fullName
    });

    // 2. Maintenance History
    if (asset.maintenanceHistory && Array.isArray(asset.maintenanceHistory)) {
      asset.maintenanceHistory.forEach((m: any, idx: number) => {
        derivedHistory.push({
          id: m.id || `hist-maint-${asset.id}-${idx}`,
          assetName: m.assetName || asset.title || asset.assetId,
          assetId: m.assetId || asset.assetId,
          date: m.date,
          type: m.type || 'Maintenance',
          notes: m.notes,
          assignedTo: user.fullName
        });
      });
    }
  });

  const history = [...staticHistory, ...derivedHistory].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-0 py-3 d-flex items-center gap-2">
        <History className="text-secondary" size={20} />
        <h5 className="mb-0 fw-bold text-dark">Assignment History</h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light"><tr><th className="px-3 fw-bold text-secondary text-uppercase small">Date</th><th className="px-3 fw-bold text-secondary text-uppercase small">Action</th><th className="px-3 fw-bold text-secondary text-uppercase small">Asset Name</th><th className="px-3 fw-bold text-secondary text-uppercase small">Asset ID</th><th className="px-3 fw-bold text-secondary text-uppercase small">Notes</th></tr></thead>
            <tbody>
              {history.map(item => (
                <tr key={item.id}>
                  <td className="px-3 small text-secondary">{item.date}</td>
                  <td className="px-3"><span className={`badge rounded-pill ${item.type === 'Assigned' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>{item.type}</span></td>
                  <td className="px-3 small fw-semibold text-dark">{item.assetName}</td>
                  <td className="px-3 small text-secondary font-monospace">{item.assetId}</td>
                  <td className="px-3 small text-secondary text-wrap" style={{ maxWidth: '200px' }}>{item.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {history.length === 0 && <div className="text-center py-5 text-muted small"><p className="mb-0">No history available.</p></div>}
      </div>
    </div>
  );
};

const AssignedAssetsTab: React.FC<{ user: User; assets: Asset[]; families: AssetFamily[]; onNewRequest: (category: RequestCategory) => void; }> = ({ user, assets, families, onNewRequest }) => {
  const assetsWithFamily = useMemo(() => assets.map(asset => {
    const family = families.find(f => f.id === asset.familyId);
    return { ...asset, family };
  }), [assets, families]);

  const licenses = useMemo(() => assetsWithFamily.filter(a => a.assetType === AssetType.LICENSE), [assetsWithFamily]);
  const hardware = useMemo(() => assetsWithFamily.filter(a => a.assetType === AssetType.HARDWARE), [assetsWithFamily]);

  const formatDateYYYYMMDD = (date: any) => {
    if (!date) return "-";
    return new Date(date).toISOString().split("T")[0];
  };

  const getAssignmentRole = (asset: Asset) => {
    if (asset.assignedUser?.id === user.id || asset.assignedUsers?.some(u => u.id === user.id)) {
      return <span className="badge rounded-pill bg-primary-subtle text-primary">Owner</span>;
    }
    if (asset.activeUsers?.some(u => u.id === user.id)) {
      return <span className="badge rounded-pill bg-info-subtle text-info">Active User</span>;
    }
    return null;
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-0 py-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <KeyRound className="text-secondary" size={20} />
            <h5 className="mb-0 fw-bold text-dark">Assigned Licenses</h5>
          </div>
          <button onClick={() => onNewRequest('External')} className="btn btn-sm btn-primary d-flex align-items-center gap-2 fw-medium"> <Plus size={16} /> Request License </button>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light"><tr><th className="px-3 fw-bold text-secondary text-uppercase small">Software Name</th><th className="px-3 fw-bold text-secondary text-uppercase small">Role</th><th className="px-3 fw-bold text-secondary text-uppercase small">Variant</th><th className="px-3 fw-bold text-secondary text-uppercase small">Asset-ID</th><th className="px-3 fw-bold text-secondary text-uppercase small">Email/Username</th><th className="px-3 fw-bold text-secondary text-uppercase small">Renewal Date</th></tr></thead>
              <tbody>
                {licenses.map(asset => (
                  <tr key={asset.id}>
                    <td className="px-3 small fw-semibold text-dark">{asset.family?.name || '-'}</td>
                    <td className="px-3 small">{getAssignmentRole(asset)}</td>
                    <td className="px-3 small text-secondary">{asset.variantType}</td>
                    <td className="px-3 small text-secondary font-monospace">{asset.assetId}</td>
                    <td className="px-3 small text-secondary">{asset.email || '-'}</td>
                    <td className="px-3 small text-secondary">{formatDateYYYYMMDD(asset.modified)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {licenses.length === 0 && <div className="text-center py-5 text-muted small"><p className="mb-0">No licenses assigned.</p></div>}
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-0 py-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <Tv className="text-secondary" size={20} />
            <h5 className="mb-0 fw-bold text-dark">Assigned Hardware</h5>
          </div>
          <button onClick={() => onNewRequest('Hardware')} className="btn btn-sm btn-primary d-flex align-items-center gap-2 fw-medium"> <Plus size={16} /> Request Hardware </button>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light"><tr><th className="px-3 fw-bold text-secondary text-uppercase small">Hardware Name</th><th className="px-3 fw-bold text-secondary text-uppercase small">Role</th><th className="px-3 fw-bold text-secondary text-uppercase small">Asset-ID</th><th className="px-3 fw-bold text-secondary text-uppercase small">Serial Number</th><th className="px-3 fw-bold text-secondary text-uppercase small">Warranty Status</th></tr></thead>
              <tbody>
                {hardware.map(asset => (
                  <tr key={asset.id}>
                    <td className="px-3 small fw-semibold text-dark">{asset.family?.name || '-'}</td>
                    <td className="px-3 small">{getAssignmentRole(asset)}</td>
                    <td className="px-3 small text-secondary font-monospace">{asset.assetId}</td>
                    <td className="px-3 small text-secondary">{asset.serialNumber}</td>
                    <td className="px-3 small text-secondary">{formatDateYYYYMMDD(asset.expiryDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hardware.length === 0 && <div className="text-center py-5 text-muted small"><p className="mb-0">No hardware assigned.</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const UserProfile: React.FC<UserProfileProps> = ({ user, userAssets, assetFamilies, onEditProfile, onNewRequest, onQuickRequest }) => {
  const [activeTab, setActiveTab] = useState('general');

  // Guard against null/undefined user
  if (!user) return <div className="p-8 text-center text-slate-500">User profile not found.</div>;

  const renderGeneralInfo = () => (
    <div className="row g-4">
      <div className="col-12 col-lg-8 d-flex flex-column gap-4">
        <section>
          <h5 className="fw-bold text-dark mb-3">Contact Information</h5>
          <div className="row g-3">
            <InfoItem icon={Phone} label="Business Phone" value={user.businessPhone} />
            <InfoItem icon={Phone} label="Mobile No" value={user.mobileNo} />
            <InfoItem icon={Mail} label="Official Email" value={<a href={`mailto:${user.email}`} className="text-decoration-none text-primary">{user.email}</a>} fullWidth />
            {user.nonPersonalEmail && <InfoItem icon={Mail} label="Non-Personal Email" value={<a href={`mailto:${user.nonPersonalEmail}`} className="text-decoration-none text-primary">{user.nonPersonalEmail}</a>} fullWidth />}
          </div>
        </section>
        <section>
          <h5 className="fw-bold text-dark mb-3">Address Information</h5>
          <div className="row g-3">
            <InfoItem icon={MapPin} label="Address" value={user.address} fullWidth />
            <InfoItem icon={Building} label="City" value={user.city} />
            <InfoItem icon={Mail} label="Postal Code" value={user.postalCode} />
          </div>
        </section>
        {user.notes && (
          <section>
            <h5 className="fw-bold text-dark mb-3">Notes</h5>
            <div className="bg-light rounded p-3 d-flex align-items-start gap-3">
              <div className="bg-white rounded-circle p-2 shadow-sm">
                <FileText className="text-primary" size={18} />
              </div>
              <p className="small text-secondary mb-0 text-break">{user.notes}</p>
            </div>
          </section>
        )}
      </div>
      <div className="col-12 col-lg-4 d-flex flex-column gap-4">
        <section className="bg-light rounded p-4">
          <h6 className="fw-bold text-dark mb-3">Social Media</h6>
          <div className="d-flex flex-column gap-3">
            {user.linkedin ? <a href={`https://linkedin.com/in/${user.linkedin}`} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center gap-2 text-decoration-none text-primary small fw-medium"><Linkedin size={18} /><span>{user.linkedin}</span></a> : <span className="small text-muted">No LinkedIn</span>}
            {user.twitter ? <a href={`https://twitter.com/${user.twitter.startsWith('@') ? user.twitter.substring(1) : user.twitter}`} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center gap-2 text-decoration-none text-primary small fw-medium"><Twitter size={18} /><span>{user.twitter}</span></a> : <span className="small text-muted">No Twitter</span>}
          </div>
        </section>
        <section className="bg-light rounded p-4">
          <h6 className="fw-bold text-dark mb-3">Additional Information</h6>
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-items-start gap-2"><UserIcon className="text-secondary mt-1" size={16} /><div><p className="extra-small text-muted mb-0">User Type</p><p className="small fw-semibold text-dark mb-0">{user.userType || '-'}</p></div></div>
            <div className="d-flex align-items-start gap-2"><Voicemail className="text-secondary mt-1" size={16} /><div><p className="extra-small text-muted mb-0">Extension</p><p className="small fw-semibold text-dark mb-0">{user.extension || '-'}</p></div></div>
            <div className="d-flex align-items-start gap-2"><Clock className="text-secondary mt-1" size={16} /><div><p className="extra-small text-muted mb-0">Total Assets</p><p className="small fw-semibold text-dark mb-0">{userAssets.length}</p></div></div>
          </div>
        </section>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralInfo();
      case 'accounts': return <PlatformAccountsTab user={user} />;
      case 'assets': return <AssignedAssetsTab user={user} assets={userAssets} families={assetFamilies} onNewRequest={onNewRequest} />;
      case 'history': return <HistoryTab user={user} assets={userAssets} />;
      default: return renderGeneralInfo();
    }
  }

  return (
    <div className="card shadow-lg border-0 overflow-hidden">
      <div className="card-header bg-light p-4 border-bottom">
        <div className="row align-items-center g-4">
          <div className="col-auto position-relative">
            <img src={user.avatarUrl || 'https://i.pravatar.cc/150'} alt={user.fullName} className="rounded-circle border border-3 border-white shadow-sm object-fit-cover" style={{ width: '96px', height: '96px' }} />
            {user.isVerified && <div className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-1 border border-2 border-white d-flex align-items-center justify-content-center" style={{ right: '5px' }}><CheckCircle className="text-white" size={14} /></div>}
          </div>
          <div className="col text-center text-sm-start">
            <h2 className="h3 fw-bold text-dark mb-1">{user.fullName || 'Unknown User'}</h2>
            <p className="text-secondary mb-3">{user.jobTitle || 'No Title'}</p>
            <div className="row row-cols-2 row-cols-sm-4 g-2 small text-secondary">
              <div className="col"><span className="fw-semibold text-dark">Staff ID:</span> -</div>
              <div className="col"><span className="fw-semibold text-dark">Department:</span> {user.department || '-'}</div>
              <div className="col"><span className="fw-semibold text-dark">Organization:</span> {user.organization || '-'}</div>
              <div className="col"><span className="fw-semibold text-dark">Date of Joining:</span> {user.dateOfJoining || '-'}</div>
              <div className="col"><span className="fw-semibold text-dark">Date of Exit:</span>{user.dateOfExit ? user.dateOfExit : <span className="ms-1">-</span>}</div>
            </div>
          </div>
          <div className="col-12 col-sm-auto text-center">
            <button onClick={onEditProfile} className="btn btn-primary fw-semibold shadow-sm d-inline-flex align-items-center gap-2"><Edit size={16} />Edit Profile</button>
          </div>
        </div>
      </div>
      <div className="card-body p-4">
        <div className="mb-4">
          <ul className="nav nav-underline border-bottom">
            <li className="nav-item">
              <button onClick={() => setActiveTab('general')} className={`nav-link text-uppercase fw-medium small py-3 ${activeTab === 'general' ? 'active text-primary' : 'text-secondary'}`}>GENERAL INFORMATION</button>
            </li>
            <li className="nav-item">
              <button onClick={() => setActiveTab('assets')} className={`nav-link text-uppercase fw-medium small py-3 ${activeTab === 'assets' ? 'active text-primary' : 'text-secondary'}`}>ASSIGNED ASSETS</button>
            </li>
            <li className="nav-item">
              <button onClick={() => setActiveTab('accounts')} className={`nav-link text-uppercase fw-medium small py-3 ${activeTab === 'accounts' ? 'active text-primary' : 'text-secondary'}`}>PLATFORM ACCOUNTS</button>
            </li>
            <li className="nav-item">
              <button onClick={() => setActiveTab('history')} className={`nav-link text-uppercase fw-medium small py-3 ${activeTab === 'history' ? 'active text-primary' : 'text-secondary'}`}>HISTORY</button>
            </li>
          </ul>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default UserProfile;
