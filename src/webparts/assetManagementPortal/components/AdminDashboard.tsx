import * as React from 'react';
import { useState } from 'react';
import { Plus, Database, List, Hash, Upload, Download, Edit2, ExternalLink, Sliders, RefreshCw, Trash2, Wrench, BarChart3 } from 'lucide-react';
import { Asset, User, AssetFamily, Config, IdSection, IdSectionType, Vendor } from '../../assetManagementPortal/types';
import DataImportModal, { ImportType } from './DataImportModal';
import DataTable from './DataTable';
import ModalSettingsEditor from './ModalSettingsEditor';

interface AdminDashboardProps {
    config: Config;
    onUpdateConfig: (newConfig: Config) => void;
    users: User[];
    assets: Asset[];
    families: AssetFamily[];
    vendors: Vendor[];
    onUpdateVendors: (vendors: Vendor[]) => void;
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
        <div className="card shadow-sm border p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0 text-dark">ID Configuration</h5>
                <button onClick={resetToDefault} className="btn btn-sm btn-link text-decoration-none text-muted"><RefreshCw size={14} className="me-1" /> Reset</button>
            </div>
            <div className="mb-4 d-flex gap-3 align-items-center bg-light p-3 rounded">
                <label className="fw-medium small">Separator:</label>
                <select value={globalSeparator} onChange={(e) => updateSeparator(e.target.value)} className="form-select form-select-sm w-auto"><option value="-">-</option><option value="_">_</option><option value="/">/</option></select>
                <div className="vr mx-2"></div>
                <div className="small text-muted">Preview: <span className="font-monospace fw-bold text-dark">{previewId}</span></div>
            </div>
            <div className="d-grid gap-2 mb-3">
                {sections.map((section, index) => (
                    <div key={section.id} className="d-flex align-items-center gap-3 p-2 border rounded bg-white">
                        <span className="badge bg-secondary w-auto" style={{ minWidth: '60px' }}>{section.type}</span>
                        <input value={section.label} onChange={(e) => updateSection(section.id, { label: e.target.value })} className="form-control form-control-sm border-0 fw-medium" />
                        <div className="ms-auto d-flex gap-1">
                            <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="btn btn-sm btn-light text-muted hover-text-primary p-1">↑</button>
                            <button onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1} className="btn btn-sm btn-light text-muted hover-text-primary p-1">↓</button>
                            <button onClick={() => removeSection(section.id)} className="btn btn-sm btn-light text-danger p-1"><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={() => addSection('static', 'FIX', 'Fixed Text')} className="btn btn-sm btn-link text-decoration-none d-flex align-items-center gap-1 ps-0"><Plus size={14} /> Add Section</button>
        </div>
    );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ config, onUpdateConfig, users, assets, families, vendors, onUpdateVendors, onImportData, onNavigateToFamily, onEditFamily, onAddFamily }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'picklists' | 'ids' | 'data' | 'modals' | 'reports'>('picklists');
    const [metadataSubTab, setMetadataSubTab] = useState<'types' | 'products' | 'sites' | 'departments' | 'vendors'>('types');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Helpers for simple lists
    const handleAddSimpleItem = (key: keyof Config, item: string) => {
        if (Array.isArray(config[key]) && !(config[key] as string[]).includes(item)) {
            onUpdateConfig({ ...config, [key]: [...(config[key] as string[]), item] });
        }
    };
    const handleRemoveSimpleItem = (key: keyof Config, item: string) => {
        if (Array.isArray(config[key])) {
            onUpdateConfig({ ...config, [key]: (config[key] as string[]).filter(i => i !== item) });
        }
    };

    const handleAddVendor = () => {
        const name = prompt("Vendor Name:");
        if (name) {
            const newVendor: Vendor = { id: `v-${Date.now()}`, name };
            onUpdateVendors([...vendors, newVendor]);
        }
    };

    const handleDeleteVendor = (id: string) => {
        if (confirm("Delete this vendor?")) {
            onUpdateVendors(vendors.filter(v => v.id !== id));
        }
    };

    // --- Data Transformation for DataTables ---
    const siteData = config.sites.map(s => ({ id: s, name: s }));
    const deptData = config.departments.map(d => ({ id: d, name: d }));
    const assetTypesData = config.assetTypes || [];

    const downloadData = () => {
        const data = { generatedAt: new Date().toISOString(), users, assets, families, vendors, config };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `backup.json`; a.click();
    };

