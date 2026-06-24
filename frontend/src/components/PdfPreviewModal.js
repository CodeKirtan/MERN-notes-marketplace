import React from 'react';

const PdfPreviewModal = ({ url, title, onClose }) => {
  // If we ever need auth logic inside the viewer
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button 
            className="btn-close-modal" 
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <iframe 
            src={`${url}#toolbar=0`} 
            title="Notes PDF Preview" 
            className="pdf-iframe"
          />
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
