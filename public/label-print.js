const params = new URLSearchParams(window.location.search);
const jobId = params.get('job');
const storageKey = jobId ? `nubixor.label-job.${jobId}` : '';
const sheet = document.querySelector('#labelSheet');
const errorPanel = document.querySelector('#printError');
const summary = document.querySelector('#jobSummary');
let job = null;
let printingRequested = false;

function addText(parent, className, value, enabled = true) {
  if (!enabled || !value) return;
  const node = document.createElement(className === 'price' ? 'em' : 'span');
  node.className = className;
  node.textContent = value;
  parent.append(node);
}

function formatMoney(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function renderLabel(item) {
  const label = document.createElement('article');
  label.className = 'product-label';
  addText(label, 'company', job.companyName, job.settings.showCompany);
  addText(label, 'product', item.productName, job.settings.showProduct);
  addText(label, 'price', formatMoney(item.price), job.settings.showPrice);
  if (job.settings.showBarcode) {
    const barcode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    barcode.classList.add('barcode');
    barcode.dataset.value = item.barcode || item.sku;
    label.append(barcode);
  }
  addText(label, 'sku', item.sku, job.settings.showSku);
  addText(label, 'footer', job.settings.footerText, Boolean(job.settings.footerText));
  return label;
}

function renderJob() {
  if (!storageKey) throw new Error('Trabajo de impresión no identificado.');
  job = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
  if (!job?.items?.length) throw new Error('Trabajo de impresión vacío.');
  document.documentElement.style.setProperty('--label-width', `${job.settings.widthMm}mm`);
  document.documentElement.style.setProperty('--label-height', `${job.settings.heightMm}mm`);
  let total = 0;
  for (const item of job.items) {
    const quantity = Math.max(1, Math.min(10000, Math.trunc(Number(item.quantity) || 1)));
    total += quantity;
    for (let index = 0; index < quantity; index += 1) {
      sheet.append(renderLabel(item));
    }
  }
  if (job.settings.showBarcode && window.JsBarcode) {
    document.querySelectorAll('.barcode').forEach((barcode) => {
      window.JsBarcode(barcode, barcode.dataset.value, {
        format: 'CODE128',
        displayValue: false,
        height: 25,
        width: 1.2,
        margin: 0,
      });
    });
  }
  summary.textContent = `${job.batchNumber} · ${total} etiqueta${total === 1 ? '' : 's'}`;
}

function notifyPrinted() {
  if (!printingRequested || !job || !window.opener) return;
  window.opener.postMessage({
    type: 'nubixor:labels-printed',
    jobId,
    batchId: job.batchId,
    items: job.items.map((item) => ({
      itemId: item.itemId,
      quantity: Math.max(1, Math.trunc(Number(item.quantity) || 1)),
    })),
  }, window.location.origin);
  printingRequested = false;
}

document.querySelector('#startPrint').addEventListener('click', () => {
  printingRequested = true;
  window.print();
});
document.querySelector('#closePrintWindow').addEventListener('click', () => window.close());
window.addEventListener('afterprint', notifyPrinted);

try {
  renderJob();
} catch {
  sheet.hidden = true;
  errorPanel.hidden = false;
  summary.textContent = 'Trabajo no disponible';
}