    return (
        <div className="d-grid gap-4">
            <div className="card border p-2 shadow-sm d-inline-block w-auto">
                <div className="d-flex flex-wrap gap-2">
                    <button onClick={() => setActiveTab('general')} className={`btn btn-sm d-flex align-items-center gap-2 ${activeTab === 'general' ? 'btn-primary-subtle text-primary fw-bold' : 'btn-light text-muted'}`}><Wrench size={16} /> General Settings</button>
                    <button onClick={() => setActiveTab('picklists')} className={`btn btn-sm d-flex align-items-center gap-2 ${activeTab === 'picklists' ? 'btn-primary-subtle text-primary fw-bold' : 'btn-light text-muted'}`}><List size={16} /> Metadata Lists</button>
                    <button onClick={() => setActiveTab('ids')} className={`btn btn-sm d-flex align-items-center gap-2 ${activeTab === 'ids' ? 'btn-primary-subtle text-primary fw-bold' : 'btn-light text-muted'}`}><Hash size={16} /> ID Configuration</button>
                    <button onClick={() => setActiveTab('modals')} className={`btn btn-sm d-flex align-items-center gap-2 ${activeTab === 'modals' ? 'btn-primary-subtle text-primary fw-bold' : 'btn-light text-muted'}`}><Sliders size={16} /> Modal Settings</button>
                    <button onClick={() => setActiveTab('data')} className={`btn btn-sm d-flex align-items-center gap-2 ${activeTab === 'data' ? 'btn-primary-subtle text-primary fw-bold' : 'btn-light text-muted'}`}><Database size={16} /> Database Management</button>
                    <button onClick={() => setActiveTab('reports')} className={`btn btn-sm d-flex align-items-center gap-2 ${activeTab === 'reports' ? 'btn-primary-subtle text-primary fw-bold' : 'btn-light text-muted'}`}><BarChart3 size={16} /> Reports & Analytics</button>
                </div>
            </div>

            {activeTab === 'general' && (
                <div className="card shadow-sm border p-4" style={{ maxWidth: '800px' }}>
                    <h5 className="fw-bold mb-4">General System Settings</h5>
                    <div className="d-grid gap-4">
                        <div className="d-flex justify-content-between align-items-center border-bottom pb-3">
                            <div>
                                <h6 className="mb-0 text-dark">Default License Assignment Model</h6>
                                <small className="text-muted">Choose default behavior when creating new license products.</small>
                            </div>
                            <select className="form-select form-select-sm w-auto">
                                <option value="Multiple">Multiple Users (Shared)</option>
                                <option value="Single">Single User</option>
                            </select>
                        </div>
                        <div className="d-flex justify-content-between align-items-center border-bottom pb-3">
                            <div>
                                <h6 className="mb-0 text-dark">Default Hardware Assignment Model</h6>
                                <small className="text-muted">Choose default behavior when creating new hardware products.</small>
                            </div>
                            <select className="form-select form-select-sm w-auto">
                                <option value="Single">Single User</option>
                                <option value="Multiple">Multiple Users (Shared)</option>
                            </select>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="mb-0 text-dark">Enable Usage Tracking</h6>
                                <small className="text-muted">Track active users for all assets regardless of assignment.</small>
                            </div>
                            <div className="form-check form-switch">
                                <input className="form-check-input" type="checkbox" role="switch" checked onChange={() => { }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'picklists' && (
                <div className="card shadow-sm border overflow-hidden d-flex flex-column h-100" style={{ minHeight: '600px' }}>
                    <div className="card-header bg-light border-bottom-0 pb-0">
                        <ul className="nav nav-tabs card-header-tabs">
                            <li className="nav-item"><button onClick={() => setMetadataSubTab('types')} className={`nav-link small text-uppercase fw-bold ${metadataSubTab === 'types' ? 'active' : 'text-muted'}`}>Asset Types</button></li>
                            <li className="nav-item"><button onClick={() => setMetadataSubTab('products')} className={`nav-link small text-uppercase fw-bold ${metadataSubTab === 'products' ? 'active' : 'text-muted'}`}>Products</button></li>
                            <li className="nav-item"><button onClick={() => setMetadataSubTab('vendors')} className={`nav-link small text-uppercase fw-bold ${metadataSubTab === 'vendors' ? 'active' : 'text-muted'}`}>Vendors</button></li>
                            <li className="nav-item"><button onClick={() => setMetadataSubTab('sites')} className={`nav-link small text-uppercase fw-bold ${metadataSubTab === 'sites' ? 'active' : 'text-muted'}`}>Sites</button></li>
                            <li className="nav-item"><button onClick={() => setMetadataSubTab('departments')} className={`nav-link small text-uppercase fw-bold ${metadataSubTab === 'departments' ? 'active' : 'text-muted'}`}>Departments</button></li>
                        </ul>
                    </div>

                    <div className="card-body p-0 d-flex flex-column">
                        <div className="flex-grow-1 p-3 overflow-auto">
                            {metadataSubTab === 'types' && (
                                <DataTable
                                    columns={[
                                        { accessorKey: 'name', header: 'Type Name' },
                                        { accessorKey: 'prefix', header: 'ID Prefix' }
                                    ]}
                                    data={assetTypesData}
                                    addButton={<button className="btn btn-sm btn-primary" onClick={() => prompt('Feature not implemented in mock')}>+ Add Type</button>}
                                />
                            )}
                            {metadataSubTab === 'products' && (
                                <DataTable
                                    columns={[
                                        { accessorKey: 'name', header: 'Product Name', cell: ({ row }) => <button onClick={() => onNavigateToFamily?.(row.original)} className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1 small">{(row.original as any).name}<ExternalLink size={10} /></button> },
                                        { accessorKey: 'assetType', header: 'Type' },
                                        { accessorKey: 'productCode', header: 'Code' },
                                        { accessorKey: 'actions', header: '', width: 50, cell: ({ row }) => <button onClick={() => onEditFamily?.(row.original)} className="btn btn-sm btn-light text-muted hover-text-primary p-1 rounded-circle"><Edit2 size={16} /></button> }
                                    ]}
                                    data={families}
                                    addButton={<button className="btn btn-sm btn-primary" onClick={onAddFamily}>+ Add Product</button>}
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
                                                return v.website ? <a href={v.website} target="_blank" rel="noreferrer" className="text-decoration-none small">{v.website}</a> : <span>-</span>
                                            }
                                        },
                                        { accessorKey: 'actions', header: '', width: 50, cell: ({ row }) => <button onClick={() => handleDeleteVendor(row.original.id)} className="btn btn-sm btn-light text-danger p-1 rounded-circle"><Trash2 size={16} /></button> }
                                    ]}
                                    data={vendors}
                                    addButton={<button className="btn btn-sm btn-primary" onClick={handleAddVendor}>+ Add Vendor</button>}
                                />
                            )}
                            {metadataSubTab === 'sites' && (
                                <DataTable
                                    columns={[
                                        { accessorKey: 'name', header: 'Site Name' },
                                        { accessorKey: 'actions', header: '', width: 50, cell: ({ row }) => <button onClick={() => handleRemoveSimpleItem('sites', (row.original as any).name)} className="btn btn-sm btn-light text-danger p-1 rounded-circle"><Trash2 size={16} /></button> }
                                    ]}
                                    data={siteData}
                                    addButton={<button className="btn btn-sm btn-primary" onClick={() => { const s = prompt('New Site:'); if (s) handleAddSimpleItem('sites', s); }}>+ Add Site</button>}
                                />
                            )}
                            {metadataSubTab === 'departments' && (
                                <DataTable
                                    columns={[
                                        { accessorKey: 'name', header: 'Department Name' },
                                        { accessorKey: 'actions', header: '', width: 50, cell: ({ row }) => <button onClick={() => handleRemoveSimpleItem('departments', (row.original as any).name)} className="btn btn-sm btn-light text-danger p-1 rounded-circle"><Trash2 size={16} /></button> }
                                    ]}
                                    data={deptData}
                                    addButton={<button className="btn btn-sm btn-primary" onClick={() => { const d = prompt('New Department:'); if (d) handleAddSimpleItem('departments', d); }}>+ Add Department</button>}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'modals' && (
                <div style={{ height: '700px' }}>
                    <ModalSettingsEditor config={config} onUpdateConfig={onUpdateConfig} />
                </div>
            )}

            {activeTab === 'ids' && <div style={{ height: '600px' }}><IdConfigEditor config={config} onUpdateConfig={onUpdateConfig} /></div>}

            {activeTab === 'data' && (
                <div className="card shadow-sm border p-4">
                    <h5 className="fw-bold mb-4">Database Management</h5>
                    <div className="d-flex gap-3">
                        <button onClick={downloadData} className="btn btn-dark d-flex align-items-center gap-2"><Download size={18} /> Export JSON</button>
                        <button onClick={() => setIsImportModalOpen(true)} className="btn btn-primary d-flex align-items-center gap-2"><Upload size={18} /> Import Excel</button>
                    </div>
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="card shadow-sm border p-5 text-center">
                    <h2 className="fw-bold text-dark">Reports & Analytics</h2>
                    <p className="text-muted mt-2">This section is under construction. Dashboards for license utilization, hardware lifecycle, and cost analysis will be available here soon.</p>
                </div>
            )}

            {onImportData && <DataImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={onImportData} existingFamilies={families.map(f => ({ id: f.id, name: f.name, type: f.assetType }))} />}
        </div>
    );
};

export default AdminDashboard;