
import React, { useState } from 'react';
import { Plus, Database, List, Hash, Upload, Download, Edit2, ExternalLink, Sliders, RefreshCw, Trash2, Wrench, BarChart3 } from 'lucide-react';
import { Asset, User, AssetFamily, Config, IdSection, IdSectionType, Vendor, Site, Department } from '../types';
import DataImportModal, { ImportType } from './DataImportModal';
import DataTable from './DataTable';
import ModalSettingsEditor from './ModalSettingsEditor';
import { addVendor, deleteVendor, addSite, deleteSite, addDepartment, deleteDepartment } from '../services/SPService';

interface AdminDashboardProps {
    config: Config;
    onUpdateConfig: (newConfig: Config) => void;
    users: User[];
    assets: Asset[];
    families: AssetFamily[];
    vendors: Vendor[];

    onUpdateVendors: (vendors: Vendor[]) => void;
    sites: Site[];
    onUpdateSites: (sites: Site[]) => void;
    departments: Department[];
    onUpdateDepartments: (departments: Department[]) => void;
    onImportData?: (type: ImportType, data: any[]) => void;
    onNavigateToFamily?: (family: AssetFamily) => void;
    onEditFamily?: (family: AssetFamily) => void;
    onAddFamily?: () => void;
}

const DEFAULT_ID_CONFIG: IdSection[] = [
    { id: 'def-1', type: 'attribute', value: 'prefix', label: 'Prefix', length: 4, uppercase: true },
    { id: 'def-3', type: 'attribute', value: 'productCode', label: 'Product Code', length: 4, uppercase: true },
    { id: 'def-5', type: 'attribute', value: 'version', label: 'Version Code', length: 3, uppercase: true },
    { id: 'def-7', type: 'sequence', value: 'sequence', label: 'Sequence', length: 4, paddingChar: '0' },
];

