import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Plus, Trash2, Search, User as Check, DollarSign, Clock, Edit2, RefreshCw, Globe, Lock, Unlock, MessageSquare } from 'lucide-react';
import { Asset, User, AssetType, AssetStatus, LicenseType, AssetFamily, SoftwareProfile, LicenseVariant, HardwareProduct, ComplianceStatus, HardwareCondition, Config, TabDefinition, Vendor, AssignmentHistory } from '../../assetManagementPortal/types';

type ModalMode = 'family' | 'instance';

interface AssetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveFamily: (family: AssetFamily) => void;
    onSaveAsset: (asset: Asset) => void;
    family: AssetFamily | null;
    asset: Asset | null;
    mode: ModalMode;
    assetType: AssetType;
    allUsers: User[];
    allAssets: Asset[];
    config: Config;
    vendors?: Vendor[];
}

const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
};

const getMockExchangeRate = (currency: string, dateStr: string): number => {
    if (currency === 'EUR') return 1;
    const date = new Date(dateStr || new Date());
    const seed = date.getDate() + date.getMonth();
    const baseRates: Record<string, number> = { 'USD': 0.92, 'INR': 0.011, 'GBP': 1.17, 'JPY': 0.006 };
    const base = baseRates[currency] || 1;
    const fluctuation = (seed % 10) / 1000;
    return base + fluctuation;
};

const FormRadioGroup: React.FC<{ label: string; name: string; value?: string; options: { value: string; label: string }[]; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean; }> = ({ label, name, value, options, onChange, required = false }) => (
    <div className="mb-3">
        <label className="form-label d-block small fw-bold">{label}{required && <span className="text-danger">*</span>}</label>
        <div className="btn-group" role="group">
            {options.map((option) => (
                <React.Fragment key={option.value}>
                    <input type="radio" className="btn-check" name={name} id={`${name}-${option.value}`} value={option.value} checked={value === option.value} onChange={onChange} required={required} autoComplete="off" />
                    <label className="btn btn-outline-secondary btn-sm" htmlFor={`${name}-${option.value}`}>{option.label}</label>
                </React.Fragment>
            ))}
        </div>
    </div>
);

const FormInput: React.FC<{ label: string; name: string; value?: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; required?: boolean; placeholder?: string, step?: string, readOnly?: boolean }> = ({ label, name, value, onChange, type = 'text', required = false, placeholder, step, readOnly = false }) => (
    <div className="mb-3">
        <label htmlFor={name} className="form-label small fw-bold">{label} {required && <span className="text-danger">*</span>}</label>
        <div className="input-group">
            {type === 'number' && name === 'cost' && <span className="input-group-text"><DollarSign size={14} /></span>}
            <input type={type} name={name} id={name} value={value || ''} onChange={onChange} required={required} placeholder={placeholder} step={step} readOnly={readOnly} className={`form-control ${readOnly ? 'bg-light' : ''}`} />
        </div>
    </div>
);

const FormSelect: React.FC<{ label: string; name: string; value?: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; required?: boolean; children: React.ReactNode; }> = ({ label, name, value, onChange, required = false, children }) => (
    <div className="mb-3">
        <label htmlFor={name} className="form-label small fw-bold">{label} {required && <span className="text-danger">*</span>}</label>
        <select name={name} id={name} value={value || ''} onChange={onChange} required={required} className="form-select">{children}</select>
    </div>
);

const FormDateInput: React.FC<{ label: string; name: string; value?: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean; children?: React.ReactNode }> = ({ label, name, value, onChange, required = false, children }) => (
    <div className="mb-3">
        <label htmlFor={name} className="form-label small fw-bold">{label} {required && <span className="text-danger">*</span>}</label>
        <div className="d-flex align-items-center gap-2">
            <div className="position-relative flex-grow-1">
                <input type="date" name={name} id={name} value={value || ''} onChange={onChange} required={required} className="form-control" />
            </div>
            {children}
        </div>
    </div>
);

interface UserPickerProps {
    users: User[];
    selectedUserIds: (number | string)[];
    onChange: (userIds: (number | string)[]) => void;
    multiple?: boolean;
    label?: string;
}

