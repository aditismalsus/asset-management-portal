import * as React from 'react';
import { useState, useMemo } from 'react';
import { X } from 'lucide-react';

interface ImageUploadTabProps {
    currentAvatar: string | undefined;
    onAvatarChange: (newUrl: string | undefined) => void;
    contactName: string;
}

const logoImages = [
    'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=2069&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1529612453803-b038531649c5?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611162616805-6a406b2a1a1a?q=80&w=1974&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1548345680-f5475ea5df84?q=80&w=2073&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=1889&auto=format&fit=crop',
];

const coverImages = [
    'https://images.unsplash.com/photo-1549492423-400259a5e5a4?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1473187983305-f61531474237?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506259996624-9f2f5e7b3b9b?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1444044205806-38f376274260?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1533109721025-d1ae7de64092?q=80&w=1887&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1496902526517-c0f2cb8fdb6a?q=80&w=2070&auto=format&fit=crop',
];

const generalImages = [
    'https://images.unsplash.com/photo-1551887373-3c5bd21ffd05?q=80&w=1925&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1502920514358-906c5555a69e?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516048015710-7a3b4c86be43?q=80&w=1887&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509223103693-5e7836798094?q=80&w=2069&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1887&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1887&auto=format&fit=crop',
];

const NavButton: React.FC<{ active?: boolean; onClick: () => void; children: React.ReactNode; isVertical?: boolean; }> = ({ active, onClick, children, isVertical }) => (
    <button
        type="button"
        onClick={onClick}
        className={`btn btn-sm ${active ? 'btn-primary-subtle text-primary fw-bold' : 'btn-light text-muted'} ${isVertical ? 'w-100 text-start mb-1' : ''}`}
    >
        {children}
    </button>
);

const ImageUploadTab: React.FC<ImageUploadTabProps> = ({ currentAvatar, onAvatarChange, contactName }) => {
    const [imageCategory, setImageCategory] = useState('Logos');
    const [imageSourceTab, setImageSourceTab] = useState('existing');

    const activeGallery = useMemo(() => {
        switch (imageCategory) {
            case 'Logos': return logoImages;
            case 'Covers': return coverImages;
            case 'Images': return generalImages;
            default: return [];
        }
    }, [imageCategory]);

    return (
        <div className="row h-100">
            {/* Left Panel */}
            <div className="col-12 col-md-3 border-end">
                <div className="mb-3">
                    <NavButton onClick={() => setImageCategory('Logos')} active={imageCategory === 'Logos'} isVertical>Logos</NavButton>
                    <NavButton onClick={() => setImageCategory('Covers')} active={imageCategory === 'Covers'} isVertical>Covers</NavButton>
                    <NavButton onClick={() => setImageCategory('Images')} active={imageCategory === 'Images'} isVertical>Images</NavButton>
                </div>
                {currentAvatar && (
                    <div className="card shadow-sm p-2">
                        <img src={currentAvatar} alt="Current selection" className="img-fluid rounded mb-2 object-cover" style={{ aspectRatio: '1/1' }} />
                        <button
                            type="button"
                            onClick={() => onAvatarChange(undefined)}
                            className="btn btn-sm btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-1">
                            <X size={14} /> Clear Image
                        </button>
                    </div>
                )}
            </div>

            {/* Right Panel */}
            <div className="col-12 col-md-9 pt-3 pt-md-0">
                <div className="row g-3 mb-4">
                    <div className="col-md-6">
                        <label htmlFor="imageUrl" className="form-label small text-muted">Image-Url</label>
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
                        <label htmlFor="altText" className="form-label small text-muted">Selected image alternate text</label>
                        <input
                            type="text"
                            id="altText"
                            name="altText"
                            value={contactName}
                            readOnly
                            className="form-control form-control-sm bg-light"
                        />
                    </div>
                </div>

                <div className="bg-light p-2 rounded mb-3 d-flex gap-2">
                    <NavButton onClick={() => setImageSourceTab('existing')} active={imageSourceTab === 'existing'}>
                        Choose from existing ({activeGallery.length})
                    </NavButton>
                    <NavButton onClick={() => setImageSourceTab('upload')} active={imageSourceTab === 'upload'}>
                        Upload
                    </NavButton>
                </div>

                {imageSourceTab === 'existing' && (
                    <div className="row row-cols-3 row-cols-sm-4 row-cols-md-5 g-2">
                        {activeGallery.map((imgSrc, index) => (
                            <div className="col" key={index}>
                                <button
                                    type="button"
                                    onClick={() => onAvatarChange(imgSrc)}
                                    className={`btn p-0 border-0 rounded overflow-hidden w-100 ${currentAvatar === imgSrc ? 'ring-2 ring-primary border-primary border border-2' : ''}`}
                                    style={{ aspectRatio: '1/1' }}
                                >
                                    <img src={imgSrc} alt={`Gallery image ${index + 1}`} className="w-100 h-100 object-cover" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {imageSourceTab === 'upload' && (
                    <div className="d-flex align-items-center justify-content-center border rounded py-5 bg-light text-muted">
                        <small>Upload functionality is not yet available.</small>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageUploadTab;