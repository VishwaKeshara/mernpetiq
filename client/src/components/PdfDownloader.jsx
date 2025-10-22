import React from 'react';
import jsPDF from 'jspdf';

export default function PdfDownloader({ records = [] }) {
  const handleDownload = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yOffset = 40;

    // Add elegant background pattern
    doc.setFillColor(255, 250, 245); // Very light orange background
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Add subtle header border
    doc.setDrawColor(255, 152, 0); // Primary orange color
    doc.setLineWidth(0.5);
    doc.line(20, 25, pageWidth - 20, 25);
    doc.line(20, 27, pageWidth - 20, 27);

    // Add decorative corners
    const cornerSize = 15;
    [[20, 20], [pageWidth - 20, 20], [20, pageHeight - 20], [pageWidth - 20, pageHeight - 20]].forEach(([x, y]) => {
      doc.setDrawColor(255, 183, 77); // Lighter orange
      doc.setLineWidth(0.5);
      doc.line(x - cornerSize, y, x + cornerSize, y);
      doc.line(x, y - cornerSize, x, y + cornerSize);
    });

    // Add title with elegant styling
    doc.setFont("times", "bold");
    doc.setFontSize(32);
    doc.setTextColor(255, 128, 0); // Slightly darker orange
    const title = 'Medical Records';
    const titleWidth = doc.getStringUnitWidth(title) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(title, titleX, 35);

    // Add subtle border for the page
    doc.setDrawColor(255, 152, 0);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageWidth - 20, doc.internal.pageSize.height - 20);

    yOffset = 70; // Adjust starting position for content
    
    // Add records with enhanced styling
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);

    records.forEach((record, index) => {
      // Elegant section divider
      const recordTitle = `Record ${index + 1}`;
      doc.setFont("times", "bold");
      doc.setFontSize(24);
      doc.setTextColor(139, 69, 19);
      doc.text(recordTitle, 30, yOffset);
      
      // Decorative underline
      const titleWidth = doc.getStringUnitWidth(recordTitle) * doc.getFontSize() / doc.internal.scaleFactor;
      doc.setDrawColor(210, 180, 140);
      doc.setLineWidth(0.5);
      doc.line(30, yOffset + 2, 30 + titleWidth + 10, yOffset + 2);
      
      yOffset += 20;

      // Record content with elegant categories
      doc.setFont("times", "normal");
      const categories = {
        "Pet Information": ["petName", "petType", "breed", "age", "weight"],
        "Owner Information": ["ownerName", "ownerContact"],
        "Medical Details": ["symptoms", "diagnosis", "treatment", "prescription"],
        "Visit Information": ["visitDate", "veterinarianName", "notes"]
      };

      Object.entries(categories).forEach(([category, fields]) => {
        let hasData = false;
        const categoryData = fields.filter(field => record[field]);
        
        if (categoryData.length > 0) {
          // Check if we need a new page
          if (yOffset > 250) {
            doc.addPage();
            yOffset = 30;
            // Redraw border on new page
            doc.rect(10, 10, pageWidth - 20, doc.internal.pageSize.height - 20);
          }

          // Category header
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 100, 100);
          doc.text(category, 25, yOffset);
          yOffset += 8;

          // Category content
          doc.setFont("helvetica", "normal");
          doc.setTextColor(50, 50, 50);
          categoryData.forEach(field => {
            if (record[field]) {
              const label = field.replace(/([A-Z])/g, ' $1').toLowerCase();
              const value = record[field];
              const text = `${label.charAt(0).toUpperCase() + label.slice(1)}: ${value}`;
              
              // Handle long text with wrapping
              const textLines = doc.splitTextToSize(text, pageWidth - 60);
              textLines.forEach(line => {
                if (yOffset > 270) {
                  doc.addPage();
                  yOffset = 30;
                  // Redraw border on new page
                  doc.rect(10, 10, pageWidth - 20, doc.internal.pageSize.height - 20);
                }
                doc.text(line, 30, yOffset);
                yOffset += 7;
              });
            }
          });
          yOffset += 5;
        }
      });
      yOffset += 10;
    });

    doc.save('medical_records.pdf');
  };

  return (
    <div>
      <button onClick={handleDownload} className="px-4 py-2 bg-blue-600 text-white rounded">Download Records</button>
    </div>
  );
}

