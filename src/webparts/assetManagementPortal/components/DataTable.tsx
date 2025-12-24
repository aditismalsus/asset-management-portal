import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { ColumnDef } from '../../assetManagementPortal/types';
import { Search, ArrowUpDown, Settings } from 'lucide-react';
import SmartTableSettings, { SmartTableColumnConfig, SmartTableViewSettings } from './SmartTableSettings';

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  addButton?: React.ReactNode;
}

const DataTable = <T extends { id: any }>({ columns, data, addButton }: DataTableProps<T>) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sorting, setSorting] = useState<{ id: string; desc: boolean } | null>(null);

  // Smart Table State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [columnConfig, setColumnConfig] = useState<SmartTableColumnConfig[]>([]);
  const [viewSettings, setViewSettings] = useState<SmartTableViewSettings>({
    showHeader: true,
    showColumnFilter: true,
    showAdvancedSearch: true,
    tableHeight: 'Flexible'
  });

  // Initialize or Sync Column Config
  useEffect(() => {
    if (columns.length === 0) return;

    setColumnConfig(prev => {
      const currentSortedIds = columns.map(c => c.accessorKey).sort().join(',');
      const prevSortedIds = prev.map(c => c.id).sort().join(',');

      // If columns change significantly, reset config
      if (prev.length === 0 || currentSortedIds !== prevSortedIds) {
        return columns.map((col, index) => ({
          id: col.accessorKey as string,
          title: col.header,
          isVisible: true,
          width: col.width || 150,
          order: index + 1
        }));
      }

      return prev;
    });
  }, [columns]);

  const handleApplySettings = (newConfig: SmartTableColumnConfig[], newViewSettings: SmartTableViewSettings) => {
    setColumnConfig(newConfig);
    setViewSettings(newViewSettings);
  };

  const activeColumns = useMemo(() => {
    if (columnConfig.length === 0) return columns;

    const visible = columnConfig.filter(c => c.isVisible);
    const sortedConfig = visible.sort((a, b) => a.order - b.order);

    return sortedConfig.map(conf => {
      const original = columns.find(c => c.accessorKey === conf.id);
      if (!original) return null;
      return {
        ...original,
        width: conf.width
      };
    }).filter(Boolean) as ColumnDef<T>[];
  }, [columnConfig, columns]);

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const filteredAndSortedData = useMemo(() => {
    let filteredData = data;

    // Global filter
    if (globalFilter && viewSettings.showAdvancedSearch) {
      filteredData = filteredData.filter(row =>
        columns.some(column => {
          const value = getNestedValue(row, column.accessorKey as string);
          return String(value).toLowerCase().includes(globalFilter.toLowerCase());
        })
      );
    }

    // Column filters
    if (viewSettings.showColumnFilter) {
      Object.entries(columnFilters).forEach(([key, value]) => {
        if (value) {
          filteredData = filteredData.filter(row => {
            const rowValue = getNestedValue(row, key as string);
            return String(rowValue).toLowerCase().includes(String(value).toLowerCase());
          });
        }
      });
    }

    // Sorting
    if (sorting) {
      filteredData.sort((a, b) => {
        const aValue = getNestedValue(a, sorting.id);
        const bValue = getNestedValue(b, sorting.id);
        if (aValue < bValue) return sorting.desc ? 1 : -1;
        if (aValue > bValue) return sorting.desc ? -1 : 1;
        return 0;
      });
    }

    return filteredData;
  }, [data, globalFilter, columnFilters, sorting, columns, viewSettings]);

  const handleColumnFilterChange = (accessorKey: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [accessorKey]: value }));
  };

  const handleSort = (accessorKey: string) => {
    setSorting(prev => {
      const isDesc = prev && prev.id === accessorKey && !prev.desc;
      return { id: accessorKey, desc: !!isDesc };
    });
  };

  return (
    <div className={`card border shadow-sm ${viewSettings.tableHeight === 'Fixed' ? 'h-100' : ''}`} style={viewSettings.tableHeight === 'Fixed' ? { maxHeight: '600px' } : {}}>
      {/* Header Controls */}
      {viewSettings.showHeader && (
        <div className="card-header bg-light py-2 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <span className="small text-muted">Showing {filteredAndSortedData.length} of {data.length}</span>

            {viewSettings.showAdvancedSearch && (
              <>
                <div className="input-group input-group-sm" style={{ width: '200px' }}>
                  <span className="input-group-text bg-white border-end-0"><Search size={14} className="text-muted" /></span>
                  <input
                    type="text"
                    placeholder="Search all..."
                    value={globalFilter}
                    onChange={e => setGlobalFilter(e.target.value)}
                    className="form-control border-start-0"
                  />
                </div>
              </>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            {addButton}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="btn btn-sm btn-light border text-muted"
              title="Table Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      )}

      {!viewSettings.showHeader && (
        <div className="position-absolute top-0 end-0 m-2 z-1">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="btn btn-sm btn-light border shadow-sm"
            title="Table Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className={`table-responsive ${viewSettings.tableHeight === 'Fixed' ? 'flex-grow-1 overflow-auto' : ''}`}>
        <table className="table table-hover table-striped border-top-0 mb-0">
          <thead className="table-light sticky-top">
            <tr>
              {activeColumns.map(column => (
                <th
                  key={column.accessorKey as string}
                  style={{ width: column.width ? `${column.width}px` : 'auto', minWidth: column.width ? `${column.width}px` : 'auto' }}
                  className="align-middle py-2"
                >
                  {viewSettings.showColumnFilter ? (
                    <div className="position-relative d-flex align-items-center">
                      <input
                        type="text"
                        placeholder={column.header}
                        value={columnFilters[column.accessorKey as string] || ''}
                        onChange={e => handleColumnFilterChange(column.accessorKey as string, e.target.value)}
                        className="form-control form-control-sm"
                        style={{ paddingRight: '24px' }}
                      />
                      <button onClick={() => handleSort(column.accessorKey as string)} className="position-absolute end-0 btn btn-link text-muted p-1 text-decoration-none">
                        <ArrowUpDown size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-between cursor-pointer small fw-bold text-uppercase text-muted"
                      onClick={() => handleSort(column.accessorKey as string)}
                    >
                      {column.header}
                      <ArrowUpDown size={14} className="text-muted" />
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.map((row) => (
              <tr key={row.id}>
                {activeColumns.map((column) => (
                  <td
                    key={`${row.id}-${column.accessorKey as string}`}
                    style={{ width: column.width ? `${column.width}px` : 'auto' }}
                    className="align-middle text-nowrap"
                  >
                    <div className="text-truncate" style={{ maxWidth: column.width ? `${column.width}px` : '200px' }}>
                      {column.cell
                        ? column.cell({ row: { original: row } })
                        : String(getNestedValue(row, column.accessorKey as string) ?? '')}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SmartTableSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        columns={columnConfig}
        viewSettings={viewSettings}
        onApply={handleApplySettings}
      />
    </div>
  );
};

export default DataTable;