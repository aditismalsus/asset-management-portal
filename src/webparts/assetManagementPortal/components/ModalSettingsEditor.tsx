import * as React from 'react';
import { useState, useEffect } from 'react';
import { Config, ModalConfig, ModalLayout, SectionDefinition, TabDefinition } from '../../assetManagementPortal/types';
import { Plus, X, ArrowUp, ArrowDown, Trash2, GripVertical, Check, LayoutGrid, Columns } from 'lucide-react';

interface ModalSettingsEditorProps {
    config: Config;
    onUpdateConfig: (newConfig: Config) => void;
}

type ModalContextKey = keyof ModalConfig;

const CONTEXT_OPTIONS: { key: ModalContextKey; label: string }[] = [
    { key: 'licenseFamily', label: 'License Profile (Family)' },
    { key: 'hardwareFamily', label: 'Hardware Product (Family)' },
    { key: 'licenseInstance', label: 'License Asset (Instance)' },
    { key: 'hardwareInstance', label: 'Hardware Asset (Instance)' },
    { key: 'userProfile', label: 'User Profile' },
];

const AVAILABLE_FIELDS: Record<ModalContextKey, string[]> = {
    licenseFamily: ['name', 'productCode', 'vendor', 'category', 'description', 'variants', 'assignmentModel'],
    hardwareFamily: ['name', 'productCode', 'modelNumber', 'manufacturer', 'category', 'description', 'assignmentModel'],
    licenseInstance: ['title', 'assetId', 'status', 'variantType', 'licenseKey', 'email', 'assignedUsers', 'assignedUser', 'activeUsers', 'purchaseDate', 'renewalDate', 'complianceStatus', 'cost', 'currencyTool', 'assignmentHistory'],
    hardwareInstance: ['title', 'assetId', 'status', 'serialNumber', 'macAddress', 'location', 'condition', 'assignedUser', 'assignedUsers', 'activeUsers', 'purchaseDate', 'warrantyExpiryDate', 'cost', 'currencyTool', 'assignmentHistory'],
    userProfile: ['firstName', 'lastName', 'suffix', 'jobTitle', 'department', 'site', 'typeOfContact', 'linkedin', 'twitter', 'facebook', 'instagram', 'businessPhone', 'mobileNo', 'email', 'nonPersonalEmail', 'homePhone', 'skype', 'address', 'city', 'notes', 'avatarUpload']
};

