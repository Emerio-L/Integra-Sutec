const PDFDocument = require('pdfkit');
const { CURRENCY } = require('@integra/shared');

function formatMoney(amount) {
  return `${CURRENCY.SYMBOL}${Number(amount).toFixed(2)}`;
}

/**
 * Generate a professional PDF for a quote
 */
async function generateQuotePDF(quote) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(22).fillColor('#1a365d').text('INTEGRA SUTEC', 50, 50);
      doc.fontSize(9).fillColor('#666')
        .text('Integra en Suministros y Tecnología, S.A.', 50, 78)
        .text('Guatemala, Guatemala', 50, 91);

      // Quote title
      doc.fontSize(16).fillColor('#1a365d').text('COTIZACIÓN', 400, 50, { align: 'right' });
      doc.fontSize(10).fillColor('#333')
        .text(`No: ${quote.quote_number}`, 400, 72, { align: 'right' })
        .text(`Fecha: ${new Date(quote.created_at).toLocaleDateString('es-GT')}`, 400, 86, { align: 'right' });

      if (quote.valid_until) {
        doc.text(`Válida hasta: ${new Date(quote.valid_until).toLocaleDateString('es-GT')}`, 400, 100, { align: 'right' });
      }

      // Separator
      doc.moveTo(50, 120).lineTo(562, 120).strokeColor('#e2e8f0').stroke();

      // Customer info
      const customer = quote.customer_id;
      doc.fontSize(11).fillColor('#1a365d').text('Cliente:', 50, 135);
      doc.fontSize(10).fillColor('#333')
        .text(customer.name || '', 50, 152)
        .text(`NIT: ${customer.nit || 'C/F'}`, 50, 166)
        .text(customer.address || '', 50, 180);

      // Table header
      const tableTop = 220;
      doc.rect(50, tableTop, 512, 22).fill('#1a365d');
      doc.fontSize(9).fillColor('#fff')
        .text('Cant.', 55, tableTop + 6, { width: 40 })
        .text('Descripción', 100, tableTop + 6, { width: 250 })
        .text('P. Unit.', 360, tableTop + 6, { width: 80, align: 'right' })
        .text('Subtotal', 450, tableTop + 6, { width: 100, align: 'right' });

      // Table rows
      let y = tableTop + 28;
      quote.items.forEach((item, i) => {
        const bg = i % 2 === 0 ? '#f7fafc' : '#ffffff';
        doc.rect(50, y - 4, 512, 20).fill(bg);
        doc.fontSize(9).fillColor('#333')
          .text(String(item.quantity), 55, y, { width: 40 })
          .text(item.product_name, 100, y, { width: 250 })
          .text(formatMoney(item.unit_price), 360, y, { width: 80, align: 'right' })
          .text(formatMoney(item.subtotal), 450, y, { width: 100, align: 'right' });
        y += 20;
      });

      // Totals
      y += 10;
      doc.moveTo(350, y).lineTo(562, y).strokeColor('#e2e8f0').stroke();
      y += 8;
      doc.fontSize(10).fillColor('#333')
        .text('Subtotal:', 360, y, { width: 90, align: 'right' })
        .text(formatMoney(quote.subtotal), 450, y, { width: 100, align: 'right' });
      y += 18;
      doc.text('IVA (12%):', 360, y, { width: 90, align: 'right' })
        .text(formatMoney(quote.tax_amount), 450, y, { width: 100, align: 'right' });
      y += 18;
      doc.fontSize(12).fillColor('#1a365d').font('Helvetica-Bold')
        .text('TOTAL:', 360, y, { width: 90, align: 'right' })
        .text(formatMoney(quote.total), 450, y, { width: 100, align: 'right' });

      // Notes
      if (quote.notes) {
        y += 40;
        doc.font('Helvetica').fontSize(10).fillColor('#666')
          .text('Notas:', 50, y)
          .text(quote.notes, 50, y + 14, { width: 400 });
      }

      // Footer
      doc.fontSize(8).fillColor('#999')
        .text('Documento generado por Integra Sutec', 50, 720, { align: 'center', width: 512 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate a professional PDF for an invoice
 */
async function generateInvoicePDF(invoice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(22).fillColor('#1a365d').text('INTEGRA SUTEC', 50, 50);
      doc.fontSize(9).fillColor('#666')
        .text('Integra en Suministros y Tecnología, S.A.', 50, 78)
        .text('Guatemala, Guatemala', 50, 91);

      // Invoice title
      doc.fontSize(16).fillColor('#c53030').text('FACTURA', 400, 50, { align: 'right' });
      doc.fontSize(10).fillColor('#333')
        .text(`No: ${invoice.invoice_number}`, 400, 72, { align: 'right' })
        .text(`Fecha: ${new Date(invoice.created_at).toLocaleDateString('es-GT')}`, 400, 86, { align: 'right' });

      // Separator
      doc.moveTo(50, 115).lineTo(562, 115).strokeColor('#e2e8f0').stroke();

      // Customer info
      const customer = invoice.customer_id;
      doc.fontSize(11).fillColor('#1a365d').text('Cliente:', 50, 130);
      doc.fontSize(10).fillColor('#333')
        .text(customer.name || '', 50, 147)
        .text(`NIT: ${customer.nit || 'C/F'}`, 50, 161)
        .text(customer.address || '', 50, 175);

      // Payment info
      const pmLabels = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', credit: 'Crédito' };
      const statusLabels = { pending: 'Pendiente', paid: 'Pagada', partial: 'Parcial' };
      doc.fontSize(10).fillColor('#333')
        .text(`Método de pago: ${pmLabels[invoice.payment_method] || invoice.payment_method}`, 350, 147)
        .text(`Estado: ${statusLabels[invoice.payment_status] || invoice.payment_status}`, 350, 161);

      // Table header
      const tableTop = 210;
      doc.rect(50, tableTop, 512, 22).fill('#1a365d');
      doc.fontSize(9).fillColor('#fff')
        .text('Cant.', 55, tableTop + 6, { width: 40 })
        .text('Descripción', 100, tableTop + 6, { width: 250 })
        .text('P. Unit.', 360, tableTop + 6, { width: 80, align: 'right' })
        .text('Subtotal', 450, tableTop + 6, { width: 100, align: 'right' });

      // Table rows
      let y = tableTop + 28;
      invoice.items.forEach((item, i) => {
        const bg = i % 2 === 0 ? '#f7fafc' : '#ffffff';
        doc.rect(50, y - 4, 512, 20).fill(bg);
        doc.fontSize(9).fillColor('#333')
          .text(String(item.quantity), 55, y, { width: 40 })
          .text(item.product_name, 100, y, { width: 250 })
          .text(formatMoney(item.unit_price), 360, y, { width: 80, align: 'right' })
          .text(formatMoney(item.subtotal), 450, y, { width: 100, align: 'right' });
        y += 20;
      });

      // Totals
      y += 10;
      doc.moveTo(350, y).lineTo(562, y).strokeColor('#e2e8f0').stroke();
      y += 8;
      doc.fontSize(10).fillColor('#333')
        .text('Subtotal:', 360, y, { width: 90, align: 'right' })
        .text(formatMoney(invoice.subtotal), 450, y, { width: 100, align: 'right' });
      y += 18;
      doc.text('IVA (12%):', 360, y, { width: 90, align: 'right' })
        .text(formatMoney(invoice.tax_amount), 450, y, { width: 100, align: 'right' });
      y += 18;
      doc.fontSize(12).fillColor('#1a365d').font('Helvetica-Bold')
        .text('TOTAL:', 360, y, { width: 90, align: 'right' })
        .text(formatMoney(invoice.total), 450, y, { width: 100, align: 'right' });

      // Footer
      doc.font('Helvetica').fontSize(8).fillColor('#999')
        .text('Documento generado por Integra Sutec', 50, 720, { align: 'center', width: 512 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateQuotePDF, generateInvoicePDF };
