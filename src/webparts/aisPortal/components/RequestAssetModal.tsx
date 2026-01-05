
import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { User, AssetFamily, AssetType, HardwareProduct, SoftwareProfile } from '../types';

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
    <>
      {isOpen && <div className="modal-backdrop fade show"></div>}
      <div className={`modal fade ${isOpen ? 'show d-block' : ''}`} tabIndex={-1} aria-hidden={!isOpen} onClick={onClose}>
        <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
          <div className="modal-content shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title fw-semibold text-dark">New Asset Request{category && `: ${category}`}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>

            <div className="modal-body p-4">
              <p className="small text-secondary mb-3">Select an asset type from the list below to submit a request for <span className="fw-semibold">{user.fullName}</span>.</p>
              <div className="position-relative mb-3">
                <Search className="position-absolute top-50 translate-middle-y text-secondary" style={{ left: '10px', width: '16px', height: '16px' }} />
                <input
                  type="text"
                  placeholder="Search for an asset type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control ps-5"
                />
              </div>

              <div className="list-group  mb-3" style={{ overflow: 'scroll', height: '340px' }}>
                {searchedFamilies.length > 0 ? searchedFamilies.map(family => (
                  <div
                    key={family.id}
                    onClick={() => setSelectedFamilyId(family.id)}
                    className={`list-group-item list-group-item-action cursor-pointer ${selectedFamilyId === family.id ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex w-100 justify-content-between">
                      <p className="mb-1 fw-semibold text-dark">{family.name}</p>
                    </div>
                    <p className={`mb-1 small ${selectedFamilyId === family.id ? 'text-white-50' : 'text-muted'}`}>{family.description || `${family.category} - ${family.assetType === AssetType.HARDWARE ? (family as HardwareProduct).manufacturer : (family as SoftwareProfile).vendor}`}</p>
                  </div>
                )) : (
                  <div className="text-center py-4 text-muted">
                    <p className="mb-0">No asset families found{category && ` in the ${category} category`}.</p>
                  </div>
                )}
              </div>

              <div className="mb-0">
                <label htmlFor="request-notes" className="form-label small fw-medium text-secondary mb-1">Notes (Optional)</label>
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

            <div className="modal-footer bg-light border-top">
              <button type="button" onClick={onClose} className="btn btn-light border text-secondary fw-medium">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedFamilyId}
                className="btn btn-primary fw-medium"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestAssetModal;