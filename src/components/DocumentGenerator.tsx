'use client';
import React, { useState } from 'react';
import { FileText, Download, Eye, X } from 'lucide-react';
import jsPDF from 'jspdf';
import DocumentCard from './DocumentCard';

interface DocumentGeneratorProps {
  userName?: string;
}

export default function DocumentGenerator({ userName = '[Your Name]' }: DocumentGeneratorProps) {
  const [previewDoc, setPreviewDoc] = useState<{title: string, content: string} | null>(null);

  const getTemplate = (docType: string) => {
    if (docType === "FIR Draft") {
      return "To,\nThe Officer-in-Charge,\n[Police Station Name],\n[City/District]\n\nSubject: First Information Report regarding [Brief Description of Incident]\n\nRespected Sir/Madam,\nI, " + userName + ", residing at [Your Address], would like to bring to your attention that on [Date] at around [Time], [Describe the incident in detail...]\n\nI request you to kindly register an FIR and take necessary legal action.\n\nYours faithfully,\n[Signature]\n" + userName + "\n[Contact Info]";
    } else if (docType === "Consumer Complaint") {
      return "BEFORE THE DISTRICT CONSUMER DISPUTES REDRESSAL FORUM\n[City Name]\n\nComplaint No: ________ / 20__\n\n" + userName + " ... Complainant\nVs.\n[Company/Seller Name] ... Opposite Party\n\nSubject: Complaint for deficiency in service / unfair trade practice\n\nSir/Madam,\nThe complainant respectfully submits as under:\n1. On [Date], I purchased [Product/Service] for Rs. [Amount].\n2. The product/service was defective/deficient because [Reason].\n3. I request a refund/replacement and compensation for mental agony.\n\nSignature: ___________";
    } else if (docType === "RTI Application") {
      return "To,\nThe Public Information Officer,\n[Name of Department/Ministry],\n[Address]\n\nSubject: Application under RTI Act, 2005\n\n1. Name of the Applicant: " + userName + "\n2. Address: [Your Address]\n3. Particulars of Information required: [List your questions here]\n4. Period to which the information relates: [e.g., 2024-2025]\n5. I am a citizen of India.\n6. I have paid the application fee of Rs. 10 via [Mode of payment].\n\nDate: " + new Date().toLocaleDateString() + "\nSignature: ___________";
    }
    return "[Standard Legal Draft Template]\nPlease fill in the specific details relevant to your case.\nThis is an AI generated draft to help you get started.";
  };

  const handlePreview = (title: string) => {
    setPreviewDoc({ title, content: getTemplate(title) });
  };

  const handleDownload = (title: string, content: string) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(`NyayaMitra - ${title}`, 20, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.line(20, 35, 190, 35);
    const splitText = doc.splitTextToSize(content, 170);
    doc.text(splitText, 20, 50);
    doc.save(`${title.replace(/\s+/g, '_')}_Draft.pdf`);
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>Auto Document Generator</h2>
        <p style={{ color: 'var(--text-muted)' }}>Generate legally structured drafts in seconds. Preview and download as PDF.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        <DocumentCard 
          title="FIR Draft" 
          description="Report a crime or incident to the police." 
          onGenerate={() => handlePreview('FIR Draft')} 
        />
        <DocumentCard 
          title="Consumer Complaint" 
          description="File a complaint against a seller or service provider." 
          onGenerate={() => handlePreview('Consumer Complaint')} 
        />
        <DocumentCard 
          title="RTI Application" 
          description="Request information from government authorities." 
          onGenerate={() => handlePreview('RTI Application')} 
        />
        <DocumentCard 
          title="Legal Notice" 
          description="Formal notice before taking legal action." 
          onGenerate={() => handlePreview('Legal Notice')} 
        />
      </div>

      {previewDoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '24px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '32px',
            position: 'relative'
          }}>
            <button 
              onClick={() => setPreviewDoc(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={24} />
            </button>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: 'var(--text-main)' }}>Preview: {previewDoc.title}</h3>
            
            <div style={{
              flex: 1,
              overflowY: 'auto',
              background: 'rgba(255,255,255,0.05)',
              padding: '24px',
              borderRadius: '12px',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              color: 'var(--text-main)',
              lineHeight: '1.6',
              marginBottom: '24px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {previewDoc.content}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setPreviewDoc(null)}
              >
                Close
              </button>
              <button 
                className="btn-primary"
                onClick={() => handleDownload(previewDoc.title, previewDoc.content)}
              >
                <Download size={18} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    <style jsx>{`
      @media (max-width: 768px) {
        .glass-panel { padding: 20px !important; width: 95% !important; margin: 10px !important; }
        .preview-header { font-size: 1.2rem !important; }
        .action-btns { flex-direction: column !important; width: 100% !important; }
        .action-btns button { width: 100% !important; }
      }
    `}</style>
    </div>
  );
}
