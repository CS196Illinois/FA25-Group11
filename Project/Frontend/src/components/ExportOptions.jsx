import React from 'react';
import './ExportOptions.css';

const ExportOptions = ({ items, onClose }) => {
  const exportToCSV = () => {
    const headers = ['Type', 'Code', 'Name', 'Credits', 'Description'];
    const rows = items.map(item => [
      item.type || 'unknown',
      item.code || '',
      item.name || '',
      item.credits || '',
      item.description || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `recommendations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `recommendations_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  const copyToClipboard = () => {
    const text = items.map(item => `${item.code} - ${item.name}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
      onClose();
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
  };

  return (
    <div className="export-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Export Recommendations</h2>
        <p className="export-subtitle">
          Export your {items.length} saved {items.length === 1 ? 'item' : 'items'}
        </p>
        
        <div className="export-options">
          <button className="export-button csv" onClick={exportToCSV}>
            <span className="export-icon">📊</span>
            <div>
              <div className="export-title">Export as CSV</div>
              <div className="export-desc">Spreadsheet format (.csv)</div>
            </div>
          </button>
          
          <button className="export-button json" onClick={exportToJSON}>
            <span className="export-icon">📄</span>
            <div>
              <div className="export-title">Export as JSON</div>
              <div className="export-desc">Structured data format (.json)</div>
            </div>
          </button>
          
          <button className="export-button clipboard" onClick={copyToClipboard}>
            <span className="export-icon">📋</span>
            <div>
              <div className="export-title">Copy to Clipboard</div>
              <div className="export-desc">Plain text list</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportOptions;

