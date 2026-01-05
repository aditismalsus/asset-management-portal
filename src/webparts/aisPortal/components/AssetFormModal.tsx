
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Plus, Trash2, Search, Check, DollarSign, Clock, Edit2, RefreshCw, Globe, Lock, Unlock, MessageSquare } from 'lucide-react';
import { Asset, User, AssetType, AssetStatus, LicenseType, AssetFamily, SoftwareProfile, LicenseVariant, HardwareProduct, ComplianceStatus, HardwareCondition, Config, TabDefinition, Vendor, AssignmentHistory } from '../types';

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
        <label className="form-label small fw-medium text-secondary mb-2">{label}{required && <span className="text-danger">*</span>}</label>
        <div className="d-flex flex-wrap gap-2">
            {options.map((option) => (
                <React.Fragment key={option.value}>
                    <input type="radio" className="btn-check" name={name} id={`${name}-${option.value}`} value={option.value} checked={value === option.value} onChange={onChange} required={required} autoComplete="off" />
                    <label className={`btn btn-sm rounded-pill ${value === option.value ? 'btn-primary' : 'btn-outline-secondary'}`} htmlFor={`${name}-${option.value}`}>{option.label}</label>
                </React.Fragment>
            ))}
        </div>
    </div>
);

const FormInput: React.FC<{ label: string; name: string; value?: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; required?: boolean; placeholder?: string, step?: string, readOnly?: boolean }> = ({ label, name, value, onChange, type = 'text', required = false, placeholder, step, readOnly = false }) => (
    <div className="mb-3">
        <label htmlFor={name} className="form-label small fw-medium text-secondary mb-1">{label} {required && <span className="text-danger">*</span>}</label>
        <div className="position-relative">
            {type === 'number' && name === 'cost' && <div className="position-absolute top-50 translate-middle-y text-secondary" style={{ left: '0.75rem' }}><DollarSign size={14} /></div>}
            <input type={type} name={name} id={name} value={value || ''} onChange={onChange} required={required} placeholder={placeholder} step={step} readOnly={readOnly} className={`form-control form-control-sm ${readOnly ? 'bg-light cursor-not-allowed' : ''} ${type === 'number' && name === 'cost' ? 'ps-4' : ''}`} style={type === 'number' && name === 'cost' ? { paddingLeft: '2rem' } : {}} />
        </div>
    </div>
);

const FormSelect: React.FC<{ label: string; name: string; value?: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; required?: boolean; children: React.ReactNode; }> = ({ label, name, value, onChange, required = false, children }) => (
    <div className="mb-3">
        <label htmlFor={name} className="form-label small fw-medium text-secondary mb-1">{label} {required && <span className="text-danger">*</span>}</label>
        <select name={name} id={name} value={value || ''} onChange={onChange} required={required} className="form-select form-select-sm">{children}</select>
    </div>
);

