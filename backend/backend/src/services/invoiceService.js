import PDFDocument from 'pdfkit';
import Order from '../models/Order.js';
import OfflineSale from '../models/OfflineSale.js';
import AppSetting from '../models/AppSetting.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { getGstAmountFromInclusive, getProductGstRate, getProductMrp, getTaxableAmountFromInclusive } from '../utils/pricing.js';
import { generateInvoiceNumber } from '../utils/generators.js';

const escapeHtml = (value = '') => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatCurrency = (value) => `&#8377; ${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const formatDate = (value) => new Date(value).toLocaleDateString('en-IN', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const formatDiscountPercentage = (value) => Number(value || 0)
  .toFixed(2)
  .replace(/\.?0+$/, '');

const INVOICE_READY_STATUSES = ['Shipped', 'Completed'];

const calculateInvoiceTotals = (items = [], fallbackSubtotal = 0, fallbackTax = 0, fallbackTotal = 0) => {
  const mrpTotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity || 0);
    const originalPrice = Number(item.originalPrice || item.price || 0);
    return sum + (originalPrice * quantity);
  }, 0);
  const sellingPriceTotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity || 0);
    const basePrice = Number(item.basePrice || item.price || 0);
    return sum + (basePrice * quantity);
  }, 0);
  const discount = items.reduce((sum, item) => sum + Number(item.discountAmount || 0), 0);
  const taxableSubtotal = Number(
    items.reduce((sum, item) => sum + Number(item.taxableAmount || 0), 0)
    || fallbackSubtotal
    || Math.max(Number(fallbackTotal || 0) - Number(fallbackTax || 0), 0)
  );
  const cgst = items.reduce((sum, item) => sum + Number(item.cgstAmount || 0), 0);
  const sgst = items.reduce((sum, item) => sum + Number(item.sgstAmount || 0), 0);
  const igst = items.reduce((sum, item) => sum + Number(item.igstAmount || 0), 0);
  const gst = Number(fallbackTax || items.reduce((sum, item) => sum + Number(item.gstAmount || 0), 0));
  const grandTotal = Number(fallbackTotal || (taxableSubtotal + gst));
  const roundOff = grandTotal - (taxableSubtotal + gst);
  const discountPercentage = sellingPriceTotal > 0 ? (discount / sellingPriceTotal) * 100 : 0;

  return {
    mrpTotal: mrpTotal || grandTotal,
    sellingPriceTotal,
    discount,
    discountPercentage: formatDiscountPercentage(discountPercentage),
    taxableSubtotal,
    gst,
    cgst,
    sgst,
    igst,
    roundOff,
    grandTotal,
  };
};

const normalizeItemsForInvoice = (items = []) => items.map((item) => {
  const source = typeof item.toObject === 'function' ? item.toObject() : item;
  const quantity = Number(source.quantity || 0);
  const totalAmount = Number(source.totalAmount || (Number(source.price || 0) * quantity));
  const gstRate = Number(source.gstRate ?? source.product?.gstRate ?? 0);
  const taxableAmount = Number(source.taxableAmount ?? getTaxableAmountFromInclusive(totalAmount, gstRate));
  const gstAmount = Number(source.gstAmount ?? getGstAmountFromInclusive(totalAmount, gstRate));
  return {
    ...source,
    originalPrice: source.originalPrice || (source.product ? getProductMrp(source.product) : source.price),
    basePrice: Number(source.basePrice || 0),
    discountPercentage: Number(source.discountPercentage || 0),
    discountAmount: Number(source.discountAmount || 0),
    gstRate: gstRate || getProductGstRate(source.product),
    cgstRate: Number(source.cgstRate || 0),
    sgstRate: Number(source.sgstRate || 0),
    igstRate: Number(source.igstRate || 0),
    taxableAmount,
    gstAmount,
    cgstAmount: Number(source.cgstAmount || 0),
    sgstAmount: Number(source.sgstAmount || 0),
    igstAmount: Number(source.igstAmount || 0),
    totalAmount,
  };
});

const buildInvoiceHtml = (data, settings) => {
  const storeName = escapeHtml((settings?.storeName || "KIKI'S").replace(' RETURN GIFT STORE', ''));
  const tagline = escapeHtml(settings?.storeTagline === 'Perfect Gifts for Every Occasion'
    ? 'Return Gifts'
    : (settings?.storeTagline || 'Return Gifts'));
  const gstNumber = escapeHtml(settings?.gstNumber || '');
  const showGstDetails = data.showGstNumber !== false;
  const showGstNumber = data.showGstNumber !== false && Boolean(gstNumber);
  const bankName = escapeHtml(settings?.bankAccountName || settings?.bankName || 'WXYZ Bank');
  const accountNo = escapeHtml(settings?.bankAccountNumber || 'xxx xxxx xxx');
  const totals = calculateInvoiceTotals(data.items, data.subtotal, data.tax, data.totalAmount);
  const rows = (data.items || []).map((item) => {
    const quantity = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    const discountAmount = Number(item.discountAmount || 0);
    const taxableAmount = Number(item.taxableAmount || 0);
    const cgstAmount = Number(item.cgstAmount || 0);
    const sgstAmount = Number(item.sgstAmount || 0);
    const igstAmount = Number(item.igstAmount || 0);
    const total = Number(item.totalAmount || (quantity * price));

    return `
        <tr>
          <td>${escapeHtml(item.name || 'product/service')}</td>
          <td>${quantity}</td>
          <td>${formatCurrency(item.basePrice || price)}</td>
          <td>${formatCurrency(discountAmount)}</td>
          <td>${formatCurrency(taxableAmount)}</td>
          ${showGstDetails ? `<td>${formatCurrency(cgstAmount)}</td>` : ''}
          ${showGstDetails ? `<td>${formatCurrency(sgstAmount)}</td>` : ''}
          ${showGstDetails ? `<td>${formatCurrency(igstAmount)}</td>` : ''}
          <td>${formatCurrency(total)}</td>
        </tr>`;
  }).join('') || `
        <tr>
          <td>product/service</td>
          <td>0</td>
          <td>${formatCurrency(0)}</td>
          <td>${formatCurrency(0)}</td>
          <td>${formatCurrency(0)}</td>
          ${showGstDetails ? `<td>${formatCurrency(0)}</td>` : ''}
          ${showGstDetails ? `<td>${formatCurrency(0)}</td>` : ''}
          ${showGstDetails ? `<td>${formatCurrency(0)}</td>` : ''}
          <td>${formatCurrency(0)}</td>
        </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice - KIKI'S Return Gifts</title>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --pink-soft:    #fff0f4;
      --pink-light:   #ffd6e2;
      --pink-mid:     #f9a8c0;
      --pink-main:    #e8648a;
      --pink-dark:    #c94070;
      --ink:          #2a1a22;
      --ink-muted:    #7a5566;
      --border:       #f0c8d8;
      --white:        #ffffff;
      --shadow:       0 20px 60px rgba(200,80,120,0.13), 0 4px 16px rgba(200,80,120,0.08);
    }

    body {
      background: linear-gradient(135deg, #ffe0ea 0%, #ffc8d8 40%, #ffb0c8 100%);
      min-height: 100vh;
      font-family: 'Jost', sans-serif;
      color: var(--ink);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 40px 20px;
    }

    .gift-svg { display: inline-block; }

    .invoice-card {
      background: var(--white);
      width: 100%;
      max-width: 960px;
      border-radius: 20px;
      box-shadow: var(--shadow);
      overflow: hidden;
      position: relative;
    }

    .invoice-card::before {
      content: '';
      display: block;
      height: 6px;
      background: linear-gradient(90deg, var(--pink-mid), var(--pink-main), var(--pink-mid));
    }

    .invoice-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 32px 40px 20px;
      gap: 16px;
    }

    .logo-block {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-circle {
      width: 52px;
      height: 52px;
      background: var(--pink-soft);
      border: 2px solid var(--pink-light);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Dancing Script', cursive;
      font-size: 18px;
      color: var(--pink-main);
      font-weight: 700;
      flex-shrink: 0;
    }

    .company-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ink);
      line-height: 1.2;
    }
    .company-tagline {
      font-size: 9px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--pink-main);
      margin-top: 3px;
      font-weight: 500;
    }
    .company-meta {
      font-size: 11px;
      color: var(--ink-muted);
      margin-top: 6px;
      font-weight: 500;
      letter-spacing: 0.04em;
    }

    .invoice-title-block {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .gift-deco { margin-bottom: 6px; }

    .invoice-word {
      font-family: 'Cormorant Garamond', serif;
      font-size: 58px;
      font-style: italic;
      font-weight: 600;
      color: var(--ink);
      line-height: 1;
      letter-spacing: -0.01em;
    }

    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--border), transparent);
      margin: 0 40px;
    }

    /* ── FIX: address-section now has bigger gap and meta is protected ── */
    .address-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 40px;
      gap: 40px;
    }

    .bill-to-label {
      font-size: 10px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--ink-muted);
      margin-bottom: 6px;
      font-weight: 500;
    }

    .client-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ink);
      margin-bottom: 6px;
      word-break: break-word;
    }

    .client-detail {
      font-size: 12.5px;
      color: var(--ink-muted);
      line-height: 1.8;
      font-weight: 300;
    }

    /* ── FIX: min-width and flex-shrink prevent squishing ── */
    .invoice-meta {
      text-align: right;
      font-size: 13px;
      min-width: 220px;
      flex-shrink: 0;
    }
    .invoice-meta p {
      color: var(--ink-muted);
      margin-bottom: 7px;
      font-weight: 400;
      white-space: nowrap;
    }
    .invoice-meta span {
      color: var(--ink);
      font-weight: 700;
      white-space: nowrap;
    }

    .table-wrap {
      margin: 0 40px 24px;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 860px;
      font-size: 13px;
    }

    thead tr { background: var(--pink-soft); }

    thead th {
      padding: 12px 12px;
      text-align: left;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--pink-dark);
      font-weight: 600;
      border: 1px solid var(--border);
    }
    thead th:not(:first-child) { text-align: center; }
    thead th:last-child { text-align: right; }

    tbody tr { border-bottom: 1px solid var(--border); }
    tbody tr:last-child { border-bottom: 2px solid var(--border); }

    tbody td {
      padding: 14px 12px;
      border-left: 1px solid var(--border);
      border-right: 1px solid var(--border);
      color: var(--ink);
      font-weight: 400;
    }
    tbody td:not(:first-child) { text-align: center; }
    tbody td:nth-child(n+3) { white-space: nowrap; }
    tbody td:last-child { text-align: right; font-weight: 700; white-space: nowrap; }

    .totals-section {
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
      padding: 0 40px 32px;
      gap: 20px;
    }

    .totals-values {
      min-width: 280px;
      max-width: 360px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 0;
      font-size: 13px;
      color: var(--ink-muted);
      font-weight: 400;
    }
    .totals-row .label { margin-right: 24px; }
    .totals-row span:last-child,
    .total-final span:last-child {
      white-space: nowrap;
      text-align: right;
    }

    .total-final {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1.5px solid var(--ink);
      padding-top: 8px;
      margin-top: 4px;
      font-weight: 700;
      font-size: 16px;
      color: var(--ink);
    }

    .invoice-footer {
      background: var(--white);
      border-top: 1px solid var(--border);
      padding: 30px 40px 24px;
    }

    .payment-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
    }

    .payment-block { flex: 1; }

    .payment-label {
      font-size: 10px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--ink-muted);
      margin-bottom: 10px;
      font-weight: 600;
    }
    .payment-detail {
      font-size: 13px;
      color: var(--ink);
      margin-bottom: 7px;
      font-weight: 400;
    }
    .payment-detail strong { font-weight: 700; }

    .thankyou-block {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .thankyou-text {
      font-family: 'Dancing Script', cursive;
      font-size: 46px;
      font-weight: 700;
      color: var(--ink);
      line-height: 1;
    }

    .signature-block {
      text-align: center;
      min-width: 120px;
    }
    .signature-text {
      font-size: 11px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--ink-muted);
      font-weight: 400;
    }

    .terms-text {
      margin-top: 18px;
      font-size: 11.5px;
      color: var(--ink-muted);
      text-align: center;
      font-style: italic;
      font-weight: 400;
    }

    .print-btn {
      display: block;
      width: fit-content;
      margin: 0 auto 24px;
      padding: 12px 36px;
      background: linear-gradient(135deg, var(--pink-main), var(--pink-dark));
      color: white;
      border: none;
      border-radius: 50px;
      font-family: 'Jost', sans-serif;
      font-size: 13px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(200,60,100,0.35);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .print-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(200,60,100,0.45);
    }

    @media print {
      body { background: none; padding: 0; }
      .invoice-card { box-shadow: none; border-radius: 0; }
      .invoice-card::before { display: none; }
      .print-btn { display: none; }
    }

    @media (max-width: 600px) {
      .invoice-header, .address-section, .totals-section, .invoice-footer { padding-left: 20px; padding-right: 20px; }
      .table-wrap { margin: 0 20px 24px; }
      .divider { margin: 0 20px; }
      .invoice-word { font-size: 42px; }
      .address-section, .payment-section { flex-direction: column; }
      .invoice-meta { text-align: left; min-width: unset; }
      .totals-values { width: 100%; }
      .signature-block { display: none; }
    }
  </style>
