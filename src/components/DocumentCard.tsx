import React from 'react';
import { FileText, Download } from 'lucide-react';

interface DocumentCardProps {
  title: string;
  description: string;
  onGenerate: () => void;
}

export default function DocumentCard({ title, description, onGenerate }: DocumentCardProps) {
  return (
    <div className="glass-panel" style={{
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'transform 0.2s ease',
      cursor: 'pointer'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          background: 'rgba(6, 182, 212, 0.1)',
          padding: '12px',
          borderRadius: '12px',
          color: 'var(--secondary)'
        }}>
          <FileText size={24} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{title}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, marginTop: '4px' }}>{description}</p>
        </div>
      </div>
      <button 
        className="btn-secondary" 
        onClick={onGenerate}
        style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '8px', width: '100%' }}
      >
        <Download size={18} />
        Generate PDF
      </button>
    </div>
  );
}