const UserPicker: React.FC<UserPickerProps> = ({ users, selectedUserIds, onChange, multiple = false, label }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredUsers = useMemo(() => {
        return users.filter(u => u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [users, searchTerm]);

    const handleSelect = (userId: number | string) => {
        if (multiple) {
            if (selectedUserIds.includes(userId)) {
                onChange(selectedUserIds.filter(id => id !== userId));
            } else {
                onChange([...selectedUserIds, userId]);
            }
        } else {
            onChange(selectedUserIds.includes(userId) ? [] : [userId]);
            setIsOpen(false);
        }
    };

    const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));

    return (
        <div className="mb-3">
            {label && <label className="form-label small fw-bold">{label}</label>}
            {/* Selected Pills */}
            <div className="d-flex flex-wrap gap-2 mb-2">
                {selectedUsers.map(u => (
                    <div key={u.id} className="badge bg-light text-primary border d-flex align-items-center gap-1 p-2 rounded-pill">
                        <img src={u.avatarUrl} className="rounded-circle" style={{ width: 16, height: 16 }} />
                        <span>{u.fullName}</span>
                        <button type="button" onClick={() => handleSelect(u.id)} className="btn btn-link p-0 text-primary"><X size={14} /></button>
                    </div>
                ))}
                <button type="button" onClick={() => setIsOpen(!isOpen)} className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 rounded-pill">
                    <Plus size={14} /> {selectedUsers.length > 0 ? 'Add More' : 'Select User'}
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="card position-absolute shadow-lg z-3 w-100" style={{ maxWidth: '300px' }}>
                    <div className="card-header bg-light p-2 position-relative">
                        <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={14} />
                        <input type="text" autoFocus value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search users..." className="form-control form-control-sm ps-4" />
                        <button type="button" onClick={() => setIsOpen(false)} className="position-absolute top-50 end-0 translate-middle-y me-2 btn btn-link p-0 text-muted"><X size={16} /></button>
                    </div>
                    <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: '200px' }}>
                        {filteredUsers.map(user => {
                            const isSelected = selectedUserIds.includes(user.id);
                            return (
                                <button key={user.id} onClick={() => handleSelect(user.id)} className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${isSelected ? 'active' : ''}`}>
                                    <div className="position-relative">
                                        <img src={user.avatarUrl} alt={user.fullName} className="rounded-circle" style={{ width: 32, height: 32 }} />
                                        {isSelected && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary border border-light p-0"><Check size={8} /></span>}
                                    </div>
                                    <div className="text-truncate">
                                        <div className="small fw-bold">{user.fullName}</div>
                                        <div className="small text-muted text-truncate" style={{ fontSize: '10px' }}>{user.email}</div>
                                    </div>
                                </button>
                            );
                        })}
                        {filteredUsers.length === 0 && <div className="p-3 text-center small text-muted">No users found.</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

const AssetFormModal: React.FC<AssetFormModalProps> = ({ isOpen, onClose, onSaveFamily, onSaveAsset, family, asset, mode, assetType, allUsers, allAssets, config, vendors = [] }) => {
    const [formData, setFormData] = useState<Partial<Asset & AssetFamily>>({});
    const [activeTab, setActiveTab] = useState('');
    const [currentTabs, setCurrentTabs] = useState<TabDefinition[]>([]);

    // States for Assignment Popup in Edit Mode
    const [showAssignmentPopup, setShowAssignmentPopup] = useState(false);

    // States for Currency Tool
    const [currency, setCurrency] = useState('EUR');
    const [availableCurrencies, setAvailableCurrencies] = useState(['EUR', 'USD', 'INR']);
    const [originalCost, setOriginalCost] = useState<number | string>('');
    const [exchangeRate, setExchangeRate] = useState(1);

    // Asset ID Editing State
    const [isAssetIdLocked, setIsAssetIdLocked] = useState(true);

    const isEditMode = !!asset;
    const isFamilySoftware = formData.assetType === AssetType.LICENSE;
    const isInstanceSoftware = assetType === AssetType.LICENSE;

    useEffect(() => {
        if (isOpen) {
            // Determine layout context
            let contextKey: 'licenseFamily' | 'hardwareFamily' | 'licenseInstance' | 'hardwareInstance';
            if (mode === 'family') {
                contextKey = assetType === AssetType.LICENSE ? 'licenseFamily' : 'hardwareFamily';
            } else {
                contextKey = assetType === AssetType.LICENSE ? 'licenseInstance' : 'hardwareInstance';
            }

            const layout = config.modalLayouts?.[contextKey] || { tabs: [] };

            // Filter tabs logic could be here, but we'll show all configured tabs
            const visibleTabs = layout.tabs;

            setCurrentTabs(visibleTabs);
            if (visibleTabs.length > 0) {
                setActiveTab(visibleTabs[0].id);
            }

            setShowAssignmentPopup(false);
            setIsAssetIdLocked(true);

            // Data Initialization
            if (mode === 'family') {
                const initialFamilyData: Partial<AssetFamily> = family ? { ...family } : { assetType };
                if (initialFamilyData.assetType === AssetType.LICENSE && !(initialFamilyData as any).variants) {
                    (initialFamilyData as any).variants = [];
                }
                if (!initialFamilyData.assignmentModel) {
                    initialFamilyData.assignmentModel = assetType === AssetType.LICENSE ? 'Multiple' : 'Single';
                }
                setFormData(initialFamilyData);
            } else {
                if (asset) {
                    setFormData({
                        ...asset,
                        purchaseDate: formatDateForInput(asset.purchaseDate),
                        renewalDate: formatDateForInput(asset.renewalDate),
                        warrantyExpiryDate: formatDateForInput(asset.warrantyExpiryDate),
                    });
                    setCurrency('EUR');
                    setOriginalCost(asset.cost || 0);
                    setExchangeRate(1);
                } else if (family) {
                    const familyPrefix = family.assetType === AssetType.LICENSE ? 'SOFT' : 'HARD';
                    const productCode = (family as any).productCode || 'GEN';
                    const sequenceNumber = String(allAssets.filter(a => a.familyId === family.id).length + 1).padStart(4, '0');

                    setFormData({
                        familyId: family.id,
                        assetType: family.assetType,
                        status: AssetStatus.AVAILABLE,
                        purchaseDate: new Date().toISOString().split('T')[0],
                        assetId: `${familyPrefix}-${productCode}-${sequenceNumber}`,
                        title: `${family.name} ${sequenceNumber.replace(/^0+/, '')}`
                    });
                    setCurrency('EUR');
                    setOriginalCost('');
                    setExchangeRate(1);
                }
            }
        }
    }, [family, asset, mode, assetType, isOpen, allAssets, config.modalLayouts]);

    // Currency & Form handlers
    useEffect(() => {
        const date = formData.purchaseDate || new Date().toISOString().split('T')[0];
        const rate = getMockExchangeRate(currency, date);
        setExchangeRate(rate);
    }, [currency, formData.purchaseDate]);

    useEffect(() => {
        if (originalCost === '') {
            setFormData(prev => ({ ...prev, cost: 0 }));
        } else {
            const numCost = parseFloat(String(originalCost));
            if (!isNaN(numCost)) {
                const eurCost = numCost * exchangeRate;
                setFormData(prev => ({ ...prev, cost: parseFloat(eurCost.toFixed(2)) }));
            }
        }
    }, [originalCost, exchangeRate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleVariantChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.currentTarget;
        const variants = [...((formData as SoftwareProfile).variants || [])];
        (variants[index] as any)[name] = name === 'cost' ? parseFloat(value) || 0 : value;
        setFormData(prev => ({ ...prev, variants }));
    };

    const addVariant = () => {
        const newVariant: LicenseVariant = { id: `var-${new Date().getTime()}`, name: '', licenseType: LicenseType.SUBSCRIPTION, cost: 0 };
        setFormData(prev => ({ ...prev, variants: [...((prev as SoftwareProfile).variants || []), newVariant] }));
    };

    const removeVariant = (index: number) => {
        const variants = [...((formData as SoftwareProfile).variants || [])];
        variants.splice(index, 1);
        setFormData(prev => ({ ...prev, variants }));
    };

    const handleUserSelectionChange = (userIds: (number | string)[]) => {
        const selectedUsers = allUsers.filter(u => userIds.includes(u.id));
        const assignmentModel = family?.assignmentModel || (assetType === AssetType.LICENSE ? 'Multiple' : 'Single');

        if (assignmentModel === 'Multiple') {
            setFormData(prev => ({ ...prev, assignedUsers: selectedUsers }));
        } else {
            setFormData(prev => ({ ...prev, assignedUser: selectedUsers[0] || null }));
        }
        if (showAssignmentPopup && assignmentModel === 'Single') setShowAssignmentPopup(false);
    };

    const handleActiveUsersChange = (userIds: (number | string)[]) => {
        const selectedUsers = allUsers.filter(u => userIds.includes(u.id));
        setFormData(prev => ({ ...prev, activeUsers: selectedUsers }));
    };

    const setRenewalPeriod = (months: number) => {
        const baseDateStr = formData.purchaseDate || new Date().toISOString().split('T')[0];
        const baseDate = new Date(baseDateStr);
        const newDate = new Date(baseDate.setMonth(baseDate.getMonth() + months));
        setFormData(prev => ({ ...prev, renewalDate: formatDateForInput(newDate.toISOString()) }));
    };

    const handleAddCurrency = () => {
        const newCurr = prompt("Enter Currency Code (e.g., GBP, JPY):");
        if (newCurr && newCurr.length === 3 && !availableCurrencies.includes(newCurr.toUpperCase())) {
            setAvailableCurrencies(prev => [...prev, newCurr.toUpperCase()]);
            setCurrency(newCurr.toUpperCase());
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'family') onSaveFamily(formData as AssetFamily);
        else onSaveAsset(formData as Asset);
    };

    const modalTitle = mode === 'family'
        ? (family ? (isFamilySoftware ? 'Edit License Profile' : 'Edit Hardware Product') : (isFamilySoftware ? 'Create New License Profile' : 'Create New Hardware Product'))
        : (asset ? 'Edit Asset' : 'Create New Asset');

    const buttonTitle = mode === 'family'
        ? (family ? 'Save Changes' : (isFamilySoftware ? 'Create Profile' : 'Create Product'))
        : (asset ? 'Save Changes' : 'Create Asset');

    const getLatestAssignmentDate = (user: User) => {
        const history = (formData as Asset)?.assignmentHistory || [];
        // Find latest 'Assigned' event where assignedTo matches user name
        const assignedEvents = history.filter(h => h.type === 'Assigned' && h.assignedTo === user.fullName);
        if (assignedEvents.length > 0) {
            // Sort desc by date
            assignedEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return assignedEvents[0].date;
        }
        // Fallback
        return (formData as Asset)?.modified ? new Date((formData as Asset).modified).toISOString().split('T')[0] : '-';
    };

    // --- Field Registry ---
    const renderField = (fieldKey: string) => {
        switch (fieldKey) {
            case 'name': return <FormInput label={isFamilySoftware ? "License Name" : "Product Name"} name="name" value={(formData as any).name} onChange={handleChange} required placeholder={isFamilySoftware ? "e.g. Microsoft 365" : "e.g. MacBook Pro"} />;
            case 'productCode': return <FormInput label="Product Code" name="productCode" value={(formData as any).productCode} onChange={handleChange} required placeholder="e.g. M365" />;
            case 'vendor':
            case 'manufacturer':
                return (
                    <FormSelect label={fieldKey === 'vendor' ? 'Vendor' : 'Manufacturer'} name={fieldKey} value={(formData as any)[fieldKey]} onChange={handleChange}>
                        <option value="">Select...</option>
                        {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                        <option value="Unknown">Other / Unknown</option>
                    </FormSelect>
                );
            case 'modelNumber': return <FormInput label="Model Number" name="modelNumber" value={(formData as HardwareProduct).modelNumber} onChange={handleChange} placeholder="e.g. A2780" />;
            case 'category': return <FormRadioGroup label="Category" name="category" value={(formData as any).category} onChange={handleChange as any} required options={isFamilySoftware ? config.softwareCategories.map(c => ({ value: c, label: c })) : config.hardwareCategories.map(c => ({ value: c, label: c }))} />;
            case 'description': return <div className="mb-3"><label className="form-label small fw-bold">Description</label><textarea name="description" value={(formData as any).description || ''} onChange={handleChange} rows={3} className="form-control" placeholder="Details..."></textarea></div>;
            case 'variants': return renderSoftwareProfileForm_VariantsTab();
            case 'assignmentModel': return <FormRadioGroup label="Assignment Model" name="assignmentModel" value={(formData as AssetFamily).assignmentModel} onChange={handleChange as any} required options={[{ value: 'Single', label: 'Single User' }, { value: 'Multiple', label: 'Multiple Users' }]} />;

            case 'title': return <FormInput label="Title" name="title" value={formData.title} onChange={handleChange} required />;
            case 'assetId': return (
                <div className="mb-3">
                    <label htmlFor="assetId" className="form-label small fw-bold">Asset ID</label>
                    <div className="input-group">
                        <input
                            type="text"
                            name="assetId"
                            value={formData.assetId}
                            onChange={handleChange}
                            readOnly={isAssetIdLocked}
                            className={`form-control ${isAssetIdLocked ? 'bg-light' : ''}`}
                        />
                        <button
                            type="button"
                            onClick={() => setIsAssetIdLocked(!isAssetIdLocked)}
                            className={`btn ${isAssetIdLocked ? 'btn-outline-secondary' : 'btn-outline-danger'}`}
                            title={isAssetIdLocked ? "Unlock to edit" : "Lock ID"}
                        >
                            {isAssetIdLocked ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                    </div>
                </div>
            );
            case 'status': return <FormSelect label="Status" name="status" value={formData.status} onChange={handleChange} required>{Object.values(AssetStatus).map(s => <option key={s} value={s}>{s}</option>)}</FormSelect>;
            case 'variantType': return <FormSelect label="Variant" name="variantType" value={formData.variantType} onChange={handleChange}><option value="">Select Variant</option>{(family as SoftwareProfile)?.variants?.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}</FormSelect>;
            case 'licenseKey': return <FormInput label="License Key" name="licenseKey" value={formData.licenseKey} onChange={handleChange} />;
            case 'email': return <FormInput label="Registration Email" name="email" value={formData.email} onChange={handleChange} type="email" />;
            case 'serialNumber': return <FormInput label="Serial Number" name="serialNumber" value={formData.serialNumber} onChange={handleChange} />;
            case 'macAddress': return <FormInput label="MAC Address" name="macAddress" value={formData.macAddress} onChange={handleChange} />;
            case 'location': return <FormInput label="Location" name="location" value={formData.location} onChange={handleChange} />;
            case 'condition': return <FormRadioGroup label="Condition" name="condition" value={formData.condition} onChange={handleChange as any} options={Object.values(HardwareCondition).map(s => ({ value: s, label: s }))} />;

            case 'assignedUsers':
            case 'assignedUser':
                const assignmentModel = family?.assignmentModel || (assetType === AssetType.LICENSE ? 'Multiple' : 'Single');
                const currentIds = assignmentModel === 'Multiple'
                    ? formData.assignedUsers?.map(u => u.id) || []
                    : formData.assignedUser ? [formData.assignedUser.id] : [];

                return (
                    <div className="mb-3">
                        <p className="small text-muted mb-2">Select {assignmentModel === 'Multiple' ? 'assigned users' : 'primary user'}.</p>
                        <UserPicker
                            users={allUsers}
                            selectedUserIds={currentIds}
                            onChange={handleUserSelectionChange}
                            multiple={assignmentModel === 'Multiple'}
                        />
                    </div>
                );

            case 'activeUsers': return (
                <div className="mb-3">
                    <p className="small text-muted mb-2">Active users of this asset.</p>
                    <UserPicker
                        users={allUsers}
                        selectedUserIds={formData.activeUsers?.map(u => u.id) || []}
                        onChange={handleActiveUsersChange}
                        multiple={true}
                    />
                </div>
            );

            case 'currencyTool': return renderCurrencyTool();
            case 'purchaseDate': return <FormDateInput label="Purchase Date" name="purchaseDate" value={formatDateForInput(formData.purchaseDate)} onChange={handleChange} />;
            case 'renewalDate': return <FormDateInput label="Renewal Date" name="renewalDate" value={formatDateForInput(formData.renewalDate)} onChange={handleChange}><div className="btn-group ms-2"><button type="button" onClick={() => setRenewalPeriod(1)} className="btn btn-sm btn-outline-secondary">+1 Mo</button><button type="button" onClick={() => setRenewalPeriod(12)} className="btn btn-sm btn-outline-secondary">+1 Yr</button></div></FormDateInput>;
            case 'warrantyExpiryDate': return <FormDateInput label="Warranty Expiry Date" name="warrantyExpiryDate" value={formatDateForInput(formData.warrantyExpiryDate)} onChange={handleChange} />;
            case 'complianceStatus': return <FormRadioGroup label="Compliance Status" name="complianceStatus" value={formData.complianceStatus} onChange={handleChange as any} options={Object.values(ComplianceStatus).map(s => ({ value: s, label: s }))} />;
            case 'cost': return null;

            case 'assignmentHistory':
                const fullHistory = (formData as Asset).assignmentHistory || [];
                // Sort history for calculation
                const sortedHistory = [...fullHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                const assignmentLog = sortedHistory.filter(h => ['Assigned', 'Returned', 'Reassigned', 'Lost'].includes(h.type));
                const usageLog = sortedHistory.filter(h => h.type === 'Usage Update');

                const getEndDate = (index: number, list: AssignmentHistory[]) => {
                    if (index > 0) {
                        return list[index - 1].date; // The start date of the newer event
                    }
                    return 'Present';
                };

                return (
                    <div className="d-grid gap-4">
                        {/* Assignment Log */}
                        <div>
                            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><Clock size={16} /> Assignment Log</h6>
                            <div className="card overflow-hidden">
                                <div className="table-responsive">
                                    <table className="table table-sm table-striped mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Start Date</th>
                                                <th>End Date</th>
                                                <th>User / Action</th>
                                                <th>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assignmentLog.length > 0 ? assignmentLog.map((h, i) => (
                                                <tr key={i}>
                                                    <td className="small">{h.date}</td>
                                                    <td className="text-muted small">{getEndDate(i, assignmentLog)}</td>
                                                    <td className="small">
                                                        <span className={`badge rounded-pill me-1 ${h.type === 'Reassigned' ? 'bg-warning text-dark' : 'bg-primary'}`}>
                                                            {h.type}
                                                        </span>
                                                        <span className="fw-medium">{h.assignedTo || h.assignedFrom || '-'}</span>
                                                    </td>
                                                    <td className="text-muted small">{h.notes}</td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={4} className="text-center py-3 text-muted small fst-italic">No assignment history.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Usage Log */}
                        <div>
                            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><RefreshCw size={16} /> Usage Log</h6>
                            <div className="card overflow-hidden">
                                <div className="table-responsive">
                                    <table className="table table-sm table-striped mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Date</th>
                                                <th>Action</th>
                                                <th>Details</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usageLog.length > 0 ? usageLog.map((h, i) => (
                                                <tr key={i}>
                                                    <td className="small">{h.date}</td>
                                                    <td className="small">
                                                        <span className="badge rounded-pill bg-info text-dark">Update</span>
                                                    </td>
                                                    <td className="text-muted small">{h.notes}</td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={3} className="text-center py-3 text-muted small fst-italic">No usage updates recorded.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default: return null;
        }
    };

    const renderCurrencyTool = () => (
        <div className="mb-3">
            <label className="form-label small fw-bold">Currency Calculation Tool</label>
            <div className="card bg-light p-3">
                <div className="row g-2 mb-3">
                    <div className="col-6">
                        <label className="form-label small text-muted">Currency</label>
                        <div className="input-group input-group-sm">
                            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="form-select">
                                {availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <button type="button" onClick={handleAddCurrency} className="btn btn-outline-secondary" title="Add Currency">+</button>
                        </div>
                    </div>
                    <div className="col-6">
                        <label className="form-label small text-muted">Original Value</label>
                        <input type="number" value={originalCost} onChange={(e) => setOriginalCost(e.target.value)} className="form-control form-control-sm" placeholder="0.00" step="0.01" />
                    </div>
                </div>
                <div className="d-flex align-items-center justify-content-between bg-white p-2 border rounded shadow-sm">
                    <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary-subtle p-1 rounded-circle text-primary"><Globe size={16} /></div>
                        <div>
                            <div className="small text-muted" style={{ fontSize: '10px' }}>Standardized Value (EUR)</div>
                            <div className="fw-bold">€{formData.cost?.toFixed(2) || '0.00'}</div>
                        </div>
                    </div>
                    <div className="text-end">
                        <div className="small text-muted" style={{ fontSize: '10px' }}>Exchange Rate</div>
                        <div className="small font-monospace">1 {currency} = {exchangeRate.toFixed(4)} EUR</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSoftwareProfileForm_VariantsTab = () => (
        <div className="card p-4">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                <h5 className="mb-0 fw-bold">License Variants / Tiers</h5>
                <button type="button" onClick={addVariant} className="btn btn-sm btn-link text-decoration-none d-flex align-items-center gap-1"><Plus size={16} />Add Variant</button>
            </div>
            <div className="d-grid gap-3">
                {((formData as SoftwareProfile).variants || []).map((variant, index) => (
                    <div key={variant.id} className="row g-2 p-3 bg-light border rounded align-items-end">
                        <div className="col-md-4">
                            <label className="form-label small">Name</label>
                            <input type="text" name="name" value={variant.name} onChange={(e) => handleVariantChange(index, e)} className="form-control form-control-sm" placeholder="e.g. Pro" />
                        </div>
                        <div className="col-md-5">
                            <label className="form-label small">License Type</label>
                            <div className="btn-group w-100" role="group">
                                {Object.values(LicenseType).map(lt => (
                                    <React.Fragment key={lt}>
                                        <input type="radio" className="btn-check" name="licenseType" id={`lt-${variant.id}-${lt}`} value={lt} checked={variant.licenseType === lt} onChange={(e) => handleVariantChange(index, e as any)} />
                                        <label className="btn btn-outline-secondary btn-sm" htmlFor={`lt-${variant.id}-${lt}`} style={{ fontSize: '10px' }}>{lt}</label>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label small">Cost</label>
                            <input type="number" name="cost" value={variant.cost} onChange={(e) => handleVariantChange(index, e)} className="form-control form-control-sm" step="0.01" />
                        </div>
                        <div className="col-md-1 text-end">
                            <button type="button" onClick={() => removeVariant(index)} className="btn btn-sm btn-outline-danger border-0"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
                {((formData as SoftwareProfile).variants || []).length === 0 && <div className="text-center py-4 text-muted bg-light rounded border border-dashed"><small>No variants added. Click "Add Variant".</small></div>}
            </div>
        </div>
    );

    return (
        <div className={`modal fade show d-block bg-dark bg-opacity-50`} tabIndex={-1} role="dialog" onClick={onClose}>
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document" onClick={e => e.stopPropagation()}>
                <div className="modal-content h-100" style={{ maxHeight: '90vh' }}>
                    <form onSubmit={handleSubmit} className="d-flex flex-column h-100">
                        <div className="modal-header">
                            <div>
                                <h5 className="modal-title fw-bold">{modalTitle}</h5>
                                <small className="text-muted font-monospace">{mode === 'instance' ? formData.assetId : (family ? family.id : 'New')}</small>
                            </div>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>

                        {/* Tab Navigation */}
                        {currentTabs.length > 0 && (
                            <div className="px-3 border-bottom">
                                <ul className="nav nav-tabs border-bottom-0">
                                    {currentTabs.map(tab => (
                                        <li className="nav-item" key={tab.id}>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`nav-link ${activeTab === tab.id ? 'active fw-bold' : 'text-muted'}`}
                                            >
                                                {tab.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="modal-body bg-light">
                            {/* Special Logic for Assignment Popup in Edit Mode (Instance) - Only on General Tab */}
                            {isEditMode && mode === 'instance' && activeTab === 'general' && (
                                <div className="card mb-4 shadow-sm position-relative">
                                    <div className="card-body">
                                        {/* Assigned To Section */}
                                        <div className="mb-4">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <small className="fw-bold text-uppercase text-muted">Assigned to</small>
                                                <button type="button" onClick={() => setShowAssignmentPopup(!showAssignmentPopup)} className="btn btn-sm btn-light text-primary" title="Change Assignment">
                                                    <Edit2 size={16} />
                                                </button>
                                            </div>

                                            {(isInstanceSoftware ? formData.assignedUsers : [formData.assignedUser])?.filter((u): u is User => !!u).length ? (
                                                <div className="d-grid gap-2">
                                                    {(isInstanceSoftware ? formData.assignedUsers : [formData.assignedUser])?.filter((u): u is User => !!u).map(u => (
                                                        <div key={u.id} className="d-flex align-items-center justify-content-between bg-light p-2 rounded border">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <img src={u.avatarUrl} alt={u.fullName} className="rounded-circle shadow-sm" style={{ width: 32, height: 32 }} />
                                                                <div>
                                                                    <div className="fw-bold small">{u.fullName}</div>
                                                                    <div className="text-muted" style={{ fontSize: '10px' }}><Calendar size={10} className="me-1" /> Start Date: {getLatestAssignmentDate(u)}</div>
                                                                </div>
                                                            </div>
                                                            <button type="button" className="btn btn-link text-muted p-0" title="Add Note"><MessageSquare size={16} /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-3 text-center text-muted small bg-light rounded border border-dashed">No primary user assigned</div>
                                            )}
                                        </div>

                                        {/* Used By Section */}
                                        <div>
                                            <small className="d-block fw-bold text-uppercase text-muted mb-2">Used By (Active Users)</small>
                                            <div className="p-3 bg-light rounded border">
                                                <UserPicker
                                                    users={allUsers}
                                                    selectedUserIds={formData.activeUsers?.map(u => u.id) || []}
                                                    onChange={handleActiveUsersChange}
                                                    multiple={true}
                                                />
                                            </div>
                                        </div>

                                        {showAssignmentPopup && (
                                            <div className="card position-absolute top-0 end-0 m-2 shadow-lg z-3 border" style={{ width: '300px' }}>
                                                <div className="card-header py-1 px-2 d-flex justify-content-between align-items-center bg-white border-bottom">
                                                    <small className="fw-bold text-muted">Change Assignment</small>
                                                    <button type="button" className="btn-close btn-close-sm" onClick={() => setShowAssignmentPopup(false)}></button>
                                                </div>
                                                <div className="card-body p-2">
                                                    <UserPicker users={allUsers} selectedUserIds={(isInstanceSoftware ? formData.assignedUsers?.map(u => u.id) : [formData.assignedUser?.id])?.filter((id): id is number | string => id !== undefined && id !== null) || []} onChange={handleUserSelectionChange} multiple={isInstanceSoftware} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Dynamic Field Rendering with Sections and Grid */}
                            {currentTabs.map(tab => {
                                if (tab.id !== activeTab) return null;
                                return (
                                    <div key={tab.id} className="d-grid gap-4">
                                        {tab.sections.map(section => (
                                            <section key={section.id} className="card shadow-sm border-0">
                                                <div className="card-header bg-white py-3">
                                                    <h6 className="mb-0 fw-bold">{section.title}</h6>
                                                </div>
                                                <div className="card-body">
                                                    <div className="row g-3">
                                                        {section.fields.map(fieldKey => (
                                                            <div key={fieldKey} className={`col-${12 / (section.columns || 1)}`}>
                                                                {renderField(fieldKey)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </section>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="modal-footer bg-white">
                            <div className="me-auto text-muted" style={{ fontSize: '10px' }}>
                                {asset && (<> <div>Created: {new Date(asset.created).toLocaleDateString()} by {asset.createdBy || 'N/A'}</div> <div>Modified: {new Date(asset.modified).toLocaleDateString()} by {asset.modifiedBy || 'N/A'}</div> </>)}
                            </div>
                            <button type="button" className="btn btn-light border" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary">{buttonTitle}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AssetFormModal;