</head>
<body>

<button class="print-btn" onclick="window.print()">&#128424; &nbsp;Print / Save as PDF</button>

<div class="invoice-card" id="invoice">

  <div class="invoice-header">
    <div class="logo-block">
      <div class="logo-circle">K</div>
      <div>
        <div class="company-name">${storeName}</div>
        <div class="company-tagline">${tagline}</div>
        ${showGstNumber ? `<div class="company-meta">GSTIN: ${gstNumber}</div>` : ''}
      </div>
    </div>

    <div class="invoice-title-block">
      <div class="gift-deco">
        <svg class="gift-svg" width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="11" y="22" width="34" height="8" rx="2.5" fill="#f29ab6" stroke="#e8648a" stroke-width="1.4"/>
          <rect x="12" y="30" width="32" height="26" rx="2.5" fill="#ffd6e2" stroke="#e8648a" stroke-width="1.4"/>
          <path d="M28 22V56" stroke="#e8648a" stroke-width="2"/>
          <path d="M12 30H44" stroke="#e8648a" stroke-width="1.4"/>
          <path d="M28 21C28 16.8 23.7 14.7 20.9 16.5C18.9 17.8 19.4 21 22.4 21H28Z" fill="#e8648a"/>
          <path d="M28 21C28 16.8 32.3 14.7 35.1 16.5C37.1 17.8 36.6 21 33.6 21H28Z" fill="#e8648a"/>
          <circle cx="28" cy="22" r="2.5" fill="#f9a8c0"/>
        </svg>
      </div>
      <div class="invoice-word">Invoice</div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="address-section">
    <div style="flex: 1; min-width: 0;">
      <div class="bill-to-label">invoice to :</div>
      <div class="client-name" id="clientName">${escapeHtml(data.customerName || "CLIENT'S NAME")}</div>
      <div class="client-detail">
        <span id="clientEmail">${escapeHtml(data.customerEmail || '')}</span><br/>
        address: <span id="clientAddress">${escapeHtml(data.customerAddress || '')}</span><br/>
        phone number: <span id="clientPhone">${escapeHtml(data.customerPhone || '')}</span>
      </div>
    </div>

    <div class="invoice-meta">
      <p>Invoice No : <span id="invoiceNo">${escapeHtml(data.invoiceNumber || '')}</span></p>
      <p>Date : <span id="invoiceDate">${escapeHtml(formatDate(data.date))}</span></p>
    </div>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>QTY</th>
          <th>Base</th>
          <th>Discount</th>
          <th>Taxable</th>
          ${showGstDetails ? '<th>CGST</th>' : ''}
          ${showGstDetails ? '<th>SGST</th>' : ''}
          ${showGstDetails ? '<th>IGST</th>' : ''}
          <th>Total</th>
        </tr>
      </thead>
      <tbody id="invoiceRows">${rows}
      </tbody>
    </table>
  </div>

  <div class="totals-section">
    <div class="totals-values">
      <div class="totals-row">
        <span class="label">Total :</span>
        <span id="actualTotal">${formatCurrency(totals.mrpTotal)}</span>
      </div>
      <div class="totals-row">
        <span class="label">Discount (${totals.discountPercentage}%) :</span>
        <span id="discountVal">- ${formatCurrency(totals.discount)}</span>
      </div>
      <div class="totals-row">
        <span class="label">Sub Total :</span>
        <span id="subTotal">${formatCurrency(totals.taxableSubtotal)}</span>
      </div>
      ${showGstDetails ? `
      <div class="totals-row">
        <span class="label">CGST :</span>
        <span id="cgstTotal">${formatCurrency(totals.cgst)}</span>
      </div>` : ''}
      ${showGstDetails ? `
      <div class="totals-row">
        <span class="label">SGST :</span>
        <span id="sgstTotal">${formatCurrency(totals.sgst)}</span>
      </div>` : ''}
      ${showGstDetails ? `
      <div class="totals-row">
        <span class="label">IGST :</span>
        <span id="igstTotal">${formatCurrency(totals.igst)}</span>
      </div>` : ''}
      ${showGstDetails ? `
      <div class="totals-row">
        <span class="label">GST :</span>
        <span id="gstTotal">${formatCurrency(totals.gst)}</span>
      </div>` : ''}
      ${Math.abs(totals.roundOff) > 0.001 ? `
      <div class="totals-row">
        <span class="label">Round Off :</span>
        <span id="roundOffTotal">${formatCurrency(totals.roundOff)}</span>
      </div>` : ''}
      <div class="total-final">
        <span>Grand Total :</span>
        <span id="grandTotal">${formatCurrency(totals.grandTotal)}</span>
      </div>
    </div>
  </div>

  <div class="invoice-footer">
    <div class="payment-section">
      <div class="payment-block">
        <div class="payment-label">Payment Method</div>
        <div class="payment-detail">Bank Name: <strong id="bankName">${bankName}</strong></div>
        <div class="payment-detail">Account No : <strong id="accountNo">${accountNo}</strong></div>
      </div>

      <div class="thankyou-block">
        <svg width="48" height="48" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="11" y="22" width="34" height="8" rx="2.5" fill="#f29ab6" stroke="#e8648a" stroke-width="1.4"/>
          <rect x="12" y="30" width="32" height="26" rx="2.5" fill="#ffd6e2" stroke="#e8648a" stroke-width="1.4"/>
          <path d="M28 22V56" stroke="#e8648a" stroke-width="2"/>
          <path d="M12 30H44" stroke="#e8648a" stroke-width="1.4"/>
          <path d="M28 21C28 16.8 23.7 14.7 20.9 16.5C18.9 17.8 19.4 21 22.4 21H28Z" fill="#e8648a"/>
          <path d="M28 21C28 16.8 32.3 14.7 35.1 16.5C37.1 17.8 36.6 21 33.6 21H28Z" fill="#e8648a"/>
          <circle cx="28" cy="22" r="2.5" fill="#f9a8c0"/>
        </svg>
        <div class="thankyou-text">Thank you</div>
      </div>

      <div class="signature-block">
        <div class="signature-text">Signature</div>
      </div>
    </div>

    <p class="terms-text">Please send payment within 30 days of receiving this invoice.</p>
  </div>