const IdConfigEditor: React.FC<{ config: Config, onUpdateConfig: (newConfig: Config) => void }> = ({ config, onUpdateConfig }) => {
    const sections = config.idConfiguration || DEFAULT_ID_CONFIG;
    const globalSeparator = config.idSeparator || '-';
    // const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

    const updateSection = (id: string, updates: Partial<IdSection>) => {
        const newSections = sections.map(s => s.id === id ? { ...s, ...updates } : s);
        onUpdateConfig({ ...config, idConfiguration: newSections });
    };
    const updateSeparator = (separator: string) => {
        onUpdateConfig({ ...config, idSeparator: separator });
    };
    const addSection = (type: IdSectionType, value: string, label: string) => {
        const newSection: IdSection = {
            id: `sec-${Date.now()}`,
            type,
            value,
            label,
            length: type === 'static' ? undefined : 4,
            uppercase: true,
            paddingChar: type === 'sequence' ? '0' : undefined
        };
        onUpdateConfig({ ...config, idConfiguration: [...sections, newSection] });
        // setIsAddMenuOpen(false);
    };
    const removeSection = (id: string) => {
        onUpdateConfig({ ...config, idConfiguration: sections.filter(s => s.id !== id) });
    };
    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newSections = [...sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < newSections.length) {
            [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
            onUpdateConfig({ ...config, idConfiguration: newSections });
        }
    };
    const resetToDefault = () => {
        if (confirm("Are you sure you want to reset to the default ID configuration?")) {
            onUpdateConfig({ ...config, idConfiguration: DEFAULT_ID_CONFIG, idSeparator: '-' });
        }
    };
    const previewId = sections.map(section => {
        let val = '';
        switch (section.type) {
            case 'static': val = section.value; break;
            case 'attribute': val = 'ATTR'; break;
            case 'sequence': val = '0012'; break;
            case 'date': val = '2025'; break;
        }
        return val;
    }).join(globalSeparator);

    return (
        <div className="card shadow-sm border">
            <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-semibold text-dark m-0">ID Configuration</h5>
                    <button onClick={resetToDefault} className="btn btn-sm btn-link text-decoration-none text-secondary d-flex align-items-center gap-1"><RefreshCw size={14} /> Reset</button>
                </div>
                <div className="mb-4 d-flex gap-3 align-items-center">
                    <label className="small fw-medium">Separator:</label>
                    <select value={globalSeparator} onChange={(e) => updateSeparator(e.target.value)} className="form-select form-select-sm w-auto"><option value="-">-</option><option value="_">_</option><option value="/">/</option></select>
                    <div className="small bg-light px-3 py-1 rounded border">Preview: <span className="font-monospace fw-bold">{previewId}</span></div>
                </div>
                <div className="d-flex flex-column gap-2 mb-4">
                    {sections.map((section, index) => (
                        <div key={section.id} className="d-flex align-items-center gap-3 p-2 border rounded bg-white">
                            <span className="small fw-bold text-secondary text-uppercase" style={{ width: '4rem' }}>{section.type}</span>
                            <input value={section.label} onChange={(e) => updateSection(section.id, { label: e.target.value })} className="form-control form-control-sm border-0 border-bottom rounded-0 px-0 shadow-none fw-medium" style={{ maxWidth: '200px' }} />
                            <div className="flex-grow-1"></div>
                            <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="btn btn-sm btn-link text-secondary p-0"><span style={{ fontSize: '1.2rem', lineHeight: 1 }}>↑</span></button>
                            <button onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1} className="btn btn-sm btn-link text-secondary p-0"><span style={{ fontSize: '1.2rem', lineHeight: 1 }}>↓</span></button>
                            <button onClick={() => removeSection(section.id)} className="btn btn-sm btn-link text-danger p-0"><Trash2 size={14} /></button>
                        </div>
                    ))}
                </div>
                <button onClick={() => addSection('static', 'FIX', 'Fixed Text')} className="btn btn-link p-0 text-decoration-none text-primary d-flex align-items-center gap-1 small fw-medium"><Plus size={14} /> Add Section</button>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ config, onUpdateConfig, users, assets, families, vendors, onUpdateVendors, sites, onUpdateSites, departments, onUpdateDepartments, onImportData, onNavigateToFamily, onEditFamily, onAddFamily }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'picklists' | 'ids' | 'data' | 'modals' | 'reports'>('picklists');
    const [metadataSubTab, setMetadataSubTab] = useState<'types' | 'products' | 'sites' | 'departments' | 'vendors'>('types');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [newVendor, setNewVendor] = useState<Partial<Vendor>>({});

    // Helpers for simple lists
    // const handleAddSimpleItem = (key: keyof Config, item: string) => {
    //     if (Array.isArray(config[key]) && !(config[key] as string[]).includes(item)) {
    //         onUpdateConfig({ ...config, [key]: [...(config[key] as string[]), item] });
    //     }
    // };
    // const handleRemoveSimpleItem = (key: keyof Config, item: string) => {
    //     if (Array.isArray(config[key])) {
    //         onUpdateConfig({ ...config, [key]: (config[key] as string[]).filter(i => i !== item) });
    //     }
    // };

    const handleAddVendor = () => {
        setNewVendor({});
        setIsVendorModalOpen(true);
    };

    const handleSaveVendor = async () => {
        if (!newVendor.name) {
            alert("Vendor Name is required");
            return;
        }
        try {
            const added = await addVendor(newVendor as Vendor);
            onUpdateVendors([...vendors, added]);
            setIsVendorModalOpen(false);
            setNewVendor({});
        } catch (e) {
            console.error(e);
            alert("Error adding vendor");
        }
    };

    const handleDeleteVendor = async (id: string) => {
        if (confirm("Delete this vendor?")) {
            try {
                await deleteVendor(id);
                onUpdateVendors(vendors.filter(v => v.id !== id));
            } catch (e) {
                console.error(e);
                alert("Error deleting vendor");
            }
        }
    };

    const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
    const [newSiteName, setNewSiteName] = useState('');

    const handleAddSite = () => {
        setNewSiteName('');
        setIsSiteModalOpen(true);
    };

    const handleSaveSite = async () => {
        if (!newSiteName) return;
        try {
            const added = await addSite(newSiteName);
            onUpdateSites([...sites, added]);
            setIsSiteModalOpen(false);
            setNewSiteName('');
        } catch (e) {
            alert("Error adding site");
        }
    };

    const handleDeleteSite = async (id: string) => {
        if (confirm("Delete this site?")) {
            try {
                await deleteSite(id);
                onUpdateSites(sites.filter(s => s.id !== id));
            } catch (e) {
                alert("Error deleting site");
            }
        }
    };

    const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
    const [newDepartmentName, setNewDepartmentName] = useState('');

    const handleAddDepartment = () => {
        setNewDepartmentName('');
        setIsDepartmentModalOpen(true);
    };

    const handleSaveDepartment = async () => {
        if (!newDepartmentName) return;
        try {
            const added = await addDepartment(newDepartmentName);
            onUpdateDepartments([...departments, added]);
            setIsDepartmentModalOpen(false);
            setNewDepartmentName('');
        } catch (e) {
            alert("Error adding department");
        }
    };

    const handleDeleteDepartment = async (id: string) => {
        if (confirm("Delete this department?")) {
            try {
                await deleteDepartment(id);
                onUpdateDepartments(departments.filter(d => d.id !== id));
            } catch (e) {
                alert("Error deleting department");
            }
        }
    };

    const [selectedTypeForCategories, setSelectedTypeForCategories] = useState<string | null>(null);

    const handleAddCategory = (type: string) => {
        const categoryName = prompt(`Enter new ${type} Category name:`);
        if (!categoryName) return;

        if (type === 'License') {
            const current = config.softwareCategories || [];
            if (!current.includes(categoryName)) {
                onUpdateConfig({ ...config, softwareCategories: [...current, categoryName] });
            }
        } else if (type === 'Hardware') {
            const current = config.hardwareCategories || [];
            if (!current.includes(categoryName)) {
                onUpdateConfig({ ...config, hardwareCategories: [...current, categoryName] });
            }
        }
    };

    const handleEditCategory = (type: string, oldName: string) => {
        const newName = prompt(`Edit ${type} Category name:`, oldName);
        if (!newName || newName === oldName) return;

        if (type === 'License') {
            const current = config.softwareCategories || [];
            if (current.includes(newName)) {
                alert('Category name already exists.');
                return;
            }
            onUpdateConfig({ ...config, softwareCategories: current.map(c => c === oldName ? newName : c) });
        } else if (type === 'Hardware') {
            const current = config.hardwareCategories || [];
            if (current.includes(newName)) {
                alert('Category name already exists.');
                return;
            }
            onUpdateConfig({ ...config, hardwareCategories: current.map(c => c === oldName ? newName : c) });
        }
    };

    const handleDeleteCategory = (type: string, categoryName: string) => {
        if (!confirm(`Delete category "${categoryName}"?`)) return;

        if (type === 'License') {
            onUpdateConfig({ ...config, softwareCategories: (config.softwareCategories || []).filter(c => c !== categoryName) });
        } else if (type === 'Hardware') {
            onUpdateConfig({ ...config, hardwareCategories: (config.hardwareCategories || []).filter(c => c !== categoryName) });
        }
    };

    // --- Data Transformation for DataTables ---
    // const siteData = config.sites.map(s => ({ id: s, name: s }));
    // const deptData = config.departments.map(d => ({ id: d, name: d }));
    const assetTypesData = config.assetTypes || [];

    const downloadData = () => {
        const data = { generatedAt: new Date().toISOString(), users, assets, families, vendors, config };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `backup.json`; a.click();
    };

    return (
        <div className="d-flex flex-column gap-4">
            <div className="card shadow-sm border p-2 d-inline-flex flex-row gap-2 flex-wrap bg-white">
                <button onClick={() => setActiveTab('general')} className={`btn btn-sm fw-medium d-flex align-items-center gap-2 ${activeTab === 'general' ? 'btn-primary-subtle text-primary' : 'btn-light text-secondary'}`}><Wrench size={18} /> General Settings</button>
                <button onClick={() => setActiveTab('picklists')} className={`btn btn-sm fw-medium d-flex align-items-center gap-2 ${activeTab === 'picklists' ? 'btn-primary-subtle text-primary' : 'btn-light text-secondary'}`}><List size={18} /> Metadata Lists</button>
                <button onClick={() => setActiveTab('ids')} className={`btn btn-sm fw-medium d-flex align-items-center gap-2 ${activeTab === 'ids' ? 'btn-primary-subtle text-primary' : 'btn-light text-secondary'}`}><Hash size={18} /> ID Configuration</button>
                <button onClick={() => setActiveTab('modals')} className={`btn btn-sm fw-medium d-flex align-items-center gap-2 ${activeTab === 'modals' ? 'btn-primary-subtle text-primary' : 'btn-light text-secondary'}`}><Sliders size={18} /> Modal Settings</button>
                <button onClick={() => setActiveTab('data')} className={`btn btn-sm fw-medium d-flex align-items-center gap-2 ${activeTab === 'data' ? 'btn-primary-subtle text-primary' : 'btn-light text-secondary'}`}><Database size={18} /> Database Management</button>
                <button onClick={() => setActiveTab('reports')} className={`btn btn-sm fw-medium d-flex align-items-center gap-2 ${activeTab === 'reports' ? 'btn-primary-subtle text-primary' : 'btn-light text-secondary'}`}><BarChart3 size={18} /> Reports & Analytics</button>
            </div>

            {activeTab === 'general' && (
                <div className="card shadow-sm border" style={{ maxWidth: '48rem' }}>
                    <div className="card-body p-4">
                        <h5 className="card-title fw-bold text-dark mb-4">General System Settings</h5>
                        <div className="d-flex flex-column gap-3">
                            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                                <div>
                                    <h6 className="fw-medium text-dark mb-1">Default License Assignment Model</h6>
                                    <p className="small text-secondary mb-0">Choose default behavior when creating new license products.</p>
                                </div>
                                <select className="form-select form-select-sm w-auto">
                                    <option value="Multiple">Multiple Users (Shared)</option>
                                    <option value="Single">Single User</option>
                                </select>
                            </div>
                            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                                <div>
                                    <h6 className="fw-medium text-dark mb-1">Default Hardware Assignment Model</h6>
                                    <p className="small text-secondary mb-0">Choose default behavior when creating new hardware products.</p>
                                </div>
                                <select className="form-select form-select-sm w-auto">
                                    <option value="Single">Single User</option>
                                    <option value="Multiple">Multiple Users (Shared)</option>
                                </select>
                            </div>
                            <div className="d-flex justify-content-between align-items-center py-3">
                                <div>
                                    <h6 className="fw-medium text-dark mb-1">Enable Usage Tracking</h6>
                                    <p className="small text-secondary mb-0">Track active users for all assets regardless of assignment.</p>
                                </div>
                                <div className="form-check form-switch">
                                    <input type="checkbox" className="form-check-input" checked readOnly />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'picklists' && (
                <div className="card shadow-sm border overflow-hidden d-flex flex-column" style={{ height: '700px' }}>
                    <div className="card-header bg-light border-bottom px-4">
                        <ul className="nav nav-underline card-header-tabs flex-nowrap overflow-x-auto">
                            <li className="nav-item"><button onClick={() => setMetadataSubTab('types')} className={`nav-link small fw-medium text-nowrap ${metadataSubTab === 'types' ? 'active text-primary' : 'text-secondary'}`}>Asset Types</button></li>
                            <li className="nav-item"><button onClick={() => setMetadataSubTab('products')} className={`nav-link small fw-medium text-nowrap ${metadataSubTab === 'products' ? 'active text-primary' : 'text-secondary'}`}>Products</button></li>
                            <li className="nav-item"><button onClick={() => setMetadataSubTab('vendors')} className={`nav-link small fw-medium text-nowrap ${metadataSubTab === 'vendors' ? 'active text-primary' : 'text-secondary'}`}>Vendors</button></li>
                            <li className="nav-item"><button onClick={() => setMetadataSubTab('sites')} className={`nav-link small fw-medium text-nowrap ${metadataSubTab === 'sites' ? 'active text-primary' : 'text-secondary'}`}>Sites</button></li>
                            <li className="nav-item"><button onClick={() => setMetadataSubTab('departments')} className={`nav-link small fw-medium text-nowrap ${metadataSubTab === 'departments' ? 'active text-primary' : 'text-secondary'}`}>Departments</button></li>
                        </ul>
                    </div>

                    <div className="card-body p-4 flex-grow-1 overflow-hidden d-flex flex-column">
                        {metadataSubTab === 'types' && (
                            <div>
                                {!selectedTypeForCategories ? (
                                    <DataTable
                                        columns={[
                                            {
                                                accessorKey: 'name', header: 'Type Name', cell: ({ row }) => {
                                                    const name = (row.original as any).name;
                                                    if (name === 'License' || name === 'Hardware') {
                                                        return (
                                                            <button onClick={() => setSelectedTypeForCategories(name)} className="btn btn-link p-0 text-primary fw-medium text-decoration-none d-flex align-items-center gap-2">
                                                                {name}
                                                                <ExternalLink size={12} />
                                                            </button>
                                                        );
                                                    }
                                                    return <span className="text-dark">{name}</span>;
                                                }
                                            },
                                            { accessorKey: 'prefix', header: 'ID Prefix' }
                                        ]}
                                        data={assetTypesData}
                                        addButton={<button className="btn btn-sm btn-primary shadow-sm" onClick={() => prompt('Feature not implemented in mock')}>+ Add Type</button>}
                                    />
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <button onClick={() => setSelectedTypeForCategories(null)} className="btn btn-link p-0 text-secondary text-decoration-none">Asset Types</button>
                                            <span className="text-muted">/</span>
                                            <span className="fw-bold text-dark">{selectedTypeForCategories} Categories</span>
                                        </div>

                                        <div className="card shadow-sm border">
                                            <div className="card-body p-0">
                                                <DataTable
                                                    columns={[
                                                        { accessorKey: 'name', header: 'Category Name' },
                                                        {
                                                            accessorKey: 'actions', header: '', width: 80, cell: ({ row }) => (
                                                                <div className="d-flex gap-2 justify-content-end">
                                                                    <button onClick={() => handleEditCategory(selectedTypeForCategories, (row.original as any).name)} className="btn btn-link text-secondary p-0 hover-text-primary">
                                                                        <Edit2 size={16} />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteCategory(selectedTypeForCategories, (row.original as any).name)} className="btn btn-link text-danger p-0">
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            )
                                                        }
                                                    ]}
                                                    data={(selectedTypeForCategories === 'License' ? config.softwareCategories : config.hardwareCategories).map(c => ({ id: c, name: c }))}
                                                    addButton={<button className="btn btn-sm btn-primary shadow-sm" onClick={() => handleAddCategory(selectedTypeForCategories)}>+ Add Category</button>}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {metadataSubTab === 'products' && (
                            <DataTable
                                columns={[
                                    { accessorKey: 'name', header: 'Product Name', cell: ({ row }) => <button onClick={() => onNavigateToFamily?.(row.original)} className="btn btn-link p-0 text-primary text-decoration-none d-flex align-items-center gap-1">{(row.original as any).name}<ExternalLink size={10} /></button> },
                                    { accessorKey: 'assetType', header: 'Type' },
                                    { accessorKey: 'productCode', header: 'Code' },
                                    { accessorKey: 'actions', header: '', width: 50, cell: ({ row }) => <button onClick={() => onEditFamily?.(row.original)} className="btn btn-link text-secondary p-0 hover-text-primary"><Edit2 size={16} /></button> }
                                ]}
                                data={families}
                                addButton={<button className="btn btn-sm btn-primary shadow-sm" onClick={onAddFamily}>+ Add Product</button>}
                            />
                        )}
                        {metadataSubTab === 'vendors' && (
                            <DataTable
                                columns={[
                                    { accessorKey: 'name', header: 'Vendor Name' },
                                    { accessorKey: 'contactName', header: 'Contact' },
                                    { accessorKey: 'email', header: 'Email' },
                                    {
                                        accessorKey: 'website', header: 'Website', cell: ({ row }) => {
                                            const v = row.original as Vendor;
                                            return v.website ? <a href={v.website} target="_blank" rel="noreferrer" className="text-primary text-truncate d-block" style={{ width: '10rem' }}>{v.website}</a> : <span>-</span>
                                        }
                                    },
                                    { accessorKey: 'actions', header: '', width: 50, cell: ({ row }) => <button onClick={() => handleDeleteVendor(row.original.id)} className="btn btn-link text-danger p-0"><Trash2 size={16} /></button> }
                                ]}
                                data={vendors}
                                addButton={<button className="btn btn-sm btn-primary shadow-sm" onClick={handleAddVendor}>+ Add Vendor</button>}
                            />
                        )}
                        {metadataSubTab === 'sites' && (
                            <DataTable
                                columns={[
                                    { accessorKey: 'name', header: 'Site Name' },
                                    { accessorKey: 'actions', header: '', width: 50, cell: ({ row }) => <button onClick={() => handleDeleteSite(row.original.id)} className="btn btn-link text-danger p-0"><Trash2 size={16} /></button> }
                                ]}
                                data={sites || []}
                                addButton={<button className="btn btn-sm btn-primary shadow-sm" onClick={handleAddSite}>+ Add Site</button>}
                            />
                        )}
                        {metadataSubTab === 'departments' && (
                            <DataTable
                                columns={[
                                    { accessorKey: 'name', header: 'Department Name' },
                                    { accessorKey: 'actions', header: '', width: 50, cell: ({ row }) => <button onClick={() => handleDeleteDepartment(row.original.id)} className="btn btn-link text-danger p-0"><Trash2 size={16} /></button> }
                                ]}
                                data={departments || []}
                                addButton={<button className="btn btn-sm btn-primary shadow-sm" onClick={handleAddDepartment}>+ Add Department</button>}
                            />
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'modals' && (
                <div className="h-[700px]">
                    <ModalSettingsEditor config={config} onUpdateConfig={onUpdateConfig} />
                </div>
            )}

            {activeTab === 'ids' && <div style={{ height: '600px' }}><IdConfigEditor config={config} onUpdateConfig={onUpdateConfig} /></div>}

            {activeTab === 'data' && (
                <div className="card shadow-sm border p-4">
                    <h5 className="card-title fw-bold text-dark mb-4">Database Management</h5>
                    <div className="d-flex gap-3">
                        <button onClick={downloadData} className="btn btn-dark d-flex align-items-center gap-2"><Download size={18} /> Export JSON</button>
                        <button onClick={() => setIsImportModalOpen(true)} className="btn btn-primary d-flex align-items-center gap-2"><Upload size={18} /> Import Excel</button>
                    </div>
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="card shadow-sm border p-5 text-center">
                    <h4 className="fw-bold text-dark">Reports & Analytics</h4>
                    <p className="mt-2 text-secondary">This section is under construction. Dashboards for license utilization, hardware lifecycle, and cost analysis will be available here soon.</p>
                </div>
            )}

            {onImportData && <DataImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={onImportData} existingFamilies={families.map(f => ({ id: f.id, name: f.name, type: f.assetType }))} />}

            {isVendorModalOpen && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add Vendor</h5>
                                <button type="button" className="btn-close" onClick={() => setIsVendorModalOpen(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Vendor Name *</label>
                                    <input type="text" className="form-control" value={newVendor.name || ''} onChange={e => setNewVendor({ ...newVendor, name: e.target.value })} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Contact Name</label>
                                    <input type="text" className="form-control" value={newVendor.contactName || ''} onChange={e => setNewVendor({ ...newVendor, contactName: e.target.value })} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-control" value={newVendor.email || ''} onChange={e => setNewVendor({ ...newVendor, email: e.target.value })} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Website</label>
                                    <input type="text" className="form-control" value={newVendor.website || ''} onChange={e => setNewVendor({ ...newVendor, website: e.target.value })} placeholder="https://..." />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsVendorModalOpen(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleSaveVendor}>Save Vendor</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isSiteModalOpen && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add Site</h5>
                                <button type="button" className="btn-close" onClick={() => setIsSiteModalOpen(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Site Name *</label>
                                    <input type="text" className="form-control" value={newSiteName} onChange={e => setNewSiteName(e.target.value)} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsSiteModalOpen(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleSaveSite}>Save Site</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isDepartmentModalOpen && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add Department</h5>
                                <button type="button" className="btn-close" onClick={() => setIsDepartmentModalOpen(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Department Name *</label>
                                    <input type="text" className="form-control" value={newDepartmentName} onChange={e => setNewDepartmentName(e.target.value)} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsDepartmentModalOpen(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleSaveDepartment}>Save Department</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
