import Order from '../models/Order.js';
import OfflineSale from '../models/OfflineSale.js';
import AppSetting from '../models/AppSetting.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { getGstAmountFromInclusive, getProductGstRate, getProductMrp, getTaxableAmountFromInclusive } from '../utils/pricing.js';

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
  const grandTotal = Number(fallbackTotal || 0);
  const gst = Number(fallbackTax || items.reduce((sum, item) => sum + Number(item.gstAmount || 0), 0));
  const cgst = items.reduce((sum, item) => sum + Number(item.cgstAmount || 0), 0);
  const sgst = items.reduce((sum, item) => sum + Number(item.sgstAmount || 0), 0);
  const igst = items.reduce((sum, item) => sum + Number(item.igstAmount || 0), 0);
  const taxableSubtotal = Number(fallbackSubtotal || Math.max(grandTotal - gst, 0));
  const discount = Math.max(mrpTotal - grandTotal, 0);
  const discountPercentage = mrpTotal > 0 ? (discount / mrpTotal) * 100 : 0;

  return {
    mrpTotal: mrpTotal || grandTotal,
    discount,
    discountPercentage: formatDiscountPercentage(discountPercentage),
    taxableSubtotal,
    gst,
    cgst,
    sgst,
    igst,
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
          <td>${formatCurrency(cgstAmount)}</td>
          <td>${formatCurrency(sgstAmount)}</td>
          <td>${formatCurrency(igstAmount)}</td>
          <td>${formatCurrency(total)}</td>
        </tr>`;
  }).join('') || `
        <tr>
          <td>product/service</td>
          <td>0</td>
          <td>${formatCurrency(0)}</td>
          <td>${formatCurrency(0)}</td>
          <td>${formatCurrency(0)}</td>
          <td>${formatCurrency(0)}</td>
          <td>${formatCurrency(0)}</td>
          <td>${formatCurrency(0)}</td>
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
      max-width: 720px;
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

    .invoice-title-block {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .gift-deco { margin-bottom: 4px; }

    .invoice-word {
      font-family: 'Dancing Script', cursive;
      font-size: 52px;
      font-weight: 700;
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
      margin-bottom: 4px;
      font-weight: 300;
    }
    .invoice-meta span {
      color: var(--ink);
      font-weight: 600;
    }

    .table-wrap { margin: 0 40px 24px; }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;
    }

    thead tr { background: var(--pink-soft); }

    thead th {
      padding: 12px 16px;
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
      padding: 14px 16px;
      border-left: 1px solid var(--border);
      border-right: 1px solid var(--border);
      color: var(--ink);
      font-weight: 300;
    }
    tbody td:not(:first-child) { text-align: center; }
    tbody td:last-child { text-align: right; font-weight: 500; }

    .totals-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 0 40px 32px;
      gap: 20px;
    }

    .subtotal-labels {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .subtotal-labels p {
      font-family: 'Cormorant Garamond', serif;
      font-size: 17px;
      font-weight: 500;
      color: var(--ink);
    }

    .totals-values { min-width: 200px; }

    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 0;
      font-size: 13px;
      color: var(--ink-muted);
      font-weight: 300;
    }
    .totals-row .label { margin-right: 40px; }

    .total-final {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1.5px solid var(--ink);
      padding-top: 8px;
      margin-top: 4px;
      font-weight: 700;
      font-size: 15px;
      color: var(--ink);
    }

    .invoice-footer {
      background: var(--pink-soft);
      border-top: 1px solid var(--border);
      padding: 28px 40px 32px;
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
      margin-bottom: 4px;
      font-weight: 300;
    }
    .payment-detail strong { font-weight: 600; }

    .thankyou-block {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .thankyou-text {
      font-family: 'Dancing Script', cursive;
      font-size: 40px;
      font-weight: 700;
      color: var(--ink);
      line-height: 1;
    }

    .signature-block {
      text-align: center;
      min-width: 120px;
    }
    .signature-line {
      height: 1px;
      background: var(--ink);
      width: 120px;
      margin-bottom: 6px;
    }
    .signature-text {
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ink-muted);
      font-weight: 400;
    }

    .terms-text {
      margin-top: 20px;
      font-size: 11.5px;
      color: var(--ink-muted);
      text-align: center;
      font-style: italic;
      font-weight: 300;
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
      .invoice-word { font-size: 38px; }
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
      </div>
    </div>

    <div class="invoice-title-block">
      <div class="gift-deco">
        <svg class="gift-svg" width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="26" width="40" height="24" rx="3" fill="#ffd6e2"/>
          <rect x="8" y="26" width="40" height="24" rx="3" stroke="#e8648a" stroke-width="1.5"/>
          <rect x="6" y="20" width="44" height="8" rx="2" fill="#f9a8c0"/>
          <rect x="6" y="20" width="44" height="8" rx="2" stroke="#e8648a" stroke-width="1.5"/>
          <rect x="24" y="20" width="8" height="30" rx="2" fill="#e8648a" opacity="0.7"/>
          <rect x="6" y="22" width="44" height="4" rx="1" fill="#e8648a" opacity="0.5"/>
          <ellipse cx="21" cy="18" rx="8" ry="5" transform="rotate(-20 21 18)" fill="#e8648a" opacity="0.85"/>
          <ellipse cx="35" cy="18" rx="8" ry="5" transform="rotate(20 35 18)" fill="#e8648a" opacity="0.85"/>
          <circle cx="28" cy="19" r="4" fill="#c94070"/>
          <circle cx="28" cy="19" r="2" fill="white" opacity="0.8"/>
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
      <p>Date: <span id="invoiceDate">${escapeHtml(formatDate(data.date))}</span></p>
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
	          <th>CGST</th>
	          <th>SGST</th>
	          <th>IGST</th>
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
	      <p>Discount: ${totals.discountPercentage}%</p>
	      <p>Taxable Amount :</p>
	      <p>CGST :</p>
	      <p>SGST :</p>
	      <p>IGST :</p>
	      <p>GST :</p>
	      <p>Grand Total :</p>
	    </div>

	    <div class="totals-values">
	      <div class="totals-row">
	        <span class="label">MRP Total :</span>
	        <span id="actualTotal">${formatCurrency(totals.mrpTotal)}</span>
	      </div>
	      <div class="totals-row">
	        <span class="label">Discount (${totals.discountPercentage}%) :</span>
	        <span id="discountVal">- ${formatCurrency(totals.discount)}</span>
	      </div>
	      <div class="totals-row">
	        <span class="label">Taxable Amount :</span>
	        <span id="subTotal">${formatCurrency(totals.taxableSubtotal)}</span>
	      </div>
	      <div class="totals-row">
	        <span class="label">CGST :</span>
	        <span id="cgstTotal">${formatCurrency(totals.cgst)}</span>
	      </div>
	      <div class="totals-row">
	        <span class="label">SGST :</span>
	        <span id="sgstTotal">${formatCurrency(totals.sgst)}</span>
	      </div>
	      <div class="totals-row">
	        <span class="label">IGST :</span>
	        <span id="igstTotal">${formatCurrency(totals.igst)}</span>
	      </div>
	      <div class="totals-row">
	        <span class="label">GST :</span>
	        <span id="gstTotal">${formatCurrency(totals.gst)}</span>
	      </div>
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
          <rect x="8" y="26" width="40" height="24" rx="3" fill="#ffd6e2"/>
          <rect x="8" y="26" width="40" height="24" rx="3" stroke="#e8648a" stroke-width="1.5"/>
          <rect x="6" y="20" width="44" height="8" rx="2" fill="#f9a8c0"/>
          <rect x="6" y="20" width="44" height="8" rx="2" stroke="#e8648a" stroke-width="1.5"/>
          <rect x="24" y="20" width="8" height="30" rx="2" fill="#e8648a" opacity="0.7"/>
          <rect x="6" y="22" width="44" height="4" rx="1" fill="#e8648a" opacity="0.5"/>
          <ellipse cx="21" cy="18" rx="8" ry="5" transform="rotate(-20 21 18)" fill="#e8648a" opacity="0.85"/>
          <ellipse cx="35" cy="18" rx="8" ry="5" transform="rotate(20 35 18)" fill="#e8648a" opacity="0.85"/>
          <circle cx="28" cy="19" r="4" fill="#c94070"/>
          <circle cx="28" cy="19" r="2" fill="white" opacity="0.8"/>
        </svg>
        <div class="thankyou-text">Thank you</div>
        <svg width="28" height="26" viewBox="0 0 28 26" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-left:-8px;margin-bottom:10px;opacity:0.6">
          <path d="M14 23S2 15 2 8a6 6 0 0112 0 6 6 0 0112 0c0 7-12 15-12 15z" fill="#e8648a"/>
        </svg>
      </div>

      <div class="signature-block">
        <div class="signature-line"></div>
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
  const invoiceNumber = order.invoiceNumber || order.orderNumber;

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
  }, settings);
});

export const generateOfflineSaleInvoice = asyncHandler(async (req, res) => {
  const sale = await OfflineSale.findById(req.params.id).populate('items.product');
  if (!sale) throw new ApiError(404, 'Sale not found');

  const settings = await AppSetting.findOne();

  sendInvoiceHtml(res, sale.invoiceNumber, {
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
  }, settings);
});