</div>

</body>
</html>`;
};

const sendInvoiceHtml = (res, invoiceNumber, data, settings) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename=invoice-${invoiceNumber || 'invoice'}.html`);
  res.send(buildInvoiceHtml(data, settings));
};

const formatPdfCurrency = (value) => `Rs.${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const drawPdfTableHeader = (doc, y, headers, widths) => {
  let x = doc.page.margins.left;
  doc.font('Helvetica-Bold').fontSize(8.5);
  headers.forEach((header, index) => {
    const width = widths[index];
    doc.rect(x, y, width, 22).fillAndStroke('#fff0f4', '#f0c8d8');
    doc.fillColor('#a03b61').text(header.toUpperCase(), x + 5, y + 7, {
      width: width - 10,
      align: index === 0 ? 'left' : 'center',
      lineBreak: false,
    });
    x += width;
  });
  return y + 22;
};

const drawPdfTableRow = (doc, y, row, widths) => {
  const rowHeight = 24;
  let x = doc.page.margins.left;
  row.forEach((cell, index) => {
    const width = widths[index];
    doc.rect(x, y, width, rowHeight).stroke('#f0c8d8');
    doc
      .font(index === row.length - 1 ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(8.5)
      .fillColor('#2a1a22')
      .text(String(cell), x + 5, y + 6, {
        width: width - 10,
        align: index === 0 ? 'left' : index === row.length - 1 ? 'right' : 'center',
        lineBreak: false,
        ellipsis: true,
      });
    x += width;
  });
  return y + rowHeight;
};

const ensurePdfPageSpace = (doc, currentY, requiredHeight, redrawHeader) => {
  if (currentY + requiredHeight <= doc.page.height - doc.page.margins.bottom) return currentY;
  doc.addPage();
  return redrawHeader ? redrawHeader() : doc.y;
};

const sendInvoicePdf = (res, invoiceNumber, data, settings) => {
  const storeName = String((settings?.storeName || "KIKI'S").replace(' RETURN GIFT STORE', ''));
  const tagline = settings?.storeTagline === 'Perfect Gifts for Every Occasion'
    ? 'Return Gifts'
    : (settings?.storeTagline || 'Return Gifts');
  const gstNumber = String(settings?.gstNumber || '');
  const showGstDetails = data.showGstNumber !== false;
  const showGstNumber = showGstDetails && Boolean(gstNumber);
  const totals = calculateInvoiceTotals(data.items, data.subtotal, data.tax, data.totalAmount);
  const tableHeaders = ['Product', 'Qty', 'Price', 'Total'];
  const widths = [285, 55, 95, 80];

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceNumber || 'invoice'}.pdf`);
  doc.pipe(res);

  const accent = '#e8648a';
  const border = '#f0c8d8';
  const ink = '#2a1a22';
  const muted = '#7a5566';
  const pageW = 515;

  // ── HEADER ──────────────────────────────────────────────
  doc.circle(58, 55, 18).lineWidth(1.2).strokeColor('#f9a8c0').stroke();
  doc.font('Times-Italic').fontSize(14).fillColor(accent).text('K', 52, 46);
  doc.font('Times-Bold').fontSize(14).fillColor(ink).text(storeName, 86, 42);
  doc.font('Helvetica').fontSize(7.5).fillColor(accent).text(tagline.toUpperCase(), 87, 60, { characterSpacing: 2.2 });
  if (showGstNumber) {
    doc.font('Helvetica').fontSize(8).fillColor(muted).text(`GSTIN: ${gstNumber}`, 40, 82);
  }

  // Gift box icon (top right)
  const gx = 490, gy = 38;
  doc.roundedRect(gx - 1, gy + 6, 26, 6, 2).fillAndStroke('#f29ab6', accent);
  doc.roundedRect(gx, gy + 12, 24, 22, 2).fillAndStroke('#ffd6e2', accent);
  doc.moveTo(gx + 12, gy + 6).lineTo(gx + 12, gy + 34).lineWidth(1.3).strokeColor(accent).stroke();
  doc.moveTo(gx, gy + 12).lineTo(gx + 24, gy + 12).lineWidth(1).strokeColor(accent).stroke();
  doc.path(`M${gx+12} ${gy+5} C${gx+12} ${gy+2} ${gx+9} ${gy} ${gx+7} ${gy+1.5} C${gx+5.5} ${gy+2.6} ${gx+6} ${gy+5} ${gx+8.3} ${gy+5} L${gx+12} ${gy+5} Z`).fill(accent);
  doc.path(`M${gx+12} ${gy+5} C${gx+12} ${gy+2} ${gx+15} ${gy} ${gx+17} ${gy+1.5} C${gx+18.5} ${gy+2.6} ${gx+18} ${gy+5} ${gx+15.7} ${gy+5} L${gx+12} ${gy+5} Z`).fill(accent);
  doc.circle(gx + 12, gy + 6, 1.8).fill('#f9a8c0');

  // "Invoice" italic heading
  doc.font('Times-Italic').fontSize(38).fillColor(ink).text('Invoice', 340, 72, { align: 'right', width: 175 });

