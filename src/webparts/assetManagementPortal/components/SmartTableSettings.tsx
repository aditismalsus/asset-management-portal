import * as React from 'react';
import { useState, useEffect } from 'react';
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
        <span className="badge rounded-circle border border-secondary text-secondary d-inline-flex align-items-center justify-content-center ms-1" style={{ width: 14, height: 14, fontSize: '8px', cursor: 'help' }} title="Info">i</span>
    );

    return (
        <div className="modal fade show d-block bg-dark bg-opacity-25 backdrop-blur" tabIndex={-1} onClick={onClose}>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
                <div className="modal-content shadow-lg border-0">

                    {/* Header */}
                    <div className="modal-header py-2 bg-white border-bottom">
                        <h5 className="modal-title fw-semibold text-dark fs-6">Asset Management - SmartTable Settings</h5>
                        <div className="d-flex align-items-center gap-3 ms-auto small">
                            <button className="btn btn-link p-0 text-decoration-none small">Default Settings</button>
                            <button className="btn btn-link p-0 text-decoration-none small">Restore default table</button>
                            <InfoIconSmall />
                            <button onClick={onClose} className="btn-close btn-close-sm"></button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="modal-body bg-white">
                        {/* Customized Setting Section */}
                        <div className="mb-4">
                            <h6 className="fw-bold text-dark small mb-2 border-bottom pb-1">Customized Setting</h6>
                            <div className="row g-4 pt-2">
                                {/* Table Header Controls */}
                                <div className="col-md-4">
                                    <div className="fw-semibold small text-muted mb-2">Table Header</div>
                                    <div className="d-flex gap-3 mb-2">
                                        <div className="form-check form-check-inline">
                                            <input className="form-check-input" type="checkbox" id="showHeader" checked={showHeader} onChange={e => setShowHeader(e.target.checked)} />
                                            <label className="form-check-label small" htmlFor="showHeader">Show Header <InfoIconSmall /></label>
                                        </div>
                                        <div className="form-check form-check-inline">
                                            <input className="form-check-input" type="checkbox" id="showColFilter" checked={showColumnFilter} onChange={e => setShowColumnFilter(e.target.checked)} />
                                            <label className="form-check-label small" htmlFor="showColFilter">Show Column Filter</label>
                                        </div>
                                    </div>
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" id="showAdvSearch" checked={showAdvancedSearch} onChange={e => setShowAdvancedSearch(e.target.checked)} />
                                        <label className="form-check-label small" htmlFor="showAdvSearch">Show Advanced Search</label>
                                    </div>
                                </div>

                                {/* Table Height */}
                                <div className="col-md-4">
                                    <div className="fw-semibold small text-muted mb-2">Table Height</div>
                                    <div className="d-flex gap-3">
                                        <div className="form-check form-check-inline">
                                            <input className="form-check-input" type="radio" name="height" id="h-flexible" checked={tableHeight === 'Flexible'} onChange={() => setTableHeight('Flexible')} />
                                            <label className="form-check-label small" htmlFor="h-flexible">Flexible</label>
                                        </div>
                                        <div className="form-check form-check-inline">
                                            <input className="form-check-input" type="radio" name="height" id="h-fixed" checked={tableHeight === 'Fixed'} onChange={() => setTableHeight('Fixed')} />
                                            <label className="form-check-label small" htmlFor="h-fixed">Fixed</label>
                                        </div>
                                    </div>
                                </div>

                                {/* Table Header Icons Placeholder */}
                                <div className="col-md-4">
                                    <div className="fw-semibold small text-muted mb-2">Table Header Icons</div>
                                    <div className="d-flex gap-1">
                                        <div className="p-1 border rounded bg-light"><RotateCcw size={12} className="text-secondary" /></div>
                                        <div className="p-1 border rounded bg-light"><div className="bg-secondary rounded-circle" style={{ width: 12, height: 12 }}></div></div>
                                        <div className="p-1 border rounded bg-light"><div className="bg-secondary" style={{ width: 12, height: 12 }}></div></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column Settings Section */}
                        <div>
                            <h6 className="fw-bold text-dark small mb-2 d-flex align-items-center gap-1">
                                Column Settings <InfoIconSmall />
                            </h6>

                            <div className="border rounded overflow-hidden">
                                <table className="table table-sm mb-0">
                                    <thead className="table-light text-muted small">
                                        <tr>
                                            <th style={{ width: '50%' }}>Columns <InfoIconSmall /></th>
                                            <th style={{ width: '25%' }}>Column Width <InfoIconSmall /></th>
                                            <th style={{ width: '25%' }}>Column Ordering <InfoIconSmall /></th>
                                        </tr>
                                    </thead>
                                </table>
                                <div className="overflow-auto" style={{ maxHeight: '300px' }}>
                                    <table className="table table-sm table-hover mb-0">
                                        <tbody>
                                            {localColumns.map((col) => (
                                                <tr key={col.id}>
                                                    <td style={{ width: '50%' }} className="align-middle">
                                                        <div className="form-check d-flex align-items-center gap-2">
                                                            <input
                                                                className="form-check-input mt-0"
                                                                type="checkbox"
                                                                checked={col.isVisible}
                                                                onChange={() => handleToggleColumn(col.id)}
                                                                id={`col-${col.id}`}
                                                            />
                                                            <label className={`form-check-label small ${col.isVisible ? 'fw-medium text-dark' : 'text-muted'}`} htmlFor={`col-${col.id}`}>
                                                                {col.title}
                                                            </label>
                                                            <span className="text-muted small ms-2 cursor-pointer">✎</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ width: '25%' }} className="align-middle">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <input
                                                                type="number"
                                                                value={col.width}
                                                                onChange={(e) => handleWidthChange(col.id, parseInt(e.target.value))}
                                                                className="form-control form-control-sm text-center p-0"
                                                                style={{ width: '60px' }}
                                                            />
                                                            <div className="badge bg-secondary-subtle text-secondary font-monospace" style={{ minWidth: '30px' }}>{col.width}</div>
                                                        </div>
                                                    </td>
                                                    <td style={{ width: '25%' }} className="align-middle">
                                                        <div className="d-flex align-items-center justify-content-between pe-3">
                                                            <input
                                                                type="number"
                                                                value={col.order}
                                                                onChange={(e) => handleOrderChange(col.id, parseInt(e.target.value))}
                                                                className="form-control form-control-sm text-center p-0"
                                                                style={{ width: '50px' }}
                                                            />
                                                            <span className="fw-bold text-dark small">{col.order}</span>
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
                    <div className="modal-footer bg-white py-2">
                        <button onClick={onClose} className="btn btn-sm btn-outline-secondary">Cancel</button>
                        <button onClick={handleApply} className="btn btn-sm btn-dark">Apply</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartTableSettings;