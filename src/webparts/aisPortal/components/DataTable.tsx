
import React, { useState, useMemo, useEffect } from 'react';
import { ColumnDef } from '../types';
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
    <div className={`card border shadow-sm d-flex flex-column ${viewSettings.tableHeight === 'Fixed' ? 'h-100' : ''}`} style={{ height: viewSettings.tableHeight === 'Fixed' ? '600px' : 'auto' }}>
      {/* Header Controls */}
      {viewSettings.showHeader && (
        <div className="card-header bg-light border-bottom p-2 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <span className="small text-secondary ps-2">Showing {filteredAndSortedData.length} of {data.length}</span>

            {viewSettings.showAdvancedSearch && (
              <>
                <div className="position-relative">
                  <Search className="position-absolute top-50 translate-middle-y text-secondary" style={{ left: '0.5rem', width: '1rem', height: '1rem' }} />
                  <input
                    type="text"
                    placeholder="Search all..."
                    value={globalFilter}
                    onChange={e => setGlobalFilter(e.target.value)}
                    className="form-control form-control-sm ps-4"
                    style={{ width: '200px', paddingLeft: '1.75rem' }}
                  />
                </div>
                <div className="position-relative">
                  <select className="form-select form-select-sm" style={{ width: '140px' }}>
                    <option>All Words</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            {addButton}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="btn btn-sm btn-light text-secondary"
              title="Table Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      )}

      {!viewSettings.showHeader && (
        <div className="position-absolute top-0 end-0 p-2 z-3">
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
      <div className={`table-responsive ${viewSettings.tableHeight === 'Fixed' ? 'flex-fill overflow-y-auto' : ''}`}>
        <table className="table table-hover table-bordered mb-0 align-middle">
          <thead className="table-light sticky-top shadow-sm z-1">
            <tr>
              {activeColumns.map(column => (
                <th
                  key={column.accessorKey as string}
                  style={{ width: column.width ? `${column.width}px` : 'auto' }}
                  className="text-start bg-light"
                >
                  {viewSettings.showColumnFilter ? (
                    <div className="position-relative d-flex align-items-center">
                      <input
                        type="text"
                        placeholder={column.header}
                        value={columnFilters[column.accessorKey as string] || ''}
                        onChange={e => handleColumnFilterChange(column.accessorKey as string, e.target.value)}
                        className="form-control form-control-sm border-0 bg-transparent shadow-none p-0 fw-bold text-secondary"
                      />
                      <button onClick={() => handleSort(column.accessorKey as string)} className="btn btn-sm btn-link text-secondary p-0 ms-auto">
                        <ArrowUpDown size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-between cursor-pointer small fw-bold text-secondary text-uppercase"
                      onClick={() => handleSort(column.accessorKey as string)}
                    >
                      {column.header}
                      <ArrowUpDown size={14} className="text-secondary opacity-50" />
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
                    className="px-2 py-2"
                  >
                    <div className="text-truncate" style={{ maxWidth: column.width ? `${column.width - 16}px` : '200px' }}>
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