export function QuickDownloadButton({ record }) {
  const handleDownload = () => {
    if (!record) {
      console.error('No record provided');
      return;
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yOffset = 40;

    // Add elegant background
    doc.setFillColor(255, 250, 245); // Very light orange background
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Add subtle header border
    doc.setDrawColor(255, 152, 0); // Primary orange color
    doc.setLineWidth(0.5);
    doc.line(20, 25, pageWidth - 20, 25);
    doc.line(20, 27, pageWidth - 20, 27);

    // Add decorative corners
    const cornerSize = 15;
    [[20, 20], [pageWidth - 20, 20], [20, pageHeight - 20], [pageWidth - 20, pageHeight - 20]].forEach(([x, y]) => {
      doc.setDrawColor(255, 183, 77); // Lighter orange
      doc.setLineWidth(0.5);
      doc.line(x - cornerSize, y, x + cornerSize, y);
      doc.line(x, y - cornerSize, x, y + cornerSize);
    });

    // Add title with elegant styling
    doc.setFont("times", "bold");
    doc.setFontSize(32);
    doc.setTextColor(255, 128, 0); // Orange title
    const title = `Medical Record - ${record.petName || 'Unknown Pet'}`;
    const titleWidth = doc.getStringUnitWidth(title) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(title, titleX, 35);
    
    // Add decorative title underline
    doc.setDrawColor(255, 183, 77); // Lighter orange
    doc.setLineWidth(0.5);
    doc.line(titleX, 38, titleX + titleWidth, 38);

    yOffset = 70; // Adjust starting position for content

    // Organize data into categories
    const categories = {
      "Pet Information": ["petName", "petType", "breed", "age", "weight"],
      "Owner Information": ["ownerName", "ownerContact"],
      "Medical Details": ["symptoms", "diagnosis", "treatment", "prescription"],
      "Visit Information": ["visitDate", "veterinarianName", "notes"]
    };

    // Add content with elegant styling
    Object.entries(categories).forEach(([category, fields]) => {
      const categoryData = fields.filter(field => record[field]);
      
      if (categoryData.length > 0) {
        // Check if we need a new page
        if (yOffset > 250) {
          doc.addPage();
          yOffset = 30;
          // Redraw corner decorations on new page
          [[20, 20], [pageWidth - 20, 20], [20, pageHeight - 20], [pageWidth - 20, pageHeight - 20]].forEach(([x, y]) => {
            doc.setDrawColor(210, 180, 140);
            doc.setLineWidth(0.5);
            doc.line(x - cornerSize, y, x + cornerSize, y);
            doc.line(x, y - cornerSize, x, y + cornerSize);
          });
        }

        // Elegant category header
        doc.setFont("times", "bold");
        doc.setFontSize(16);
        doc.setTextColor(139, 69, 19);
        doc.text(category, 35, yOffset);
        
        // Decorative category underline
        const catWidth = doc.getStringUnitWidth(category) * doc.getFontSize() / doc.internal.scaleFactor;
        doc.setDrawColor(210, 180, 140);
        doc.setLineWidth(0.3);
        doc.line(35, yOffset + 1, 35 + catWidth, yOffset + 1);
        yOffset += 10;

        // Category content with elegant formatting
        doc.setFont("times", "normal");
        doc.setFontSize(12);
        doc.setTextColor(70, 70, 70);
        categoryData.forEach(field => {
          if (record[field]) {
            const label = field.replace(/([A-Z])/g, ' $1').toLowerCase();
            const value = record[field];
            const labelText = `${label.charAt(0).toUpperCase() + label.slice(1)}:`;
            
            // Two-column layout for label and value
            if (yOffset > 270) {
              doc.addPage();
              yOffset = 30;
              // Redraw corner decorations on new page
              [[20, 20], [pageWidth - 20, 20], [20, pageHeight - 20], [pageWidth - 20, pageHeight - 20]].forEach(([x, y]) => {
                doc.setDrawColor(210, 180, 140);
                doc.setLineWidth(0.5);
                doc.line(x - 15, y, x + 15, y);
                doc.line(x, y - 15, x, y + 15);
              });
            }
            
            doc.setFont("times", "bold");
            doc.text(labelText, 40, yOffset);
            doc.setFont("times", "normal");
            
            // Handle long text with wrapping
            const valueLines = doc.splitTextToSize(value.toString(), pageWidth - 120);
            valueLines.forEach((line, idx) => {
              doc.text(line, 100, yOffset + (idx * 6));
            });
            
            yOffset += Math.max(8, valueLines.length * 6);
          }
        });
        yOffset += 12;
      }
    });

    doc.save(`medical_record_${record.petName || 'unknown'}.pdf`);
  };

  return (
    <button 
      onClick={handleDownload} 
      className="px-3 py-1 bg-yellow-500 text-white rounded"
      disabled={!record}
    >
      Quick Download
    </button>
  );
}