// 1. Horizontal divider
doc.moveTo(40, 108).lineTo(555, 108).lineWidth(0.8).strokeColor(border).stroke();

// 2. Invoice meta TOP RIGHT
// 2. Invoice meta TOP RIGHT
doc.font('Helvetica').fontSize(9).fillColor(muted)
  .text('Invoice No :', 400, 122, { width: 65, align: 'left' });
doc.font('Helvetica-Bold').fontSize(9).fillColor(ink)
  .text(data.invoiceNumber || '', 455, 122, { width: 100, align: 'left' });

doc.font('Helvetica').fontSize(9).fillColor(muted)
  .text('Date :', 400, 138, { width: 65, align: 'left' });
doc.font('Helvetica-Bold').fontSize(9).fillColor(ink)
  .text(formatDate(data.date), 455, 138, { width: 100, align: 'left' });

// 3. Bill to TOP LEFT
doc.font('Helvetica').fontSize(8.5).fillColor(muted)
  .text('INVOICE TO :', 40, 122, { characterSpacing: 2 });
doc.font('Times-Bold').fontSize(16).fillColor(ink)
  .text(String(data.customerName || 'Customer').toUpperCase(), 40, 138, { width: 280 });

  let addrY = 165;
  doc.font('Helvetica').fontSize(9).fillColor(muted);
  if (data.customerAddress) {
    doc.text(`address: ${data.customerAddress}`, 40, addrY, { width: 260, lineBreak: false, ellipsis: true });
    addrY += 16;
  }
  if (data.customerEmail) {
    doc.text(`email: ${data.customerEmail}`, 40, addrY, { width: 260, lineBreak: false, ellipsis: true });
    addrY += 16;
  }
  if (data.customerPhone) {
    doc.text(`phone number: ${data.customerPhone}`, 40, addrY, { width: 260, lineBreak: false, ellipsis: true });
    addrY += 16;
  }

  // ── TABLE ────────────────────────────────────────────────
  let y = Math.max(addrY + 14, 210);
  const tableHeaderY = () => drawPdfTableHeader(doc, 60, tableHeaders, widths);
  y = drawPdfTableHeader(doc, y, tableHeaders, widths);

  (data.items || []).forEach((item) => {
    const row = [
      String(item.name || 'Product'),
      Number(item.quantity || 0),
      formatPdfCurrency(item.basePrice || item.price || 0),
      formatPdfCurrency(item.totalAmount || 0),
    ];
    y = ensurePdfPageSpace(doc, y, 34, tableHeaderY);
    y = drawPdfTableRow(doc, y, row, widths);
  });

  // ── TOTALS — right side only, no duplicate left labels ───
  y += 18;
  y = ensurePdfPageSpace(doc, y, 160, () => 60);

  const valueX = 358;
  const summaryLabelWidth = 110;
  const summaryValueWidth = 95;

  const summaryRows = [
    ['Total', formatPdfCurrency(totals.mrpTotal)],
    [`Discount (${totals.discountPercentage}%)`, `- ${formatPdfCurrency(totals.discount)}`],
    ['Sub Total', formatPdfCurrency(totals.taxableSubtotal)],
    ...(showGstDetails ? [
      ['CGST', formatPdfCurrency(totals.cgst)],
      ['SGST', formatPdfCurrency(totals.sgst)],
      ['IGST', formatPdfCurrency(totals.igst)],
      ['GST', formatPdfCurrency(totals.gst)],
    ] : []),
    ...(Math.abs(totals.roundOff) > 0.001 ? [['Round Off', formatPdfCurrency(totals.roundOff)]] : []),
  ];

  let summaryY = y;
  summaryRows.forEach(([label, value]) => {
    doc.font('Helvetica').fontSize(10).fillColor(muted)
      .text(`${label} :`, valueX, summaryY, { width: summaryLabelWidth });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(ink)
      .text(value, valueX + summaryLabelWidth, summaryY, { width: summaryValueWidth, align: 'right' });
    summaryY += 18;
  });

  // Grand total divider + bold row
  doc.moveTo(valueX, summaryY + 3)
    .lineTo(valueX + summaryLabelWidth + summaryValueWidth, summaryY + 3)
    .strokeColor(ink).lineWidth(1).stroke();
  doc.font('Helvetica-Bold').fontSize(12).fillColor(ink)
    .text('Grand Total :', valueX, summaryY + 10, { width: summaryLabelWidth });
  doc.font('Helvetica-Bold').fontSize(12).fillColor(ink)
    .text(formatPdfCurrency(totals.grandTotal), valueX + summaryLabelWidth, summaryY + 10, {
      width: summaryValueWidth, align: 'right',
    });

  // ── FOOTER ───────────────────────────────────────────────
  const footerY = 664;
  doc.moveTo(40, footerY - 8).lineTo(555, footerY - 8).strokeColor(border).lineWidth(0.8).stroke();

  // Payment method
  doc.font('Helvetica').fontSize(8.5).fillColor(muted)
    .text('PAYMENT METHOD', 40, footerY + 14, { characterSpacing: 2.2 });
  doc.font('Helvetica').fontSize(10).fillColor(ink).text('Bank Name:', 40, footerY + 36);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(ink)
    .text(` ${settings?.bankAccountName || settings?.bankName || "Kiki's Gift Store"}`, 97, footerY + 36);
  doc.font('Helvetica').fontSize(10).fillColor(ink).text('Account No :', 40, footerY + 56);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(ink)
    .text(` ${settings?.bankAccountNumber || '9876543210'}`, 101, footerY + 56);

  // Gift icon (footer)
  const fgx = 248, fgy = footerY + 36;
  doc.roundedRect(fgx - 1, fgy + 4, 24, 6, 2).fillAndStroke('#f29ab6', accent);
  doc.roundedRect(fgx, fgy + 10, 22, 20, 2).fillAndStroke('#ffd6e2', accent);
  doc.moveTo(fgx + 11, fgy + 4).lineTo(fgx + 11, fgy + 30).lineWidth(1.3).strokeColor(accent).stroke();
  doc.moveTo(fgx, fgy + 10).lineTo(fgx + 22, fgy + 10).lineWidth(1).strokeColor(accent).stroke();
  doc.path(`M${fgx+11} ${fgy+3} C${fgx+11} ${fgy} ${fgx+8} ${fgy-2} ${fgx+6} ${fgy-0.5} C${fgx+4.5} ${fgy+0.6} ${fgx+5} ${fgy+3} ${fgx+7.3} ${fgy+3} L${fgx+11} ${fgy+3} Z`).fill(accent);
  doc.path(`M${fgx+11} ${fgy+3} C${fgx+11} ${fgy} ${fgx+14} ${fgy-2} ${fgx+16} ${fgy-0.5} C${fgx+17.5} ${fgy+0.6} ${fgx+17} ${fgy+3} ${fgx+14.7} ${fgy+3} L${fgx+11} ${fgy+3} Z`).fill(accent);
  doc.circle(fgx + 11, fgy + 4, 1.8).fill('#f9a8c0');

  // "Thank you"
  doc.font('Times-Italic').fontSize(32).fillColor(ink).text('Thank you', 280, footerY + 30);

  // Signature
  doc.font('Helvetica').fontSize(8.5).fillColor(muted)
    .text('SIGNATURE', 460, footerY + 58, { characterSpacing: 3 });

  // Terms
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(muted)
    .text('Please send payment within 30 days of receiving this invoice.', 40, footerY + 90, {
      align: 'center', width: pageW,
    });

  doc.end();
};

