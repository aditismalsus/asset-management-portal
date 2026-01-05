
import React, { useState } from 'react';
import { Asset, User, ColumnDef, AssetStatus, AssetFamily, SoftwareProfile, HardwareProduct, AssetType, LicenseVariant } from '../types';
import DataTable from './DataTable';
import { Settings, Edit, FilePenLine, Plus, Layers, Package } from 'lucide-react';

interface AssetProfileProps {
  family: AssetFamily;
  allAssets: Asset[];
  onBack: () => void;
  onEditAsset: (asset: Asset) => void;
  onEditFamily: (family: AssetFamily) => void;
  onAddInstance: (family: AssetFamily) => void;
  onBulkCreate: (family: AssetFamily, variantName: string, quantity: number, commonData: Partial<Asset>) => void;
  onUserClick: (user: User) => void;
}

const InfoPair: React.FC<{ label: string, value: string | number | undefined }> = ({ label, value }) => (
  <div className="mb-2">
    <p className="small text-secondary fw-medium mb-0">{label}</p>
    <p className="small fw-semibold text-dark mb-0">{value || '-'}</p>
  </div>
);

const VariantCard: React.FC<{ variant: LicenseVariant }> = ({ variant }) => (
  <div className="card mb-2 border shadow-sm">
    <div className="card-body p-3">
      <h6 className="fw-semibold text-primary mb-2">{variant.name}</h6>
      <div className="small text-secondary">
        <p className="mb-1"><span className="fw-medium">Type:</span> {variant.licenseType}</p>
        <p className="mb-0"><span className="fw-medium">Cost:</span> ${variant.cost.toFixed(2)}</p>
      </div>
    </div>
  </div>
);

const FormRadioGroup: React.FC<{
  label: string;
  name: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, name, value, options, onChange }) => (
  <div className="mb-3">
    <label className="form-label small fw-medium text-secondary mb-2">{label}</label>
    <div className="d-flex flex-wrap gap-2">
      {options.map((option) => (
        <React.Fragment key={option.value}>
          <input
            type="radio"
            name={name}
            id={`${name}-${option.value}`}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            className="btn-check"
            autoComplete="off"
          />
          <label className={`btn btn-sm rounded-pill ${value === option.value ? 'btn-primary' : 'btn-outline-secondary'}`} htmlFor={`${name}-${option.value}`}>
            {option.label}
          </label>
        </React.Fragment>
      ))}
    </div>
  </div>
);


const BulkCreateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  family: SoftwareProfile;
  onSubmit: (variantName: string, quantity: number, commonData: Partial<Asset>) => void;
}> = ({ isOpen, onClose, family, onSubmit }) => {
  const [variantName, setVariantName] = useState(family.variants[0]?.name || '');
  const [quantity, setQuantity] = useState(1);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [cost, setCost] = useState(family.variants[0]?.cost || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const commonData: Partial<Asset> = { purchaseDate, expiryDate, cost };
    onSubmit(variantName, quantity, commonData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex={-1} onClick={onClose}>
        <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
          <form onSubmit={handleSubmit} className="modal-content shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title fw-bold">Bulk Create Licenses for {family.name}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <FormRadioGroup
                label="Select Variant"
                name="variant"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                options={family.variants.map(v => ({ value: v.name, label: v.name }))}
              />
              <div className="mb-3">
                <label className="form-label small fw-medium text-secondary mb-1">Quantity</label>
                <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value, 10))} min="1" className="form-control" placeholder="Quantity" />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-medium text-secondary mb-1">Purchase Date</label>
                <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="form-control" />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-medium text-secondary mb-1">Expiry Date</label>
                <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="form-control" />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-medium text-secondary mb-1">Cost per License</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input type="number" step="0.01" value={cost} onChange={e => setCost(parseFloat(e.target.value))} className="form-control" placeholder="0.00" />
                </div>
              </div>
            </div>
            <div className="modal-footer bg-light border-top">
              <button type="button" onClick={onClose} className="btn btn-light border text-secondary fw-medium">Cancel</button>
              <button type="submit" className="btn btn-primary fw-medium">Create Licenses</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};


