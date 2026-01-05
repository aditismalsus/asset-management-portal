import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';

interface ImageUploadTabProps {
    currentAvatar: string | undefined;
    onAvatarChange: (newUrl: string | undefined) => void;
    contactName: string;
    libraryImages: Record<string, string[]>;
    onImageUpload: (file: File, folder: string) => Promise<string>;
}

// Hardcoded fallback images removed, now using libraryImages from props

const NavButton: React.FC<{ active?: boolean; onClick: () => void; children: React.ReactNode; }> = ({ active, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`btn btn-sm w-100 text-start px-3 py-2 mb-1 border-0 rounded-2 ${active
            ? 'bg-primary-subtle text-primary fw-bold'
            : 'btn-light text-secondary'
            }`}
    >
        {children}
    </button>
);

const ImageUploadTab: React.FC<ImageUploadTabProps> = ({ currentAvatar, onAvatarChange, contactName, libraryImages, onImageUpload }) => {
    const [imageCategory, setImageCategory] = useState<string>('Logos');
    const [imageSourceTab, setImageSourceTab] = useState<'existing' | 'upload'>('existing');
    const [isUploading, setIsUploading] = useState(false);

    const activeGallery = useMemo(() => {
        return libraryImages[imageCategory] || [];
    }, [imageCategory, libraryImages]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const uploadedUrl = await onImageUpload(file, imageCategory);
            onAvatarChange(uploadedUrl);
            setImageSourceTab('existing');
        } catch (error) {
            alert("Upload failed. please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="row g-4">
            {/* Left Panel */}
            <div className="col-md-3">
                <div className="d-flex flex-column gap-1 mb-4">
                    <NavButton onClick={() => setImageCategory('Logos')} active={imageCategory === 'Logos'}>Logos</NavButton>
                    <NavButton onClick={() => setImageCategory('Covers')} active={imageCategory === 'Covers'}>Covers</NavButton>
                    <NavButton onClick={() => setImageCategory('Images')} active={imageCategory === 'Images'}>Images</NavButton>
                </div>
                {currentAvatar && (
                    <div className="card p-2 border-0 shadow-sm">
                        <img src={currentAvatar} alt="Current selection" className="card-img rounded-3" />
                        <button
                            type="button"
                            onClick={() => onAvatarChange(undefined)}
                            className="btn btn-sm btn-outline-danger w-100 mt-2 d-flex align-items-center justify-content-center gap-2">
                            <X size={14} /> Clear Image
                        </button>
                    </div>
                )}
            </div>

            {/* Right Panel */}
            <div className="col-md-9">
                <div className="row g-3 mb-4">
                    <div className="col-md-6">
                        <label htmlFor="imageUrl" className="form-label small text-secondary fw-bold" style={{ fontSize: '10px' }}>Image URL</label>
                        <input
                            type="text"
                            id="imageUrl"
                            name="imageUrl"
                            value={currentAvatar || ''}
                            onChange={(e) => onAvatarChange(e.target.value)}
                            className="form-control form-control-sm"
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small text-secondary fw-bold" style={{ fontSize: '10px' }}>Alternate Text</label>
                        <input
                            type="text"
                            value={contactName}
                            readOnly
                            className="form-control form-control-sm bg-light"
                        />
                    </div>
                </div>

                <div className="btn-group btn-group-sm w-100 bg-light p-1 rounded-3 mb-4">
                    <button type="button" onClick={() => setImageSourceTab('existing')} className={`btn border-0 py-2 rounded-2 ${imageSourceTab === 'existing' ? 'bg-white shadow-sm text-primary fw-bold' : 'text-secondary'}`}>
                        Choose from existing ({activeGallery.length})
                    </button>
                    <button type="button" onClick={() => setImageSourceTab('upload')} className={`btn border-0 py-2 rounded-2 ${imageSourceTab === 'upload' ? 'bg-white shadow-sm text-primary fw-bold' : 'text-secondary'}`}>
                        Upload
                    </button>
                </div>

                {imageSourceTab === 'existing' && (
                    <div className="row g-2">
                        {activeGallery.map((imgSrc, index) => (
                            <div key={index} className="col-4 col-sm-3 col-lg-2">
                                <button
                                    type="button"
                                    onClick={() => onAvatarChange(imgSrc)}
                                    className={`btn p-0 border-3 rounded-3 overflow-hidden w-100 aspect-square ${currentAvatar === imgSrc ? 'border-primary' : 'border-transparent'}`}
                                >
                                    <img src={imgSrc} alt={`Gallery ${index + 1}`} className="w-100 h-100 object-fit-cover" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {imageSourceTab === 'upload' && (
                    <div className="d-flex flex-column align-items-center justify-content-center border border-2 border-dashed rounded-4 p-4" style={{ height: '200px', backgroundColor: '#f8f9fa' }}>
                        {isUploading ? (
                            <div className="text-center">
                                <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                                <p className="text-secondary small mb-0">Uploading to {imageCategory}...</p>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="file"
                                    id="profile-image-upload"
                                    className="d-none"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="profile-image-upload" className="btn btn-primary px-4 fw-bold shadow-sm mb-2">
                                    Select Image File
                                </label>
                                <p className="text-secondary small fst-italic mb-0">Will be saved in {imageCategory} folder</p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageUploadTab;