import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToPDF = (exportData) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 10;

    // Title
    doc.setFontSize(18);
    doc.text('Smart Wrong-Way Vehicle Detection System', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    // Export Info
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Export Information', 10, yPosition);
    yPosition += 7;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Export Time: ${exportData.exportInfo.exportTime}`, 15, yPosition);
    yPosition += 5;
    doc.text(`Export Date: ${exportData.exportInfo.exportDate}`, 15, yPosition);
    yPosition += 5;
    doc.text(`System: ${exportData.exportInfo.systemName}`, 15, yPosition);
    yPosition += 5;
    doc.text(`Database Connected: ${exportData.exportInfo.databaseConnected ? 'Yes' : 'No'}`, 15, yPosition);
    yPosition += 10;

    // Summary Section
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('Summary Statistics', 10, yPosition);
    yPosition += 7;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Total Vehicles Detected: ${exportData.summary.totalVehiclesDetected}`, 15, yPosition);
    yPosition += 5;
    doc.text(`Wrong-Way Vehicles: ${exportData.summary.wrongWayVehicles}`, 15, yPosition);
    yPosition += 5;
    doc.text(`Plates Recognized: ${exportData.summary.platesRecognized}`, 15, yPosition);
    yPosition += 5;
    doc.text(`System Accuracy: ${exportData.summary.systemAccuracy}%`, 15, yPosition);
    yPosition += 5;
    doc.text(`Current FPS: ${exportData.summary.currentFPS}`, 15, yPosition);
    yPosition += 15;

    // Vehicle Detections Table
    if (exportData.vehicleDetections.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.text('Vehicle Detections', 10, yPosition);
      yPosition += 5;

      const detectionTableData = exportData.vehicleDetections.map(det => [
        det.timestamp,
        det.vehicleType,
        det.licensePlate,
        det.confidenceScore,
        det.status
      ]);

      autoTable(doc, {
        head: [['Time', 'Vehicle Type', 'License Plate', 'Confidence', 'Status']],
        body: detectionTableData,
        startY: yPosition,
        margin: { left: 10, right: 10 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 }
        },
        didDrawPage: (data) => {
          // Add page numbers
          const pageSize = doc.internal.pageSize;
          const pageCount = doc.internal.getNumberOfPages();
          const currentPage = data.pageNumber;
          doc.setFontSize(10);
          doc.text(
            `Page ${currentPage} of ${pageCount}`,
            pageSize.getWidth() / 2,
            pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }

    // Add new page if needed
    if (exportData.wrongWayAlerts.length > 0) {
      doc.addPage();
      yPosition = 15;

      // Wrong-Way Alerts Table
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.text('Wrong-Way Alerts Log', 10, yPosition);
      yPosition += 5;

      const alertTableData = exportData.wrongWayAlerts.map(alert => [
        alert.timestamp,
        alert.lane,
        alert.licensePlate,
        alert.confidenceScore,
        alert.actionTaken
      ]);

      autoTable(doc, {
        head: [['Time', 'Lane', 'License Plate', 'Confidence', 'Action Taken']],
        body: alertTableData,
        startY: yPosition,
        margin: { left: 10, right: 10 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
          4: { cellWidth: 40 }
        },
        didDrawPage: (data) => {
          // Add page numbers
          const pageSize = doc.internal.pageSize;
          const pageCount = doc.internal.getNumberOfPages();
          const currentPage = data.pageNumber;
          doc.setFontSize(10);
          doc.text(
            `Page ${currentPage} of ${pageCount}`,
            pageSize.getWidth() / 2,
            pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }
      });
    }

    // Database Configuration (if connected)
    if (exportData.databaseConfig) {
      doc.addPage();
      yPosition = 15;

      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.text('Database Configuration', 10, yPosition);
      yPosition += 10;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Host: ${exportData.databaseConfig.host}`, 15, yPosition);
      yPosition += 5;
      doc.text(`Port: ${exportData.databaseConfig.port}`, 15, yPosition);
      yPosition += 5;
      doc.text(`Database: ${exportData.databaseConfig.database}`, 15, yPosition);
      yPosition += 5;
      doc.text(`Username: ${exportData.databaseConfig.username}`, 15, yPosition);
    }

    // Generate filename
    const now = new Date();
    const filename = `traffic_monitoring_report_${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}.pdf`;

    // Save PDF
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};
