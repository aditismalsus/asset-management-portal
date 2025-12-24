import * as React from 'react';
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { User, AssetFamily, AssetType, HardwareProduct, SoftwareProfile } from '../../assetManagementPortal/types';

interface RequestAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (familyId: string, notes: string) => void;
  user: User;
  assetFamilies: AssetFamily[];
  category: 'Microsoft' | 'External' | 'Hardware' | null;
}

const RequestAssetModal: React.FC<RequestAssetModalProps> = ({ isOpen, onClose, onSubmit, user, assetFamilies, category }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const availableFamilies = useMemo(() => {
    if (!category) return assetFamilies;

    const categoryMap = {
      'Microsoft': { type: AssetType.LICENSE, category: 'Microsoft' },
      'External': { type: AssetType.LICENSE, category: 'External' },
      'Hardware': { type: AssetType.HARDWARE, category: null }
    };

    const catDetails = categoryMap[category];

    return assetFamilies.filter(family => {
      if (catDetails.type === AssetType.HARDWARE) {
        return family.assetType === AssetType.HARDWARE;
      }
      return family.assetType === catDetails.type && family.category === catDetails.category;
    });
  }, [assetFamilies, category]);

  const searchedFamilies = useMemo(() => {
    if (!searchTerm) {
      return availableFamilies;
    }
    return availableFamilies.filter(family =>
      family.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableFamilies, searchTerm]);


  const handleSubmit = () => {
    if (selectedFamilyId) {
      onSubmit(selectedFamilyId, notes);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block bg-dark bg-opacity-50" tabIndex={-1} role="dialog">
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content shadow">
          <div className="modal-header border-bottom-0 pb-0">
            <h5 className="modal-title fw-bold">New Asset Request{category && `: ${category}`}</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>

          <div className="modal-body">
            <p className="text-muted small mb-3">Select an asset type from the list below to submit a request for <span className="fw-bold text-dark">{user.fullName}</span>.</p>

            <div className="input-group mb-3">
              <span className="input-group-text bg-light border-end-0"><Search size={16} className="text-muted" /></span>
              <input
                type="text"
                placeholder="Search for an asset type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control border-start-0"
              />
            </div>

            <div className="list-group mb-4 overflow-auto custom-scrollbar" style={{ maxHeight: '250px' }}>
              {searchedFamilies.length > 0 ? searchedFamilies.map(family => (
                <button
                  key={family.id}
                  onClick={() => setSelectedFamilyId(family.id)}
                  className={`list-group-item list-group-item-action border rounded mb-2 ${selectedFamilyId === family.id ? 'active border-primary' : ''}`}
                >
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1 fw-bold">{family.name}</h6>
                  </div>
                  <small className={selectedFamilyId === family.id ? 'text-white-50' : 'text-muted'}>{family.description || `${family.category} - ${family.assetType === AssetType.HARDWARE ? (family as HardwareProduct).manufacturer : (family as SoftwareProfile).vendor}`}</small>
                </button>
              )) : (
                <div className="text-center py-4 text-muted">
                  <small>No asset families found{category && ` in the ${category} category`}.</small>
                </div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="request-notes" className="form-label small fw-bold">Notes (Optional)</label>
              <textarea
                id="request-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Provide a reason for your request..."
                className="form-control"
              />
            </div>
          </div>

          <div className="modal-footer bg-light border-top-0">
            <button type="button" onClick={onClose} className="btn btn-light border">Cancel</button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedFamilyId}
              className="btn btn-primary"
            >
              Submit Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestAssetModal;