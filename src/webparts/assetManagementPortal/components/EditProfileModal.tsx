import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { User, Config } from '../../assetManagementPortal/types';
import ImageUploadTab from './ImageUploadTab';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  user: User | null;
  config: Config;
}

const FormInput: React.FC<{ label: string; name: string; value?: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }> = ({ label, name, value, onChange, placeholder }) => (
  <div className="mb-3">
    <label htmlFor={name} className="form-label small fw-bold">{label}</label>
    <input
      type="text"
      id={name}
      name={name}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className="form-control" />
  </div>
);

const FormSelect: React.FC<{ label: string; name: string; value?: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode }> = ({ label, name, value, onChange, children }) => (
  <div className="mb-3">
    <label htmlFor={name} className="form-label small fw-bold">{label}</label>
    <select
      id={name}
      name={name}
      value={value || ''}
      onChange={onChange}
      className="form-select"
    >
      {children}
    </select>
  </div>
);

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSave, user, config }) => {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [activeTab, setActiveTab] = useState('');

  const layout = config.modalLayouts?.userProfile || { tabs: [] };

  useEffect(() => {
    if (user && isOpen) {
      setFormData(user);
      if (layout.tabs && layout.tabs.length > 0) {
        setActiveTab(layout.tabs[0].id);
      }
    }
  }, [user, isOpen, layout]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSiteChange = (site: string) => {
    const currentSites = formData.site || [];
    const newSites = currentSites.includes(site)
      ? currentSites.filter(s => s !== site)
      : [...currentSites, site];
    setFormData(prev => ({ ...prev, site: newSites }));
  };

  const handleAvatarChange = useCallback((newAvatarUrl: string | undefined) => {
    setFormData(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const finalData = {
      ...user,
      ...formData,
      fullName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
      modifiedDate: new Date().toLocaleDateString('en-GB'),
      modifiedBy: 'Admin',
    } as User;
    onSave(finalData);
  };

  const renderField = (fieldKey: string) => {
    switch (fieldKey) {
      case 'firstName': return <FormInput label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />;
      case 'lastName': return <FormInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />;
      case 'suffix': return <FormInput label="Suffix" name="suffix" value={formData.suffix} onChange={handleChange} />;
      case 'jobTitle': return <FormInput label="Job Title" name="jobTitle" value={formData.jobTitle} onChange={handleChange} />;
      case 'department': return <FormSelect label="Department" name="department" value={formData.department} onChange={handleChange}><option value="">Select Department</option>{config.departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}</FormSelect>;

      case 'site': return (
        <div className="col-12 mb-3">
          <label className="form-label small fw-bold d-block">Site</label>
          <div className="d-flex flex-wrap gap-3">
            {config.sites.map(site => (
              <div key={site} className="form-check">
                <input className="form-check-input" type="checkbox" id={`site-${site}`} checked={formData.site?.includes(site)} onChange={() => handleSiteChange(site)} />
                <label className="form-check-label small" htmlFor={`site-${site}`}>{site}</label>
              </div>
            ))}
          </div>
        </div>
      );

      case 'typeOfContact': return (
        <div className="mb-3">
          <label className="form-label small fw-bold">Type Of Contact</label>
          <div className="form-control bg-light d-flex gap-2 align-items-center">
            {formData.typeOfContact?.map(t => (
              <span key={t} className="badge bg-primary-subtle text-primary-emphasis rounded-pill">{t}</span>
            ))}
          </div>
        </div>
      );

      case 'linkedin': return <FormInput label="LinkedIn" name="linkedin" value={formData.linkedin} onChange={handleChange} />;
      case 'twitter': return <FormInput label="Twitter" name="twitter" value={formData.twitter} onChange={handleChange} />;
      case 'facebook': return <FormInput label="Facebook" name="facebook" value={formData.facebook} onChange={handleChange} />;
      case 'instagram': return <FormInput label="Instagram" name="instagram" value={formData.instagram} onChange={handleChange} />;

      case 'businessPhone': return <FormInput label="Business Phone" name="businessPhone" value={formData.businessPhone} onChange={handleChange} />;
      case 'mobileNo': return <FormInput label="Mobile No." name="mobileNo" value={formData.mobileNo} onChange={handleChange} />;
      case 'email': return <FormInput label="Email" name="email" value={formData.email} onChange={handleChange} />;
      case 'nonPersonalEmail': return <FormInput label="Non-Personal Email" name="nonPersonalEmail" value={formData.nonPersonalEmail} onChange={handleChange} />;
      case 'homePhone': return <FormInput label="Home Phone" name="homePhone" value={formData.homePhone} onChange={handleChange} />;
      case 'skype': return <FormInput label="Skype" name="skype" value={formData.skype} onChange={handleChange} />;
      case 'address': return <div className="col-span-2"><FormInput label="Address" name="address" value={formData.address} onChange={handleChange} /></div>;
      case 'city': return <FormInput label="City" name="city" value={formData.city} onChange={handleChange} />;

      case 'notes': return <div className="col-12 mb-3"><label className="form-label small fw-bold">Comments</label><textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} rows={4} className="form-control" /></div>;

      case 'avatarUpload': return (
        <ImageUploadTab
          currentAvatar={formData.avatarUrl}
          onAvatarChange={handleAvatarChange}
          contactName={formData.fullName || ''}
        />
      );

      default: return null;
    }
  }

  return (
    <div className={`modal fade show d-block bg-dark bg-opacity-50`} tabIndex={-1} onClick={onClose}>
      <div
        className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-content h-100" style={{ maxHeight: '90vh' }}>
          {user && (
            <>
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Edit Contact - {user.fullName}</h5>
                <button type="button" className="btn-close" onClick={onClose}></button>
              </div>

              <div className="px-3 border-bottom">
                <ul className="nav nav-tabs border-bottom-0">
                  {layout.tabs?.map(tab => (
                    <li className="nav-item" key={tab.id}>
                      <button
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`nav-link text-uppercase small fw-bold ${activeTab === tab.id ? 'active' : 'text-muted'}`}
                      >
                        {tab.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <form onSubmit={handleSubmit} className="d-flex flex-column h-100">
                <div className="modal-body bg-light">
                  {layout.tabs?.map(tab => {
                    if (tab.id !== activeTab) return null;
                    return (
                      <div key={tab.id} className="d-grid gap-4">
                        {tab.sections?.map(section => (
                          <Section key={section.id} title={section.title}>
                            <div className="row g-3">
                              {section.fields?.map(fieldKey => (
                                <div key={fieldKey} className={`col-${12 / (section.columns || 1)}`}>
                                  {renderField(fieldKey)}
                                </div>
                              ))}
                            </div>
                          </Section>
                        ))}
                      </div>
                    );
                  })}
                </div>
                <div className="modal-footer bg-light d-flex justify-content-between align-items-center">
                  <div className="text-muted" style={{ fontSize: '10px' }}>
                    <div>Created {user.createdDate} By {user.createdBy}</div>
                    <div>Last modified {user.modifiedDate} By {user.modifiedBy}</div>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-link text-danger text-decoration-none btn-sm">Delete this item</button>
                    <button type="button" onClick={onClose} className="btn btn-light border">Cancel</button>
                    <button type="submit" className="btn btn-primary">Save</button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="card shadow-sm border-0">
    <div className="card-header bg-white py-3">
      <h6 className="mb-0 fw-bold text-dark">{title}</h6>
    </div>
    <div className="card-body">
      {children}
    </div>
  </div>
);

export default EditProfileModal;