
import React, { useState, useEffect, useCallback } from 'react';
// import { X } from 'lucide-react';
import { User, Config } from '../types';
import ImageUploadTab from './ImageUploadTab';
import { handleImageUpload, getLibraryImages } from '../services/SPService';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  onDelete?: (user: User) => void;
  user: User | null;
  config: Config;
}

const FormInput: React.FC<{ label: string; name: string; value?: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }> = ({ label, name, value, onChange, placeholder }) => (
  <div className="mb-3">
    <label htmlFor={name} className="form-label small fw-medium text-secondary">{label}</label>
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
    <label htmlFor={name} className="form-label small fw-medium text-secondary">{label}</label>
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

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSave, onDelete, user, config }) => {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [activeTab, setActiveTab] = useState('');
  const [images, setImages] = useState<Record<string, string[]>>({});

  const layout = config.modalLayouts?.userProfile || { tabs: [] };

  useEffect(() => {
    if (user && isOpen) {
      setFormData(user);

      // Fetch images when modal opens
      const fetchImages = async () => {
        const imgs = await getLibraryImages();
        setImages(imgs);
      };
      fetchImages();

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
        <div className="col-12 col-md-12">
          <label className="form-label small fw-medium text-secondary">Site</label>
          <div className="d-flex flex-wrap align-items-center gap-3 mt-2">
            {config.sites.map(site => (
              <div key={site} className="form-check form-check-inline">
                <input className="form-check-input" type="checkbox" id={`site-${site}`} checked={formData.site?.includes(site)} onChange={() => handleSiteChange(site)} />
                <label className="form-check-label small fw-medium" htmlFor={`site-${site}`}>{site}</label>
              </div>
            ))}
          </div>
        </div>
      );

      case 'typeOfContact': return (
        <div>
          <label className="form-label small fw-medium text-secondary">Type Of Contact</label>
          <div className="w-100 border rounded p-2 bg-light min-h-[40px] d-flex flex-wrap gap-2">
            {formData.typeOfContact?.map(t => (
              <span key={t} className="badge bg-primary-subtle text-primary rounded-pill">{t}</span>
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
      case 'address': return <div className="col-12 col-md-12"><FormInput label="Address" name="address" value={formData.address} onChange={handleChange} /></div>;
      case 'city': return <FormInput label="City" name="city" value={formData.city} onChange={handleChange} />;
      case 'postalCode': return <FormInput label="Postal Code" name="postalCode" value={formData.postalCode} onChange={handleChange} />;

      case 'notes': return <div className="col-12"><label className="form-label small fw-medium text-secondary">Comments</label><textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} rows={4} className="form-control" /></div>;

      case 'avatarUpload': return (
        <ImageUploadTab
          currentAvatar={formData.avatarUrl}
          onAvatarChange={handleAvatarChange}
          contactName={formData.fullName || ''}
          libraryImages={images}
          onImageUpload={handleImageUpload}
        />
      );

      default: return null;
    }
  }

  return (
    <>
      <div className={`modal-backdrop fade ${isOpen ? 'show' : ''}`} style={{ display: isOpen ? 'block' : 'none' }}></div>
      <div className={`modal fade ${isOpen ? 'show d-block' : ''}`} tabIndex={-1} onClick={onClose} aria-hidden={!isOpen}>
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
          <div className="modal-content shadow-lg h-100">
            {user && (
              <>
                <div className="modal-header border-bottom bg-white">
                  <h5 className="modal-title fw-bold text-dark">Edit Contact - {user.fullName}</h5>
                  <button type="button" className="btn-close" onClick={onClose}></button>
                </div>

                <div className="border-bottom bg-white px-3">
                  <ul className="nav nav-underline">
                    {layout.tabs?.map(tab => (
                      <li className="nav-item" key={tab.id}>
                        <button
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`nav-link text-uppercase small fw-medium py-3 ${activeTab === tab.id ? 'active text-primary' : 'text-secondary'}`}
                        >
                          {tab.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="modal-body bg-light p-4">
                  <form onSubmit={handleSubmit} id="editProfileForm">
                    {layout.tabs?.map(tab => {
                      if (tab.id !== activeTab) return null;
                      return (
                        <div key={tab.id} className="d-flex flex-column gap-4">
                          {tab.sections?.map(section => (
                            <Section key={section.id} title={section.title}>
                              <div className="row g-4">
                                {section.fields?.map(fieldKey => (
                                  <div key={fieldKey} className={`col-12 col-md-${12 / (section.columns || 1)}`}>
                                    {renderField(fieldKey)}
                                  </div>
                                ))}
                              </div>
                            </Section>
                          ))}
                        </div>
                      );
                    })}
                  </form>
                </div>
                <div className="modal-footer bg-light border-top">
                  <div className="d-flex justify-content-between align-items-center w-100">
                    <div className="small text-secondary">
                      <div>Created {user.createdDate} By {user.createdBy}</div>
                      <div>Last modified {user.modifiedDate} By {user.modifiedBy}</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {onDelete && <button type="button" onClick={() => { if (confirm('Are you sure you want to delete this user?')) onDelete(user); }} className="btn btn-link text-danger text-decoration-none small">Delete this item</button>}
                      <button type="button" onClick={onClose} className="btn btn-light border text-secondary fw-medium">Cancel</button>
                      <button type="submit" form="editProfileForm" className="btn btn-primary fw-medium">Save</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="card shadow-sm border">
    <div className="card-body p-4">
      <h5 className="card-title fw-bold text-dark border-bottom pb-3 mb-4">{title}</h5>
      {children}
    </div>
  </div>
);

export default EditProfileModal;