const FormDateInput: React.FC<{ label: string; name: string; value?: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean; children?: React.ReactNode }> = ({ label, name, value, onChange, required = false, children }) => (
    <div className="mb-3 position-relative">
        <label htmlFor={name} className="form-label small fw-medium text-secondary mb-1">{label} {required && <span className="text-danger">*</span>}</label>
        <div className="position-relative d-flex align-items-center gap-2">
            <div className="position-relative flex-grow-1">
                <input type="date" name={name} id={name} value={value || ''} onChange={onChange} required={required} className="form-control form-control-sm" />
                {/* Calendar icon might be redundant with native date picker, keeping it as decorative if needed or rely on browser */}
                <Calendar className="position-absolute top-50 translate-middle-y text-secondary pe-none" style={{ right: '2rem', width: '1rem', height: '1rem', display: 'none' }} />
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
            {label && <label className="form-label small fw-medium text-secondary mb-1">{label}</label>}
            {/* Selected Pills */}
            <div className="d-flex flex-wrap gap-2 mb-2">
                {selectedUsers.map(u => (
                    <div key={u.id} className="d-flex align-items-center gap-1 bg-primary-subtle text-primary px-2 py-1 rounded-pill small border border-primary-subtle">
                        <img src={u.avatarUrl} className="rounded-circle" style={{ width: '1rem', height: '1rem' }} />
                        <span>{u.fullName}</span>
                        <button type="button" onClick={() => handleSelect(u.id)} className="btn btn-link p-0 text-primary hover-text-dark lh-1"><X size={14} /></button>
                    </div>
                ))}
                <button type="button" onClick={() => setIsOpen(!isOpen)} className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 py-0 px-2 rounded-pill small">
                    <Plus size={14} /> {selectedUsers.length > 0 ? 'Add More' : 'Select User'}
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="card shadow-lg position-absolute z-3 start-0 w-100 border-0" style={{ maxWidth: '24rem' }}>
                    <div className="card-header bg-light border-bottom p-2 position-relative">
                        <Search className="position-absolute top-50 translate-middle-y text-secondary" style={{ left: '1rem', width: '1rem', height: '1rem' }} />
                        <input type="text" autoFocus value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search users..." className="form-control form-control-sm ps-5 bg-white" />
                        <button type="button" onClick={() => setIsOpen(false)} className="position-absolute top-50 end-0 translate-middle-y btn btn-link text-secondary p-0 me-2"><X size={16} /></button>
                    </div>
                    <div className="list-group list-group-flush overflow-y-auto" style={{ maxHeight: '15rem' }}>
                        {filteredUsers.map(user => {
                            const isSelected = selectedUserIds.includes(user.id);
                            return (
                                <button key={user.id} onClick={() => handleSelect(user.id)} className={`list-group-item list-group-item-action border-0 d-flex align-items-center gap-3 p-2 ${isSelected ? 'bg-primary-subtle' : ''}`}>
                                    <div className="position-relative flex-shrink-0">
                                        <img src={user.avatarUrl} alt={user.fullName} className="rounded-circle" style={{ width: '2rem', height: '2rem' }} />
                                        {isSelected && <div className="position-absolute top-0 end-0 bg-primary rounded-circle border border-white d-flex align-items-center justify-content-center" style={{ width: '0.75rem', height: '0.75rem' }}><Check size={8} className="text-white" /></div>}
                                    </div>
                                    <div className="text-truncate">
                                        <p className={`mb-0 small fw-medium text-truncate ${isSelected ? 'text-primary' : 'text-dark'}`}>{user.fullName}</p>
                                        <p className="mb-0 text-secondary text-truncate" style={{ fontSize: '0.75rem' }}>{user.email}</p>
                                    </div>
                                </button>
                            );
                        })}
                        {filteredUsers.length === 0 && <div className="p-4 text-center small text-secondary fst-italic">No users found.</div>}
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
                    // Aggregate history from all users for this specific asset
                    const aggregatedHistory: AssignmentHistory[] = [];
                    allUsers.forEach(u => {
                        if (u.history && Array.isArray(u.history)) {
                            u.history.forEach((h: any) => {
                                if (h.assetId === asset.assetId) {
                                    aggregatedHistory.push({ ...h, id: h.id || `hist-${Date.now()}-${Math.random()}` });
                                }
                            });
                        }
                    });

                    // Add Asset's specific maintenance history (Usage updates)
                    if (asset.maintenanceHistory && Array.isArray(asset.maintenanceHistory)) {
                        asset.maintenanceHistory.forEach((m: any, idx: number) => {
                            aggregatedHistory.push({
                                id: m.id || `hist-maint-${asset.id}-${idx}`,
                                assetId: asset.assetId,
                                assetName: asset.title,
                                date: m.date,
                                type: 'Usage Update',
                                notes: m.notes,
                                assignedTo: 'System/Maintenance'
                            });
                        });
                    }

                    setFormData({
                        ...asset,
                        purchaseDate: formatDateForInput(asset.purchaseDate),
                        expiryDate: formatDateForInput(asset.expiryDate),
                        warrantyExpiryDate: formatDateForInput(asset.warrantyExpiryDate),
                        assignmentHistory: aggregatedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
        setFormData(prev => ({ ...prev, expiryDate: formatDateForInput(newDate.toISOString()) }));
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
        // Find latest event where assignedTo includes user name
        const assignedEvents = history.filter(h =>
            (h.type === 'Assigned' || h.type === 'Reassigned') &&
            h.assignedTo?.includes(user.fullName)
        );
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
            case 'description': return <div className="mb-3"><label className="form-label small fw-medium text-secondary mb-1">Description</label><textarea name="description" value={(formData as any).description || ''} onChange={handleChange} rows={3} className="form-control form-control-sm" placeholder="Details..."></textarea></div>;
            case 'variants': return renderSoftwareProfileForm_VariantsTab();
            case 'assignmentModel': return <FormRadioGroup label="Assignment Model" name="assignmentModel" value={(formData as AssetFamily).assignmentModel} onChange={handleChange as any} required options={[{ value: 'Single', label: 'Single User' }, { value: 'Multiple', label: 'Multiple Users' }]} />;

            case 'title': return <FormInput label="Title" name="title" value={formData.title} onChange={handleChange} required />;

            case 'assetId': return (
                <div className="mb-3">
                    <label htmlFor="assetId" className="form-label small fw-medium text-secondary mb-1">Asset ID</label>
                    <div className="d-flex gap-2">
                        <input
                            type="text"
                            name="assetId"
                            value={formData.assetId}
                            onChange={handleChange}
                            readOnly={isAssetIdLocked}
                            className={`form-control form-control-sm ${isAssetIdLocked ? 'bg-light text-secondary cursor-not-allowed' : ''}`}
                        />
                        <button
                            type="button"
                            onClick={() => setIsAssetIdLocked(!isAssetIdLocked)}
                            className={`btn btn-sm border ${isAssetIdLocked ? 'btn-light invalid-border-match text-secondary' : 'btn-danger-subtle text-danger border-danger-subtle'}`}
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

            // Unified assignment logic - Use Modal Controls instead of inline if preferred, or keep inline for flexibility
            case 'assignedUsers':
            case 'assignedUser':
                const assignmentModel = family?.assignmentModel || (assetType === AssetType.LICENSE ? 'Multiple' : 'Single');
                const currentIds = assignmentModel === 'Multiple'
                    ? formData.assignedUsers?.map(u => u.id) || []
                    : formData.assignedUser ? [formData.assignedUser.id] : [];

                return (
                    <div>
                        <p className="text-sm text-slate-500 mb-2">Select {assignmentModel === 'Multiple' ? 'assigned users' : 'primary user'}.</p>
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
                    <p className="small text-secondary mb-2">Active users of this asset.</p>
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
            case 'expiryDate': return <FormDateInput label="Expiry Date" name="expiryDate" value={formatDateForInput(formData.expiryDate)} onChange={handleChange}><div className="d-flex gap-1 ms-2"><button type="button" onClick={() => setRenewalPeriod(1)} className="btn btn-sm btn-outline-primary py-0 px-2 small whitespace-nowrap" style={{ fontSize: '0.75rem' }}>+1 M</button><button type="button" onClick={() => setRenewalPeriod(12)} className="btn btn-sm btn-outline-primary py-0 px-2 small whitespace-nowrap" style={{ fontSize: '0.75rem' }}>+1 Y</button></div></FormDateInput>;
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
                    <div className="d-flex flex-column gap-4">
                        {/* Assignment Log */}
                        <div>
                            <h6 className="fw-semibold text-dark mb-3 d-flex align-items-center gap-2"><Clock size={16} /> Assignment Log</h6>
                            <div className="card border shadow-sm overflow-hidden">
                                <div className="table-responsive">
                                    <table className="table table-sm table-striped mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="px-3 py-2 small fw-semibold text-secondary text-uppercase">Start Date</th>
                                                <th className="px-3 py-2 small fw-semibold text-secondary text-uppercase">End Date</th>
                                                <th className="px-3 py-2 small fw-semibold text-secondary text-uppercase">User / Action</th>
                                                <th className="px-3 py-2 small fw-semibold text-secondary text-uppercase">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assignmentLog.length > 0 ? assignmentLog.map((h, i) => (
                                                <tr key={i}>
                                                    <td className="px-3 py-2 small text-dark whitespace-nowrap">{h.date}</td>
                                                    <td className="px-3 py-2 small text-secondary whitespace-nowrap">{getEndDate(i, assignmentLog)}</td>
                                                    <td className="px-3 py-2 small">
                                                        <span className={`badge rounded-pill me-2 ${h.type === 'Reassigned' ? 'bg-warning-subtle text-warning-emphasis' : 'bg-primary-subtle text-primary-emphasis'}`}>
                                                            {h.type}
                                                        </span>
                                                        <span className="fw-medium text-dark">{h.assignedTo || h.assignedFrom || '-'}</span>
                                                    </td>
                                                    <td className="px-3 py-2 small text-secondary">{h.notes}</td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={4} className="px-3 py-4 text-center small text-secondary fst-italic">No assignment history.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Usage Log */}
                        <div>
                            <h6 className="fw-semibold text-dark mb-3 d-flex align-items-center gap-2"><RefreshCw size={16} /> Usage Log</h6>
                            <div className="card border shadow-sm overflow-hidden">
                                <div className="table-responsive">
                                    <table className="table table-sm table-striped mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="px-3 py-2 small fw-semibold text-secondary text-uppercase">Date</th>
                                                <th className="px-3 py-2 small fw-semibold text-secondary text-uppercase">Action</th>
                                                <th className="px-3 py-2 small fw-semibold text-secondary text-uppercase">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usageLog.length > 0 ? usageLog.map((h, i) => (
                                                <tr key={i}>
                                                    <td className="px-3 py-2 small text-dark whitespace-nowrap">{h.date}</td>
                                                    <td className="px-3 py-2 small">
                                                        <span className="badge rounded-pill bg-info-subtle text-info-emphasis">Update</span>
                                                    </td>
                                                    <td className="px-3 py-2 small text-secondary">{h.notes}</td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={3} className="px-3 py-4 text-center small text-secondary fst-italic">No usage updates recorded.</td></tr>
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
            <label className="form-label small fw-medium text-secondary mb-2">Currency Calculation Tool</label>
            <div className="bg-light p-3 rounded border">
                <div className="row g-3 mb-3">
                    <div className="col-6">
                        <label className="form-label small fw-medium text-secondary mb-1">Currency</label>
                        <div className="input-group input-group-sm">
                            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="form-select">
                                {availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <button type="button" onClick={handleAddCurrency} className="btn btn-outline-secondary" title="Add Currency">+</button>
                        </div>
                    </div>
                    <div className="col-6">
                        <label className="form-label small fw-medium text-secondary mb-1">Original Value</label>
                        <input type="number" value={originalCost} onChange={(e) => setOriginalCost(e.target.value)} className="form-control form-control-sm" placeholder="0.00" step="0.01" />
                    </div>
                </div>
                <div className="d-flex align-items-center justify-content-between bg-white p-3 rounded border shadow-sm">
                    <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary-subtle text-primary p-2 rounded-circle"><Globe size={16} /></div>
                        <div>
                            <p className="small text-secondary mb-0">Standardized Value (EUR)</p>
                            <p className="h5 fw-bold text-dark mb-0">€{formData.cost?.toFixed(2) || '0.00'}</p>
                        </div>
                    </div>
                    <div className="text-end">
                        <p className="small text-secondary mb-0" style={{ fontSize: '0.75rem' }}>Exchange Rate used</p>
                        <p className="small font-monospace text-dark mb-0">1 {currency} = {exchangeRate.toFixed(4)} EUR</p>
                    </div>
                </div>
            </div>
        </div>
    );


    const renderSoftwareProfileForm_VariantsTab = () => (
        <div className="bg-white p-4 rounded border shadow-sm">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                <h5 className="fw-semibold text-dark m-0">License Variants / Tiers</h5>
                <button type="button" onClick={addVariant} className="btn btn-sm btn-link text-decoration-none d-flex align-items-center gap-1"><Plus size={16} />Add Variant</button>
            </div>
            <div className="d-flex flex-column gap-3">
                {((formData as SoftwareProfile).variants || []).map((variant, index) => (
                    <div key={variant.id} className="row g-2 align-items-end p-3 bg-light rounded border">
                        <div className="col-12 col-md-4"><FormInput label="Variant Name" name="name" value={variant.name} onChange={(e) => handleVariantChange(index, e)} placeholder="e.g. Pro" /></div>
                        <div className="col-12 col-md-5">
                            <FormRadioGroup label="License Type" name="licenseType" value={variant.licenseType} onChange={(e) => handleVariantChange(index, e)}
                                options={Object.values(LicenseType).map(lt => ({ value: lt, label: lt }))} />
                        </div>
                        <div className="col-12 col-md-2"><FormInput label="Cost" name="cost" value={variant.cost} onChange={(e) => handleVariantChange(index, e)} type="number" step="0.01" /></div>
                        <div className="col-12 col-md-1 d-flex justify-content-md-end pb-2">
                            <button type="button" onClick={() => removeVariant(index)} className="btn btn-sm btn-outline-danger rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '2rem', height: '2rem' }}><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
                {((formData as SoftwareProfile).variants || []).length === 0 && <div className="text-center py-5 text-secondary bg-light rounded border border-dashed"><p className="mb-0">No variants added. Click "Add Variant" to define license tiers.</p></div>}
            </div>
        </div>
    );


    return (
        <>
            <div className="modal-backdrop fade show"></div>
            <div className={`modal fade show d-block ${isOpen ? '' : 'd-none'}`} tabIndex={-1} onClick={onClose}>
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
                    <form onSubmit={handleSubmit} className="modal-content shadow-lg h-100">
                        <div className="modal-header border-bottom bg-white">
                            <div>
                                <h5 className="modal-title fw-bold text-dark">{modalTitle}</h5>
                                <p className="small text-secondary mb-0 font-monospace">{mode === 'instance' ? formData.assetId : (family ? family.id : 'New')}</p>
                            </div>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>

                        {/* Tab Navigation */}
                        {currentTabs.length > 0 && (
                            <div className="px-4 border-bottom bg-white">
                                <ul className="nav nav-tabs border-bottom-0">
                                    {currentTabs.map(tab => (
                                        <li className="nav-item" key={tab.id}>
                                            <button type="button" onClick={() => setActiveTab(tab.id)} className={`nav-link border-0 py-3 ${activeTab === tab.id ? 'active fw-medium text-primary border-bottom border-primary border-2' : 'text-secondary hover-text-dark'}`} style={{ marginBottom: '-1px' }}>
                                                {tab.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Main Content Area */}
                        <div className="modal-body bg-light">
                            {/* Special Logic for Assignment Popup in Edit Mode (Instance) - Only on General Tab */}
                            {isEditMode && mode === 'instance' && activeTab === 'general' && (
                                <div className="mb-4 bg-white p-4 rounded border shadow-sm position-relative">
                                    {/* Assigned To Section */}
                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="small fw-bold text-dark text-uppercase letter-spacing-1 mb-0">Assigned to</h6>
                                            <button type="button" onClick={() => setShowAssignmentPopup(!showAssignmentPopup)} className="btn btn-sm btn-link text-decoration-none" title="Change Assignment">
                                                <Edit2 size={16} /> Edit
                                            </button>
                                        </div>

                                        {(isInstanceSoftware ? formData.assignedUsers : [formData.assignedUser])?.filter(Boolean).length ? (
                                            <div className="d-flex flex-column gap-2">
                                                {(isInstanceSoftware ? formData.assignedUsers : [formData.assignedUser])?.filter(Boolean).map((u: User) => (
                                                    <div key={u.id} className="d-flex align-items-center justify-content-between bg-light p-2 rounded border">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <img src={u.avatarUrl} alt={u.fullName} className="rounded-circle" style={{ width: '2rem', height: '2rem' }} />
                                                            <div>
                                                                <p className="mb-0 small fw-bold text-dark">{u.fullName}</p>
                                                                <p className="mb-0 text-secondary d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                                                                    <Calendar size={10} /> Start Date: {getLatestAssignmentDate(u)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button type="button" className="btn btn-link text-secondary p-2" title="Add Note/Comment">
                                                            <MessageSquare size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-3 text-center text-secondary fst-italic bg-light rounded border border-dashed">
                                                No primary user assigned
                                            </div>
                                        )}
                                    </div>

                                    {/* Used By Section */}
                                    <div>
                                        <h6 className="small fw-bold text-dark text-uppercase letter-spacing-1 mb-3">Used By (Active Users)</h6>
                                        <div className="bg-light p-3 rounded border">
                                            <UserPicker
                                                users={allUsers}
                                                selectedUserIds={formData.activeUsers?.map(u => u.id) || []}
                                                onChange={handleActiveUsersChange}
                                                multiple={true}
                                            />
                                        </div>
                                    </div>

                                    {showAssignmentPopup && (
                                        <div className="card shadow-lg position-absolute end-0 top-0 mt-5 me-4" style={{ width: '20rem', zIndex: 1050 }}>
                                            <div className="card-header bg-white border-bottom p-2 d-flex justify-content-between align-items-center">
                                                <h6 className="small fw-bold text-secondary text-uppercase mb-0">Change Assignment</h6>
                                                <button onClick={() => setShowAssignmentPopup(false)} className="btn btn-sm btn-link text-secondary p-0"><X size={14} /></button>
                                            </div>
                                            <div className="card-body p-2">
                                                <UserPicker users={allUsers} selectedUserIds={(isInstanceSoftware ? formData.assignedUsers?.map(u => u.id) : [formData.assignedUser?.id])?.filter(Boolean) as (string | number)[] || []} onChange={handleUserSelectionChange} multiple={isInstanceSoftware} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Dynamic Field Rendering with Sections and Grid */}
                            {currentTabs.map(tab => {
                                if (tab.id !== activeTab) return null;
                                return (
                                    <div key={tab.id} className="d-flex flex-column gap-4">
                                        {tab.sections.map(section => (
                                            <section key={section.id} className="bg-white p-4 rounded border shadow-sm">
                                                <div className="border-bottom pb-2 mb-4">
                                                    <h5 className="fw-semibold text-dark m-0">{section.title}</h5>
                                                </div>
                                                <div className={`row g-3 row-cols-1 row-cols-md-${section.columns || 1}`}>
                                                    {section.fields.map(fieldKey => (
                                                        <div key={fieldKey} className="col">
                                                            {renderField(fieldKey)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="modal-footer bg-white border-top">
                            <div className="me-auto small text-secondary">
                                {asset && (<div className="d-flex gap-3"> <span>Created: {new Date(asset.created).toLocaleDateString()} by {asset.createdBy || 'N/A'}</span> <span>Modified: {new Date(asset.modified).toLocaleDateString()} by {asset.modifiedBy || 'N/A'}</span> </div>)}
                            </div>
                            <button type="button" onClick={onClose} className="btn btn-light border text-secondary fw-medium">Cancel</button>
                            <button type="submit" className="btn btn-primary fw-medium">{buttonTitle}</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default AssetFormModal;
