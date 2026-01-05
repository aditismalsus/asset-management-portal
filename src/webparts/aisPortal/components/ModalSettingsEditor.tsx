
import React, { useState, useEffect } from 'react';
import { Config, ModalConfig, ModalLayout, SectionDefinition, TabDefinition } from '../types';
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
    licenseInstance: ['title', 'assetId', 'status', 'variantType', 'licenseKey', 'email', 'assignedUsers', 'assignedUser', 'activeUsers', 'purchaseDate', 'expiryDate', 'complianceStatus', 'cost', 'currencyTool', 'assignmentHistory'],
    hardwareInstance: ['title', 'assetId', 'status', 'serialNumber', 'macAddress', 'location', 'condition', 'assignedUser', 'assignedUsers', 'activeUsers', 'purchaseDate', 'expiryDate', 'cost', 'currencyTool', 'assignmentHistory'],
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
        <div className="h-100 d-flex flex-column bg-light rounded overflow-hidden border">
            {/* Header */}
            <div className="p-3 bg-white border-bottom d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                    <label className="small fw-bold text-secondary text-nowrap">Select Modal Context:</label>
                    <select
                        value={selectedContext}
                        onChange={(e) => setSelectedContext(e.target.value as ModalContextKey)}
                        className="form-select form-select-sm"
                        style={{ width: 'auto' }}
                    >
                        {CONTEXT_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                    </select>
                </div>
                <button onClick={handleSave} className="btn btn-primary btn-sm d-flex align-items-center gap-2 fw-semibold shadow-sm">
                    <Check size={16} /> Save Layout
                </button>
            </div>

            <div className="flex-grow-1 d-flex overflow-hidden">
                {/* Available Fields Sidebar */}
                <div className="bg-white border-end d-flex flex-column" style={{ width: '250px' }}>
                    <div className="p-3 border-bottom bg-light">
                        <h4 className="small fw-bold text-secondary text-uppercase mb-0 tracking-wider">Available Fields</h4>
                    </div>
                    <div className="overflow-y-auto p-2 d-flex flex-column gap-2 flex-grow-1">
                        {availableFields.map(field => (
                            <div
                                key={field}
                                draggable
                                onDragStart={(e) => handleDragStart(e, field, null)}
                                onDragEnd={handleDragEnd}
                                className="d-flex align-items-center gap-2 p-2 bg-white border rounded shadow-sm cursor-grab border-hover-primary"
                                style={{ cursor: 'grab' }}
                            >
                                <GripVertical size={14} className="text-muted" />
                                <span className="small text-dark font-monospace text-truncate">{field}</span>
                            </div>
                        ))}
                        {availableFields.length === 0 && <p className="text-center small text-muted mt-3">All fields assigned</p>}
                    </div>
                </div>

                {/* Main Preview / Editor Area */}
                <div className="flex-grow-1 d-flex flex-column bg-light overflow-hidden">
                    {/* Tabs Navigation */}
                    <div className="p-2 border-bottom bg-white d-flex gap-2 align-items-center overflow-x-auto">
                        <ul className="nav nav-tabs flex-nowrap border-bottom-0">
                            {currentLayout.tabs.map(tab => (
                                <li className="nav-item" key={tab.id}>
                                    <div className={`nav-link d-flex align-items-center gap-2 ${activeTabId === tab.id ? 'active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setActiveTabId(tab.id)}>
                                        <input
                                            value={tab.label}
                                            onChange={(e) => updateTabLabel(tab.id, e.target.value)}
                                            className="bg-transparent border-0 p-0 small fw-medium text-dark w-auto"
                                            style={{ outline: 'none', width: '80px' }}
                                        />
                                        <button onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }} className="btn btn-link p-0 text-muted hover-danger opacity-50 hover-opacity-100" style={{ lineHeight: 1 }}><X size={12} /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <button onClick={addTab} className="btn btn-sm btn-light rounded-circle p-1 ms-2"><Plus size={16} /></button>
                    </div>

                    {/* Active Tab Content (Sections) */}
                    <div className="flex-grow-1 overflow-y-auto p-4">
                        {currentTab ? (
                            <div className="d-flex flex-column gap-4 mx-auto" style={{ maxWidth: '900px' }}>
                                {currentTab.sections.map((section, index) => (
                                    <div
                                        key={section.id}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, section.id)}
                                        className={`card ${draggedField ? 'border-dashed border-primary' : 'border'} transition-colors`}
                                    >
                                        <div className="card-body p-3">
                                            {/* Section Header */}
                                            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                                                <div className="d-flex align-items-center gap-2">
                                                    <LayoutGrid size={16} className="text-primary" />
                                                    <input
                                                        value={section.title}
                                                        onChange={(e) => updateSection(currentTab.id, section.id, { title: e.target.value })}
                                                        className="form-control form-control-sm border-0 fw-semibold text-dark shadow-none p-0"
                                                        placeholder="Section Title"
                                                    />
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="d-flex align-items-center bg-light rounded px-2 py-1 border">
                                                        <Columns size={14} className="text-muted me-1" />
                                                        <select
                                                            value={section.columns}
                                                            onChange={(e) => updateSection(currentTab.id, section.id, { columns: parseInt(e.target.value) })}
                                                            className="form-select form-select-sm border-0 bg-transparent py-0 shadow-none text-muted"
                                                            style={{ width: 'auto', fontSize: '0.75rem' }}
                                                        >
                                                            <option value={1}>1 Col</option>
                                                            <option value={2}>2 Cols</option>
                                                            <option value={3}>3 Cols</option>
                                                            <option value={4}>4 Cols</option>
                                                        </select>
                                                    </div>
                                                    <div className="btn-group btn-group-sm">
                                                        <button onClick={() => moveSection(currentTab.id, index, 'up')} disabled={index === 0} className="btn btn-light border"><ArrowUp size={14} /></button>
                                                        <button onClick={() => moveSection(currentTab.id, index, 'down')} disabled={index === currentTab.sections.length - 1} className="btn btn-light border"><ArrowDown size={14} /></button>
                                                    </div>
                                                    <button onClick={() => removeSection(currentTab.id, section.id)} className="btn btn-sm btn-light text-danger border hover-bg-danger-subtle"><Trash2 size={14} /></button>
                                                </div>
                                            </div>

                                            {/* Grid Content */}
                                            <div className="row g-3">
                                                {section.fields.map(field => (
                                                    <div
                                                        key={field}
                                                        className={`col-${12 / section.columns} col-md-${12 / section.columns}`}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, field, section.id)}
                                                        onDragEnd={handleDragEnd}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-center p-2 bg-light border rounded group" style={{ cursor: 'grab' }}>
                                                            <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                                <GripVertical size={14} className="text-muted flex-shrink-0" />
                                                                <span className="small fw-medium text-dark font-monospace text-truncate">{field}</span>
                                                            </div>
                                                            <button onClick={() => removeField(currentTab.id, section.id, field)} className="btn btn-link p-0 text-muted hover-text-danger"><X size={12} /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {section.fields.length === 0 && (
                                                    <div className="col-12">
                                                        <div className="text-center p-4 border-2 border-dashed rounded bg-light text-muted small">
                                                            Drop fields here
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button onClick={() => addSection(currentTab.id)} className="btn btn-outline-secondary border-dashed w-100 py-3 d-flex align-items-center justify-content-center gap-2">
                                    <Plus size={16} /> Add Section
                                </button>
                            </div>
                        ) : (
                            <div className="h-100 d-flex align-items-center justify-content-center text-muted">Select or add a tab to edit layout</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalSettingsEditor;
