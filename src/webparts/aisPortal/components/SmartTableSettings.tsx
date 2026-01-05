
import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export interface SmartTableColumnConfig {
    id: string;
    title: string;
    isVisible: boolean;
    width: number;
    order: number;
}

export interface SmartTableViewSettings {
    showHeader: boolean;
    showColumnFilter: boolean;
    showAdvancedSearch: boolean;
    tableHeight: 'Flexible' | 'Fixed';
}

interface SmartTableSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    columns: SmartTableColumnConfig[];
    viewSettings: SmartTableViewSettings;
    onApply: (columnConfig: SmartTableColumnConfig[], viewSettings: SmartTableViewSettings) => void;
}

const SmartTableSettings: React.FC<SmartTableSettingsProps> = ({
    isOpen,
    onClose,
    columns,
    viewSettings,
    onApply
}) => {
    const [localColumns, setLocalColumns] = useState<SmartTableColumnConfig[]>([]);

    // Settings State
    const [showHeader, setShowHeader] = useState(true);
    const [showColumnFilter, setShowColumnFilter] = useState(false);
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(true);
    const [tableHeight, setTableHeight] = useState<'Flexible' | 'Fixed'>('Flexible');

    useEffect(() => {
        if (isOpen) {
            // Initialize with current settings
            setShowHeader(viewSettings.showHeader);
            setShowColumnFilter(viewSettings.showColumnFilter);
            setShowAdvancedSearch(viewSettings.showAdvancedSearch);
            setTableHeight(viewSettings.tableHeight);

            // Initialize columns
            setLocalColumns([...columns].sort((a, b) => a.order - b.order));
        }
    }, [isOpen, columns, viewSettings]);

    if (!isOpen) return null;

    const handleToggleColumn = (id: string) => {
        setLocalColumns(prev => prev.map(c => c.id === id ? { ...c, isVisible: !c.isVisible } : c));
    };

    const handleWidthChange = (id: string, width: number) => {
        setLocalColumns(prev => prev.map(c => c.id === id ? { ...c, width } : c));
    };

    const handleOrderChange = (id: string, order: number) => {
        setLocalColumns(prev => prev.map(c => c.id === id ? { ...c, order } : c));
    };

    const handleApply = () => {
        const newViewSettings: SmartTableViewSettings = {
            showHeader,
            showColumnFilter,
            showAdvancedSearch,
            tableHeight,
        };
        // Ensure order is sequential for safety before applying, though pure sort key usage is fine
        const sortedColumns = [...localColumns].sort((a, b) => a.order - b.order);
        onApply(sortedColumns, newViewSettings);
        onClose();
    };

    const InfoIconSmall = () => (
        <span className="d-inline-flex align-items-center justify-content-center border rounded-circle ms-1 text-secondary" style={{ width: '1rem', height: '1rem', fontSize: '0.6rem', cursor: 'help' }} title="Info">i</span>
    );

    return (
        <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal fade show d-block" tabIndex={-1} role="dialog" onClick={onClose}>
                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document" onClick={e => e.stopPropagation()}>
                    <div className="modal-content shadow">
                        {/* Header */}
                        <div className="modal-header border-bottom">
                            <h5 className="modal-title h6 fw-semibold">Asset Management - SmartTable Settings</h5>
                            <div className="d-flex align-items-center gap-3 ms-auto">
                                <div className="d-flex gap-3 small text-secondary">
                                    <button className="btn btn-link p-0 text-decoration-none small">Default Settings</button>
                                    <button className="btn btn-link p-0 text-decoration-none small">Restore default table</button>
                                </div>
                                <InfoIconSmall />
                                <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="modal-body bg-light">
                            {/* Customized Setting Section */}
                            <div className="mb-4">
                                <h6 className="fw-bold text-dark mb-2 small text-uppercase">Customized Setting</h6>
                                <div className="card border-0 shadow-sm p-3">
                                    <div className="row g-4">
                                        {/* Table Header Controls */}
                                        <div className="col-12 col-md-4">
                                            <div className="fw-semibold small text-secondary mb-2">Table Header</div>
                                            <div className="d-flex gap-3 mb-2">
                                                <div className="form-check small">
                                                    <input className="form-check-input" type="checkbox" checked={showHeader} onChange={e => setShowHeader(e.target.checked)} id="showHeader" />
                                                    <label className="form-check-label d-flex align-items-center" htmlFor="showHeader">Show Header <InfoIconSmall /></label>
                                                </div>
                                                <div className="form-check small">
                                                    <input className="form-check-input" type="checkbox" checked={showColumnFilter} onChange={e => setShowColumnFilter(e.target.checked)} id="showColumnFilter" />
                                                    <label className="form-check-label" htmlFor="showColumnFilter">Show Column Filter</label>
                                                </div>
                                            </div>
                                            <div className="form-check small">
                                                <input className="form-check-input" type="checkbox" checked={showAdvancedSearch} onChange={e => setShowAdvancedSearch(e.target.checked)} id="showAdvancedSearch" />
                                                <label className="form-check-label" htmlFor="showAdvancedSearch">Show Advanced Search</label>
                                            </div>
                                        </div>

                                        {/* Table Height */}
                                        <div className="col-12 col-md-4">
                                            <div className="fw-semibold small text-secondary mb-2">Table Height</div>
                                            <div className="d-flex gap-3">
                                                <div className="form-check small">
                                                    <input className="form-check-input" type="radio" checked={tableHeight === 'Flexible'} onChange={() => setTableHeight('Flexible')} name="height" id="heightFlexible" />
                                                    <label className="form-check-label" htmlFor="heightFlexible">Flexible</label>
                                                </div>
                                                <div className="form-check small">
                                                    <input className="form-check-input" type="radio" checked={tableHeight === 'Fixed'} onChange={() => setTableHeight('Fixed')} name="height" id="heightFixed" />
                                                    <label className="form-check-label" htmlFor="heightFixed">Fixed</label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Table Header Icons Placeholder */}
                                        <div className="col-12 col-md-4">
                                            <div className="fw-semibold small text-secondary mb-2">Table Header Icons</div>
                                            <div className="d-flex gap-1">
                                                <div className="p-1 border rounded bg-light"><RotateCcw size={12} className="text-secondary" /></div>
                                                <div className="p-1 border rounded bg-light"><div className="bg-secondary opacity-25 rounded-circle" style={{ width: '12px', height: '12px' }}></div></div>
                                                <div className="p-1 border rounded bg-light"><div className="bg-secondary opacity-25 rounded-circle" style={{ width: '12px', height: '12px' }}></div></div>
                                                <div className="p-1 border rounded bg-light"><div className="bg-secondary opacity-25 rounded-circle" style={{ width: '12px', height: '12px', transform: 'rotate(45deg)' }}></div></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Column Settings Section */}
                            <div>
                                <h6 className="fw-bold text-dark mb-2 small text-uppercase d-flex align-items-center gap-1">
                                    Column Settings <InfoIconSmall />
                                </h6>

                                <div className="card border-0 shadow-sm overflow-hidden">
                                    <div className="table-responsive" style={{ maxHeight: '300px' }}>
                                        <table className="table table-hover mb-0 small align-middle">
                                            <thead className="table-light sticky-top">
                                                <tr>
                                                    <th className="w-50 ps-4">Columns <InfoIconSmall /></th>
                                                    <th className="w-25">Column Width <InfoIconSmall /></th>
                                                    <th className="w-25 pe-4">Ordering <InfoIconSmall /></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {localColumns.map((col) => (
                                                    <tr key={col.id}>
                                                        <td className="ps-4">
                                                            <div className="form-check mb-0">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={col.isVisible}
                                                                    onChange={() => handleToggleColumn(col.id)}
                                                                    id={`col-${col.id}`}
                                                                />
                                                                <label className={`form-check-label d-flex align-items-center gap-2 ${col.isVisible ? 'fw-medium text-dark' : 'text-muted'}`} htmlFor={`col-${col.id}`}>
                                                                    {col.title}
                                                                    <span className="text-muted small" style={{ cursor: 'pointer' }}>✎</span>
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <input
                                                                    type="number"
                                                                    value={col.width}
                                                                    onChange={(e) => handleWidthChange(col.id, parseInt(e.target.value))}
                                                                    className="form-control form-control-sm text-center"
                                                                    style={{ width: '60px' }}
                                                                />
                                                                <span className="badge bg-light text-secondary border font-monospace">{col.width}</span>
                                                            </div>
                                                        </td>
                                                        <td className="pe-4">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <input
                                                                    type="number"
                                                                    value={col.order}
                                                                    onChange={(e) => handleOrderChange(col.id, parseInt(e.target.value))}
                                                                    className="form-control form-control-sm text-center"
                                                                    style={{ width: '50px' }}
                                                                />
                                                                <span className="fw-bold text-dark">{col.order}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="modal-footer bg-white">
                            <button onClick={onClose} className="btn btn-light border text-secondary fw-medium">Cancel</button>
                            <button onClick={handleApply} className="btn btn-dark fw-medium">Apply</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SmartTableSettings;