const AssetProfile: React.FC<AssetProfileProps> = ({ family, allAssets, onBack, onEditAsset, onEditFamily, onAddInstance, onBulkCreate, onUserClick }) => {
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const familyAssets = React.useMemo(() => {
    return allAssets.filter(a => a.familyId === family.id);
  }, [allAssets, family]);

  const assignedCount = familyAssets.filter(a => (a.assignedUser || (a.assignedUsers && a.assignedUsers.length > 0))).length;
  const totalAssets = familyAssets.length;

  const isSoftware = family.assetType === AssetType.LICENSE;

  const calculatePeriod = (purchase: string | undefined, expiry: string | undefined): string => {
    if (!purchase || !expiry) return '';
    try {
      const start = new Date(purchase);
      const end = new Date(expiry);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

      if (months === 12) return '1 Year';
      if (months === 1) return '1 Month';
      if (months % 12 === 0) return `${months / 12} Years`;
      if (months < 12) return `${months} Months`;
      return `${months} Months`; // Fallback
    } catch {
      return '';
    }
  };

  const columns: ColumnDef<Asset>[] = [
    { accessorKey: 'assetId', header: 'Asset-ID', width: 140 },
    { accessorKey: 'title', header: 'Title', width: 140 },
    ...(isSoftware ? [
      { accessorKey: 'variantType', header: 'Variant', width: 100 },
      {
        accessorKey: 'assignedUsers',
        header: 'Assigned User(s)',
        width: 180,
        cell: ({ row }: { row: { original: Asset } }) => {
          const users = row.original.assignedUsers || [];
          if (users.length === 0) return <span className="text-slate-400">-</span>;
          return (

            <div className="d-flex flex-column">
              {users.map(user => (
                <button key={user.id} onClick={() => onUserClick(user)} className="btn btn-link text-primary text-decoration-none p-0 text-start text-truncate">
                  {user.fullName}
                </button>
              ))}
            </div>
          )
        },
      },
      { accessorKey: 'email', header: 'Email', width: 200 },
      {
        accessorKey: 'expiryDate',
        header: 'Expiry',
        width: 160,
        cell: ({ row }: { row: { original: Asset } }) => {
          const period = calculatePeriod(row.original.purchaseDate, row.original.expiryDate);
          const dateStr = row.original.expiryDate ? row.original.expiryDate.split('T')[0] : '-';
          return (
            <div>
              <div className="text-dark">{dateStr}</div>
              {period && <div className="small fw-medium text-primary bg-primary-subtle px-2 rounded">{period}</div>}
            </div>
          )
        }
      },
    ] : [
      {
        accessorKey: 'assignedUser.fullName',
        header: 'Assigned User',
        width: 180,
        cell: ({ row }: { row: { original: Asset } }) => row.original.assignedUser ? (
          <button onClick={() => onUserClick(row.original.assignedUser!)} className="btn btn-link text-primary text-decoration-none p-0 fw-medium text-start text-truncate w-100">
            {row.original.assignedUser.fullName}
          </button>
        ) : <span className="text-secondary">-</span>,
      },
      { accessorKey: 'serialNumber', header: 'Serial Number', width: 140 },
      { accessorKey: 'location', header: 'Location', width: 150 },
      { accessorKey: 'condition', header: 'Condition', width: 120, cell: ({ row }: { row: { original: Asset } }) => <span>{row.original.condition}</span> },
      { accessorKey: 'modelNumber', header: 'Model', width: 120, cell: ({ row }: { row: { original: Asset } }) => <span>{row.original.modelNumber || (family as HardwareProduct).modelNumber}</span> },
      { accessorKey: 'os', header: 'OS', width: 140, cell: ({ row }: { row: { original: Asset } }) => <span>{row.original.os || '-'}</span> },
      { accessorKey: 'warrantyExpiryDate', header: 'Warranty Ends', width: 120 },
      { accessorKey: 'purchaseDate', header: 'Purchase Date', width: 120 },
      { accessorKey: 'cost', header: 'Cost', width: 100, cell: ({ row }: { row: { original: Asset } }) => <span>{row.original.cost ? `$${row.original.cost}` : '-'}</span> },
    ]),
    {
      accessorKey: 'status', header: 'Status', width: 100, cell: ({ row }) => (
        <span className={`badge rounded-pill
            ${row.original.status === AssetStatus.ACTIVE ? 'bg-success-subtle text-success-emphasis' : ''}
            ${row.original.status === AssetStatus.AVAILABLE || row.original.status === AssetStatus.STORAGE ? 'bg-info-subtle text-info-emphasis' : ''}
            ${row.original.status === AssetStatus.EXPIRED || row.original.status === AssetStatus.RETIRED ? 'bg-danger-subtle text-danger-emphasis' : ''}
            ${row.original.status === AssetStatus.IN_REPAIR || row.original.status === AssetStatus.PENDING ? 'bg-warning-subtle text-warning-emphasis' : ''}
            ${row.original.status === AssetStatus.INACTIVE ? 'bg-secondary-subtle text-secondary-emphasis' : ''}
        `}>
          {row.original.status}
        </span>
      )
    },
    {
      accessorKey: 'actions',
      header: '',
      width: 60,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2 text-slate-500">
          <button onClick={() => onEditAsset(row.original)} className="btn btn-sm btn-light text-secondary rounded-circle p-1 hover-text-primary">
            <FilePenLine size={16} />
          </button>
        </div>
      ),
    }
  ];

  const addButton = (
    <div className="d-flex align-items-center gap-2">
      {isSoftware && (
        <button
          onClick={() => setIsBulkModalOpen(true)}
          className="btn btn-sm btn-secondary shadow-sm d-flex align-items-center gap-2">
          <Layers size={16} /> Bulk Create
        </button>
      )}
      <button
        onClick={() => onAddInstance(family)}
        className="btn btn-sm btn-primary shadow-sm d-flex align-items-center gap-2">
        <Plus size={16} /> Add {isSoftware ? 'License' : 'Hardware'}
      </button>
    </div>
  );

  return (
    <div className="container-xxl p-0">
      <div className="d-flex flex-column gap-4">
        <div className="small text-secondary mb-2">
          <button onClick={onBack} className="btn btn-link p-0 text-decoration-none small text-primary fw-medium">Asset Repository</button>
          <span className="mx-2">/</span>
          <span className="fw-medium text-dark">{family.name}</span>
        </div>

        <div className="row g-4">
          {/* Left Panel */}
          <div className="col-12 col-lg-4 col-xl-3 space-y-4">
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <h5 className="fw-bold text-dark d-flex align-items-center gap-2 m-0">
                    {isSoftware ? <Settings size={22} className="text-primary" /> : <Package size={22} className="text-success" />}
                    {family.name}
                  </h5>
                  <button onClick={() => onEditFamily(family)} className="btn btn-link text-secondary p-0 hover-text-primary"><Edit size={16} /></button>
                </div>
                <div className="mt-4 row g-3">
                  <div className="col-6"><InfoPair label="Category" value={family.category} /></div>
                  <div className="col-6"><InfoPair label={isSoftware ? "Vendor" : "Manufacturer"} value={(family as any).vendor || (family as any).manufacturer} /></div>
                  <div className="col-6"><InfoPair label="Total" value={totalAssets} /></div>
                  <div className="col-6"><InfoPair label="Assigned" value={assignedCount} /></div>
                  <div className="col-6"><InfoPair label="Available" value={totalAssets - assignedCount} /></div>
                  <div className="col-6"><InfoPair label="Product Code" value={(family as any).productCode} /></div>
                </div>
                {family.description && (
                  <div className="mt-4 pt-3 border-top">
                    <p className="small text-secondary fw-medium mb-1">Description</p>
                    <p className="small text-dark mb-0">{family.description}</p>
                  </div>
                )}
              </div>
            </div>
            {isSoftware && (
              <div className="card shadow-sm border-0 mt-4">
                <div className="card-body p-4">
                  <h6 className="fw-bold text-dark mb-3">License Variants</h6>
                  <div className="d-flex flex-column gap-2">
                    {(family as SoftwareProfile).variants.map(v => <VariantCard key={v.id} variant={v} />)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="col-12 col-lg-8 col-xl-9">
            <DataTable
              columns={columns}
              data={familyAssets}
              addButton={addButton}
            />
          </div>
        </div>
      </div>
      {isSoftware && <BulkCreateModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} family={family as SoftwareProfile} onSubmit={(v, q, c) => onBulkCreate(family, v, q, c)} />}
    </div>
  );
};

export default AssetProfile;