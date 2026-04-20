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

    .address-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 40px;
      gap: 20px;
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
    }

    .client-detail {
      font-size: 12.5px;
      color: var(--ink-muted);
      line-height: 1.8;
      font-weight: 300;
    }

    .invoice-meta {
      text-align: right;
      font-size: 13px;
    }
    .invoice-meta p {
      color: var(--ink-muted);
      margin-bottom: 7px;
      font-weight: 400;
    }
    .invoice-meta span {
      color: var(--ink);
      font-weight: 700;
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
      justify-content: space-between;
      align-items: flex-start;
      padding: 0 40px 32px;
      gap: 20px;
      flex-wrap: wrap;
    }

    .subtotal-labels {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 220px;
    }
    .subtotal-labels p {
      font-family: 'Cormorant Garamond', serif;
      font-size: 17px;
      font-weight: 500;
      color: var(--ink);
    }

    .totals-values {
      min-width: 280px;
      flex: 1;
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
      .invoice-meta { text-align: left; }
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
    <div>
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
	    <div class="subtotal-labels">
	      <p><strong>MRP Total :</strong></p>
	      <p>Selling Price :</p>
	      <p>Discount: ${totals.discountPercentage}%</p>
	      <p>Taxable Amount :</p>
	      ${showGstDetails ? '<p>CGST :</p>' : ''}
	      ${showGstDetails ? '<p>SGST :</p>' : ''}
	      ${showGstDetails ? '<p>IGST :</p>' : ''}
	      ${showGstDetails ? '<p>GST :</p>' : ''}
	      ${Math.abs(totals.roundOff) > 0.001 ? '<p>Round Off :</p>' : ''}
	      <p>Grand Total :</p>
	    </div>

	    <div class="totals-values">
	      <div class="totals-row">
	        <span class="label">MRP Total :</span>
	        <span id="actualTotal">${formatCurrency(totals.mrpTotal)}</span>
	      </div>
	      <div class="totals-row">
	        <span class="label">Selling Price :</span>
	        <span id="sellingPriceTotal">${formatCurrency(totals.sellingPriceTotal)}</span>
	      </div>
	      <div class="totals-row">
	        <span class="label">Discount (${totals.discountPercentage}%) :</span>
	        <span id="discountVal">- ${formatCurrency(totals.discount)}</span>
	      </div>
	      <div class="totals-row">
	        <span class="label">Taxable Amount :</span>
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
        <svg width="24" height="22" viewBox="0 0 28 26" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-left:-4px;margin-bottom:14px;opacity:0.7">
          <path d="M14 23S2 15 2 8a6 6 0 0112 0 6 6 0 0112 0c0 7-12 15-12 15z" fill="#e8648a"/>
        </svg>
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
    doc
      .fillColor('#a03b61')
      .text(header.toUpperCase(), x + 5, y + 7, {
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

const sendOfflineSaleInvoicePdf = (res, invoiceNumber, data, settings) => {
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

  doc.circle(60, 56, 18).lineWidth(1.2).strokeColor('#f9a8c0').stroke();
  doc.font('Times-Italic').fontSize(14).fillColor(accent).text('K', 54, 47);
  doc.font('Times-Roman').fontSize(16).fillColor(ink).text(storeName, 92, 43);
  doc.font('Helvetica').fontSize(8).fillColor(accent).text(tagline.toUpperCase(), 92, 62, {
    characterSpacing: 2.2,
  });
  if (showGstNumber) {
    doc.fontSize(8.5).fillColor(muted).text(`GSTIN: ${gstNumber}`, 40, 84);
  }

  doc.roundedRect(501, 44, 24, 6, 2).fillAndStroke('#f29ab6', accent);
  doc.roundedRect(502, 50, 22, 22, 2).fillAndStroke('#ffd6e2', accent);
  doc.moveTo(513, 44).lineTo(513, 72).lineWidth(1.3).strokeColor(accent).stroke();
  doc.moveTo(502, 50).lineTo(524, 50).lineWidth(1).strokeColor(accent).stroke();
  doc.path('M513 43 C513 40 510 38 508 39.5 C506.5 40.6 507 43 509.3 43 L513 43 Z').fill(accent);
  doc.path('M513 43 C513 40 516 38 518 39.5 C519.5 40.6 519 43 516.7 43 L513 43 Z').fill(accent);
  doc.circle(513, 44, 1.8).fill('#f9a8c0');
  doc.font('Times-Italic').fontSize(42).fillColor(ink).text('Invoice', 350, 82, { align: 'right', width: 175 });
  doc.font('Helvetica').fontSize(9).fillColor(muted);
  doc.text(`Invoice No : ${data.invoiceNumber || ''}`, 370, 136, { align: 'right', width: 160 });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(ink).text(`Date : ${formatDate(data.date)}`, 370, 154, { align: 'right', width: 160 });

  doc.moveTo(40, 190).lineTo(555, 190).strokeColor(border).stroke();

  doc.font('Helvetica').fontSize(9).fillColor(muted).text('INVOICE TO :', 40, 212, { characterSpacing: 2.4 });
  doc.font('Times-Bold').fontSize(17).fillColor(ink).text(String(data.customerName || 'Customer').toUpperCase(), 40, 232);
  doc.font('Helvetica').fontSize(9.5).fillColor(muted);
  if (data.customerAddress) doc.text(`address: ${data.customerAddress}`, 40, 276, { width: 260, lineBreak: false, ellipsis: true });
  if (data.customerPhone) doc.text(`phone number: ${data.customerPhone}`, 40, data.customerAddress ? 294 : 276, { width: 260, lineBreak: false, ellipsis: true });

  let y = 320;
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

  y += 20;
  y = ensurePdfPageSpace(doc, y, 130, () => 60);

  const summaryX = 378;
  const summaryLabelWidth = 90;
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
    doc.font('Helvetica').fontSize(10).fillColor(muted).text(`${label} :`, summaryX, summaryY, { width: summaryLabelWidth });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(ink).text(value, summaryX + summaryLabelWidth, summaryY, {
      width: summaryValueWidth,
      align: 'right',
    });
    summaryY += 18;
  });

  doc.moveTo(summaryX, summaryY + 4).lineTo(summaryX + summaryLabelWidth + summaryValueWidth, summaryY + 4).strokeColor(ink).stroke();
  doc.font('Helvetica-Bold').fontSize(13).fillColor(ink).text('Grand Total :', summaryX, summaryY + 14, { width: summaryLabelWidth });
  doc.text(formatPdfCurrency(totals.grandTotal), summaryX + summaryLabelWidth, summaryY + 10, {
    width: summaryValueWidth,
    align: 'right',
  });

  const footerY = 664;
  doc.moveTo(40, footerY - 8).lineTo(555, footerY - 8).strokeColor(border).stroke();
  doc.font('Helvetica').fontSize(9).fillColor(muted).text('PAYMENT METHOD', 40, footerY + 18, { characterSpacing: 2.2 });
  doc.font('Helvetica').fontSize(10).fillColor(ink).text('Bank Name:', 40, footerY + 42);
  doc.font('Helvetica-Bold').fontSize(10).text(` ${settings?.bankAccountName || settings?.bankName || "Kiki's Gift Store"}`, 93, footerY + 42);
  doc.font('Helvetica').fontSize(10).text('Account No :', 40, footerY + 64);
  doc.font('Helvetica-Bold').fontSize(10).text(` ${settings?.bankAccountNumber || '9876543210'}`, 97, footerY + 64);

  doc.roundedRect(248, footerY + 40, 24, 6, 2).fillAndStroke('#f29ab6', accent);
  doc.roundedRect(249, footerY + 46, 22, 20, 2).fillAndStroke('#ffd6e2', accent);
  doc.moveTo(260, footerY + 40).lineTo(260, footerY + 66).lineWidth(1.3).strokeColor(accent).stroke();
  doc.moveTo(249, footerY + 46).lineTo(271, footerY + 46).lineWidth(1).strokeColor(accent).stroke();
  doc.path(`M260 ${footerY + 39} C260 ${footerY + 36} 257 ${footerY + 34} 255 ${footerY + 35.5} C253.5 ${footerY + 36.6} 254 ${footerY + 39} 256.3 ${footerY + 39} L260 ${footerY + 39} Z`).fill(accent);
  doc.path(`M260 ${footerY + 39} C260 ${footerY + 36} 263 ${footerY + 34} 265 ${footerY + 35.5} C266.5 ${footerY + 36.6} 266 ${footerY + 39} 263.7 ${footerY + 39} L260 ${footerY + 39} Z`).fill(accent);
  doc.circle(260, footerY + 40, 1.8).fill('#f9a8c0');
  doc.font('Times-Italic').fontSize(34).fillColor(ink).text('Thank you', 286, footerY + 24);

  doc.fillColor('#f09ab7').fontSize(22).text('\u2665', 418, footerY + 24);
  doc.font('Helvetica').fontSize(9).fillColor(muted).text('SIGNATURE', 458, footerY + 62, { characterSpacing: 3.2 });
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(muted).text('Please send payment within 30 days of receiving this invoice.', 170, footerY + 92);

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

  sendInvoiceHtml(res, invoiceNumber, {
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

  sendOfflineSaleInvoicePdf(res, sale.invoiceNumber, {
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