export const generateOrderInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product');
  if (!order) throw new ApiError(404, 'Order not found');
  if (req.user.role !== 'admin' && order.user?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized');
  }
  if (req.user.role !== 'admin' && !INVOICE_READY_STATUSES.includes(order.orderStatus)) {
    throw new ApiError(403, 'Invoice will be available after the order is shipped');
  }

  const settings = await AppSetting.findOne();
  if (!order.invoiceNumber) {
    order.invoiceNumber = await generateInvoiceNumber(Order, 'K-ON');
    await order.save();
  }
  const invoiceNumber = order.invoiceNumber;

  sendInvoicePdf(res, invoiceNumber, {
    invoiceNumber,
    date: order.createdAt,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    items: normalizeItemsForInvoice(order.items),
    subtotal: order.subtotal,
    tax: order.tax,
    totalAmount: order.totalAmount,
    showGstNumber: true,
  }, settings);
});

export const generateOfflineSaleInvoice = asyncHandler(async (req, res) => {
  const sale = await OfflineSale.findById(req.params.id).populate('items.product');
  if (!sale) throw new ApiError(404, 'Sale not found');

  const settings = await AppSetting.findOne();

  sendInvoicePdf(res, sale.invoiceNumber, {
    invoiceNumber: sale.invoiceNumber,
    date: sale.createdAt,
    customerName: sale.customerName,
    customerEmail: '',
    customerPhone: sale.phone,
    customerAddress: sale.address,
    items: normalizeItemsForInvoice(sale.items),
    subtotal: sale.subtotal,
    tax: sale.tax,
    totalAmount: sale.totalAmount,
    showGstNumber: sale.gstMode !== 'without_gst',
  }, settings);
});