const ModalSettingsEditor: React.FC<ModalSettingsEditorProps> = ({ config, onUpdateConfig }) => {
    const [selectedContext, setSelectedContext] = useState<ModalContextKey>('licenseFamily');
    const [currentLayout, setCurrentLayout] = useState<ModalLayout>(config.modalLayouts?.[selectedContext] || { tabs: [] });
    const [activeTabId, setActiveTabId] = useState<string | null>(null);

    // Sync state when config/context changes
    useEffect(() => {
        if (config.modalLayouts && config.modalLayouts[selectedContext]) {
            setCurrentLayout(JSON.parse(JSON.stringify(config.modalLayouts[selectedContext])));
            // Set first tab as active if none active
            if (!activeTabId && config.modalLayouts[selectedContext].tabs.length > 0) {
                setActiveTabId(config.modalLayouts[selectedContext].tabs[0].id);
            } else if (activeTabId && !config.modalLayouts[selectedContext].tabs.find(t => t.id === activeTabId)) {
                // If active tab no longer exists
                setActiveTabId(config.modalLayouts[selectedContext].tabs[0]?.id || null);
            }
        }
    }, [selectedContext, config.modalLayouts]);

    const handleSave = () => {
        const newModalLayouts = { ...config.modalLayouts, [selectedContext]: currentLayout };
        onUpdateConfig({ ...config, modalLayouts: newModalLayouts });
        alert('Modal layout saved successfully!');
    };

    // --- Tab Actions ---
    const addTab = () => {
        const newTabId = `tab-${Date.now()}`;
        const newTab: TabDefinition = { id: newTabId, label: 'New Tab', sections: [] };
        setCurrentLayout(prev => ({ ...prev, tabs: [...prev.tabs, newTab] }));
        setActiveTabId(newTabId);
    };

    const removeTab = (tabId: string) => {
        if (confirm('Delete this tab?')) {
            setCurrentLayout(prev => ({ ...prev, tabs: prev.tabs.filter(t => t.id !== tabId) }));
            if (activeTabId === tabId) setActiveTabId(null);
        }
    };

    const updateTabLabel = (tabId: string, newLabel: string) => {
        setCurrentLayout(prev => ({ ...prev, tabs: prev.tabs.map(t => t.id === tabId ? { ...t, label: newLabel } : t) }));
    };

    // --- Section Actions ---
    const addSection = (tabId: string) => {
        const newSection: SectionDefinition = {
            id: `sec-${Date.now()}`,
            title: 'New Section',
            columns: 1,
            fields: []
        };
        setCurrentLayout(prev => ({
            ...prev,
            tabs: prev.tabs.map(t => t.id === tabId ? { ...t, sections: [...t.sections, newSection] } : t)
        }));
    };

    const removeSection = (tabId: string, sectionId: string) => {
        setCurrentLayout(prev => ({
            ...prev,
            tabs: prev.tabs.map(t => t.id === tabId ? { ...t, sections: t.sections.filter(s => s.id !== sectionId) } : t)
        }));
    };

    const updateSection = (tabId: string, sectionId: string, updates: Partial<SectionDefinition>) => {
        setCurrentLayout(prev => ({
            ...prev,
            tabs: prev.tabs.map(t => t.id === tabId ? {
                ...t,
                sections: t.sections.map(s => s.id === sectionId ? { ...s, ...updates } : s)
            } : t)
        }));
    };

    const moveSection = (tabId: string, sectionIndex: number, direction: 'up' | 'down') => {
        setCurrentLayout(prev => ({
            ...prev,
            tabs: prev.tabs.map(t => {
                if (t.id === tabId) {
                    const sections = [...t.sections];
                    const targetIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
                    if (targetIndex >= 0 && targetIndex < sections.length) {
                        [sections[sectionIndex], sections[targetIndex]] = [sections[targetIndex], sections[sectionIndex]];
                    }
                    return { ...t, sections };
                }
                return t;
            })
        }));
    };

    // --- Field Actions & Drag Drop ---
    const [draggedField, setDraggedField] = useState<string | null>(null);
    const [dragSourceSection, setDragSourceSection] = useState<string | null>(null); // null means 'available' list

    const handleDragStart = (e: React.DragEvent, field: string, sourceSectionId: string | null) => {
        setDraggedField(field);
        setDragSourceSection(sourceSectionId);
        e.dataTransfer.effectAllowed = 'move';
        // Hack to allow drag image to appear
        const el = e.target as HTMLElement;
        el.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const el = e.target as HTMLElement;
        el.style.opacity = '1';
        setDraggedField(null);
        setDragSourceSection(null);
    };

    const handleDrop = (e: React.DragEvent, targetSectionId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedField || !activeTabId) return;

        // Remove from source if it was in a section
        let newLayout = { ...currentLayout };

        if (dragSourceSection) {
            newLayout.tabs = newLayout.tabs.map(t => ({
                ...t,
                sections: t.sections.map(s => s.id === dragSourceSection ? { ...s, fields: s.fields.filter(f => f !== draggedField) } : s)
            }));
        } else {
            // It was from available fields, ensure it's not anywhere else (shouldn't be, but safe check)
            newLayout.tabs = newLayout.tabs.map(t => ({
                ...t,
                sections: t.sections.map(s => ({ ...s, fields: s.fields.filter(f => f !== draggedField) }))
            }));
        }

        // Add to target section
        newLayout.tabs = newLayout.tabs.map(t => {
            if (t.id === activeTabId) {
                return {
                    ...t,
                    sections: t.sections.map(s => {
                        if (s.id === targetSectionId) {
                            // Don't add duplicate if somehow logic failed
                            if (!s.fields.includes(draggedField)) {
                                return { ...s, fields: [...s.fields, draggedField] };
                            }
                        }
                        return s;
                    })
                };
            }
            return t;
        });

        setCurrentLayout(newLayout);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const removeField = (tabId: string, sectionId: string, field: string) => {
        setCurrentLayout(prev => ({
            ...prev,
            tabs: prev.tabs.map(t => t.id === tabId ? {
                ...t,
                sections: t.sections.map(s => s.id === sectionId ? { ...s, fields: s.fields.filter(f => f !== field) } : s)
            } : t)
        }));
    };

    // Derived State
    const currentTab = currentLayout.tabs.find(t => t.id === activeTabId);
    const assignedFields = new Set(currentLayout.tabs.flatMap(t => t.sections.flatMap(s => s.fields)));
    const availableFields = AVAILABLE_FIELDS[selectedContext].filter(f => !assignedFields.has(f));

    return (
        <div className="d-flex flex-column bg-light rounded border h-100 overflow-hidden">
            {/* Header */}
            <div className="p-3 bg-white border-bottom d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                    <label className="fw-bold text-dark small">Select Modal Context:</label>
                    <select
                        value={selectedContext}
                        onChange={(e) => setSelectedContext(e.target.value as ModalContextKey)}
                        className="form-select form-select-sm w-auto"
                    >
                        {CONTEXT_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                    </select>
                </div>
                <button onClick={handleSave} className="btn btn-sm btn-primary d-flex align-items-center gap-2">
                    <Check size={16} /> Save Layout
                </button>
            </div>

            <div className="d-flex flex-grow-1 overflow-hidden">
                {/* Available Fields Sidebar */}
                <div className="bg-white border-end d-flex flex-column" style={{ width: '250px' }}>
                    <div className="p-3 border-bottom bg-light">
                        <h6 className="fw-bold text-secondary text-uppercase small mb-0">Available Fields</h6>
                    </div>
                    <div className="overflow-auto p-2 d-grid gap-2 flex-grow-1">
                        {availableFields.map(field => (
                            <div
                                key={field}
                                draggable
                                onDragStart={(e) => handleDragStart(e, field, null)}
                                onDragEnd={handleDragEnd}
                                className="d-flex align-items-center gap-2 p-2 bg-white border rounded shadow-sm cursor-move hover-border-primary"
                            >
                                <GripVertical size={14} className="text-secondary" />
                                <span className="small text-muted fw-medium">{field}</span>
                            </div>
                        ))}
                        {availableFields.length === 0 && <div className="text-muted small text-center py-4">All fields used</div>}
                    </div>
                </div>

                {/* Main Layout Area */}
                <div className="flex-grow-1 d-flex flex-column overflow-hidden">
                    {/* Tabs Bar */}
                    <div className="d-flex align-items-center bg-white border-bottom px-2 pt-2 gap-1 overflow-x-auto">
                        {currentLayout.tabs.map(tab => (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTabId(tab.id)}
                                className={`d-flex align-items-center gap-2 px-3 py-2 border-top border-end border-start rounded-top cursor-pointer ${activeTabId === tab.id ? 'bg-light fw-bold text-primary' : 'bg-white text-muted hover-bg-light'}`}
                                style={{ marginBottom: '-1px', position: 'relative', zIndex: activeTabId === tab.id ? 1 : 0 }}
                            >
                                {activeTabId === tab.id ? (
                                    <input
                                        value={tab.label}
                                        onChange={(e) => updateTabLabel(tab.id, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="form-control form-control-sm py-0 px-1 border-0 bg-transparent fw-bold text-primary"
                                        style={{ width: '100px' }}
                                    />
                                ) : (
                                    <span className="small">{tab.label}</span>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }} className="btn btn-link p-0 text-muted hover-text-danger"><X size={12} /></button>
                            </div>
                        ))}
                        <button onClick={addTab} className="btn btn-sm btn-link text-decoration-none d-flex align-items-center gap-1 mb-1"><Plus size={14} /> Add Tab</button>
                    </div>

                    {/* Active Tab Content (Sections) */}
                    <div className="flex-grow-1 overflow-auto p-4 bg-light">
                        {currentTab ? (
                            <div className="d-grid gap-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
                                {currentTab.sections.map((section, sIndex) => (
                                    <div key={section.id} className="card shadow-sm border-0">
                                        <div className="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center gap-2">
                                                <GripVertical size={16} className="text-muted cursor-move" />
                                                <input
                                                    value={section.title}
                                                    onChange={(e) => updateSection(currentTab.id, section.id, { title: e.target.value })}
                                                    className="form-control form-control-sm border-0 fw-bold px-1"
                                                />
                                            </div>
                                            <div className="d-flex align-items-center gap-1">
                                                <button onClick={() => moveSection(currentTab.id, sIndex, 'up')} disabled={sIndex === 0} className="btn btn-sm btn-light p-1"><ArrowUp size={14} /></button>
                                                <button onClick={() => moveSection(currentTab.id, sIndex, 'down')} disabled={sIndex === currentTab.sections.length - 1} className="btn btn-sm btn-light p-1"><ArrowDown size={14} /></button>
                                                <div className="vr mx-1"></div>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        onClick={() => updateSection(currentTab.id, section.id, { columns: 1 })}
                                                        className={`btn btn-outline-secondary ${section.columns === 1 ? 'active' : ''}`} title="1 Column"
                                                    ><LayoutGrid size={14} /></button>
                                                    <button
                                                        onClick={() => updateSection(currentTab.id, section.id, { columns: 2 })}
                                                        className={`btn btn-outline-secondary ${section.columns === 2 ? 'active' : ''}`} title="2 Columns"
                                                    ><Columns size={14} /></button>
                                                </div>
                                                <button onClick={() => removeSection(currentTab.id, section.id)} className="btn btn-sm btn-light text-danger ms-2"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        <div
                                            className="card-body bg-light-subtle min-h-100"
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, section.id)}
                                            style={{ minHeight: '100px' }}
                                        >
                                            {section.fields.length === 0 ? (
                                                <div className="text-center text-muted border border-dashed rounded py-4 small">
                                                    Drag fields here
                                                </div>
                                            ) : (
                                                <div className="row g-2">
                                                    {section.fields.map(field => (
                                                        <div key={field} className={`col-${12 / (section.columns || 1)}`}>
                                                            <div
                                                                draggable
                                                                onDragStart={(e) => handleDragStart(e, field, section.id)}
                                                                onDragEnd={handleDragEnd}
                                                                className="d-flex align-items-center justify-content-between p-2 bg-white border rounded shadow-sm cursor-move"
                                                            >
                                                                <span className="small fw-medium text-dark">{field}</span>
                                                                <button onClick={() => removeField(currentTab.id, section.id, field)} className="btn btn-link p-0 text-muted hover-text-danger"><X size={12} /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => addSection(currentTab.id)} className="btn btn-outline-dashed border-2 py-3 fw-bold text-muted w-100 d-flex align-items-center justify-content-center gap-2 hover-bg-light">
                                    <Plus size={18} /> Add Section
                                </button>
                            </div>
                        ) : (
                            <div className="text-center text-muted py-5">Select or create a tab to edit layout</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalSettingsEditor;