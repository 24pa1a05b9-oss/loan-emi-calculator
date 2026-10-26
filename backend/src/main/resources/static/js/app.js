/**
 * Loan EMI Calculator - Frontend Application Script
 * Full Stack Integration with Spring Boot & PostgreSQL
 */

// API Base URL - Automatically handles both unified Spring Boot hosting and standalone frontend
const API_BASE = (window.location.port === '8080' || window.location.pathname.startsWith('/api'))
  ? ''
  : 'http://localhost:8080';

// Global State
let currentCalculation = null;
let savedHistoryData = [];
let emiChartInstance = null;

// DOM Elements
const emiForm = document.getElementById('emiForm');
const loanNameInput = document.getElementById('loanName');
const loanAmountInput = document.getElementById('loanAmount');
const annualInterestRateInput = document.getElementById('annualInterestRate');
const tenureInput = document.getElementById('tenure');
const tenureUnitSelect = document.getElementById('tenureUnit');

const btnCalculate = document.getElementById('btnCalculate');
const btnReset = document.getElementById('btnReset');
const btnSave = document.getElementById('btnSave');
const btnSaveShortcut = document.getElementById('btnSaveShortcut');

const resultsPlaceholder = document.getElementById('resultsPlaceholder');
const resultsContainer = document.getElementById('resultsContainer');

const resMonthlyEmi = document.getElementById('resMonthlyEmi');
const resPrincipal = document.getElementById('resPrincipal');
const resTotalInterest = document.getElementById('resTotalInterest');
const resTotalPayment = document.getElementById('resTotalPayment');
const resInterestRate = document.getElementById('resInterestRate');
const resTenure = document.getElementById('resTenure');
const resTenureYears = document.getElementById('resTenureYears');
const resTenureSummary = document.getElementById('resTenureSummary');
const resInterestPercent = document.getElementById('resInterestPercent');
const resLoanBadge = document.getElementById('resLoanBadge');

const chartPrincipalText = document.getElementById('chartPrincipalText');
const chartInterestText = document.getElementById('chartInterestText');

const historyTableBody = document.getElementById('historyTableBody');
const historyLoading = document.getElementById('historyLoading');
const historyEmptyState = document.getElementById('historyEmptyState');
const historyBadge = document.getElementById('historyBadge');
const historySearchInput = document.getElementById('historySearchInput');
const historyDateInput = document.getElementById('historyDateInput');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupFormEventListeners();
  fetchHistory();
});

// Format Currency in INR
function formatINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹ 0.00';
  const num = Number(amount);
  return '₹ ' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Format Date & Time for display
function formatDateTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// Notification Toast Utility
function showToast(message, type = 'success') {
  const toastEl = document.getElementById('liveToast');
  const toastMessage = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');

  toastMessage.textContent = message;

  toastEl.className = 'toast align-items-center text-white border-0 shadow-lg';
  if (type === 'success') {
    toastEl.classList.add('bg-success');
    toastIcon.className = 'bi bi-check-circle-fill fs-5';
  } else if (type === 'error' || type === 'danger') {
    toastEl.classList.add('bg-danger');
    toastIcon.className = 'bi bi-exclamation-triangle-fill fs-5';
  } else {
    toastEl.classList.add('bg-primary');
    toastIcon.className = 'bi bi-info-circle-fill fs-5';
  }

  const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 4000 });
  toast.show();
}

// Single Page Navigation Handling
function setupNavigation() {
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'home';
    showSection(hash);
  });

  const initialHash = window.location.hash.replace('#', '') || 'home';
  showSection(initialHash);
}

function showSection(sectionId) {
  const sections = ['home', 'calculator', 'history'];
  sections.forEach(sec => {
    const el = document.getElementById(`section-${sec}`);
    const nav = document.getElementById(`nav-${sec}`);
    if (el) {
      if (sec === sectionId) {
        el.classList.remove('d-none');
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Keep sections rendered or smooth scroll
      }
    }
    if (nav) {
      if (sec === sectionId) {
        nav.classList.add('active');
      } else {
        nav.classList.remove('active');
      }
    }
  });
}

// Quick Preset Amount
function setPresetAmount(amount) {
  loanAmountInput.value = amount;
  updateBadgeLabels();
  loanAmountInput.classList.remove('is-invalid');
}

// Input Badges Live Preview
function updateBadgeLabels() {
  const amt = parseFloat(loanAmountInput.value);
  document.getElementById('loanAmountFormatted').textContent = !isNaN(amt) && amt > 0 ? formatINR(amt) : '₹ 0';

  const rate = parseFloat(annualInterestRateInput.value);
  document.getElementById('rateFormatted').textContent = !isNaN(rate) && rate >= 0 ? `${rate.toFixed(2)}%` : '0.00%';

  const tenureVal = parseInt(tenureInput.value, 10);
  const unit = tenureUnitSelect.value;
  if (!isNaN(tenureVal) && tenureVal > 0) {
    const months = unit === 'YEARS' ? tenureVal * 12 : tenureVal;
    document.getElementById('tenureFormatted').textContent = `${months} Months (${(months / 12).toFixed(1)} Yrs)`;
  } else {
    document.getElementById('tenureFormatted').textContent = '0 Months';
  }
}

// Event Listeners for Form
function setupFormEventListeners() {
  loanAmountInput.addEventListener('input', updateBadgeLabels);
  annualInterestRateInput.addEventListener('input', updateBadgeLabels);
  tenureInput.addEventListener('input', updateBadgeLabels);
  tenureUnitSelect.addEventListener('change', updateBadgeLabels);

  emiForm.addEventListener('submit', (e) => {
    e.preventDefault();
    calculateEMI();
  });

  btnReset.addEventListener('click', resetCalculator);
  btnSave.addEventListener('click', saveCurrentCalculation);

  historySearchInput.addEventListener('input', filterHistoryTable);
  historyDateInput.addEventListener('change', filterHistoryTable);
}

// Reset Calculator
function resetCalculator() {
  emiForm.reset();
  loanAmountInput.classList.remove('is-invalid');
  annualInterestRateInput.classList.remove('is-invalid');
  tenureInput.classList.remove('is-invalid');

  updateBadgeLabels();

  currentCalculation = null;
  btnSave.disabled = true;

  resultsContainer.classList.add('d-none');
  resultsPlaceholder.classList.remove('d-none');

  if (emiChartInstance) {
    emiChartInstance.destroy();
    emiChartInstance = null;
  }
}

// Perform EMI Calculation
function calculateEMI() {
  // Clear previous validation states
  loanAmountInput.classList.remove('is-invalid');
  annualInterestRateInput.classList.remove('is-invalid');
  tenureInput.classList.remove('is-invalid');

  let isValid = true;

  const loanAmount = parseFloat(loanAmountInput.value);
  if (isNaN(loanAmount) || loanAmount <= 0) {
    loanAmountInput.classList.add('is-invalid');
    isValid = false;
  }

  const annualRate = parseFloat(annualInterestRateInput.value);
  if (isNaN(annualRate) || annualRate < 0 || annualRate > 100) {
    annualInterestRateInput.classList.add('is-invalid');
    isValid = false;
  }

  const tenureRaw = parseInt(tenureInput.value, 10);
  const tenureUnit = tenureUnitSelect.value;
  if (isNaN(tenureRaw) || tenureRaw <= 0) {
    tenureInput.classList.add('is-invalid');
    isValid = false;
  }

  const tenureMonths = tenureUnit === 'YEARS' ? tenureRaw * 12 : tenureRaw;
  if (tenureMonths <= 0 || tenureMonths > 600) {
    tenureInput.classList.add('is-invalid');
    document.getElementById('tenureError').textContent = 'Tenure must be between 1 month and 50 years (600 months).';
    isValid = false;
  }

  if (!isValid) return;

  // Formula:
  // EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
  // r = Annual Rate / 12 / 100
  let monthlyEmi = 0;
  let totalPayment = 0;
  let totalInterest = 0;

  if (annualRate === 0) {
    monthlyEmi = loanAmount / tenureMonths;
    totalPayment = loanAmount;
    totalInterest = 0;
  } else {
    const monthlyRate = annualRate / 12 / 100;
    const factor = Math.pow(1 + monthlyRate, tenureMonths);
    monthlyEmi = (loanAmount * monthlyRate * factor) / (factor - 1);
    totalPayment = monthlyEmi * tenureMonths;
    totalInterest = Math.max(0, totalPayment - loanAmount);
  }

  // Round to two decimal places
  monthlyEmi = Math.round(monthlyEmi * 100) / 100;
  totalPayment = Math.round(totalPayment * 100) / 100;
  totalInterest = Math.round(totalInterest * 100) / 100;

  const loanName = loanNameInput.value.trim() || 'General Loan';

  currentCalculation = {
    loanName,
    loanAmount,
    principal: loanAmount,
    annualInterestRate: annualRate,
    tenure: tenureRaw,
    tenureUnit,
    tenureMonths,
    monthlyEmi,
    totalInterest,
    totalPayment
  };

  displayResults(currentCalculation);
}

// Display Calculation Results
function displayResults(data) {
  resMonthlyEmi.textContent = formatINR(data.monthlyEmi);
  resPrincipal.textContent = formatINR(data.loanAmount);
  resTotalInterest.textContent = formatINR(data.totalInterest);
  resTotalPayment.textContent = formatINR(data.totalPayment);
  resInterestRate.textContent = `${Number(data.annualInterestRate).toFixed(2)}%`;
  resTenure.textContent = `${data.tenureMonths} Months`;
  resTenureYears.textContent = `${(data.tenureMonths / 12).toFixed(1)} Years`;
  resTenureSummary.textContent = `${data.tenureMonths} Months (${(data.tenureMonths / 12).toFixed(1)} Years)`;

  resLoanBadge.textContent = data.loanName || 'Standard Loan';

  const interestRatio = data.totalPayment > 0
    ? ((data.totalInterest / data.totalPayment) * 100).toFixed(1)
    : 0;
  const principalRatio = (100 - interestRatio).toFixed(1);

  resInterestPercent.textContent = `${interestRatio}% of total payment`;
  chartPrincipalText.textContent = `${formatINR(data.loanAmount)} (${principalRatio}%)`;
  chartInterestText.textContent = `${formatINR(data.totalInterest)} (${interestRatio}%)`;

  renderBreakdownChart(data.loanAmount, data.totalInterest);

  resultsPlaceholder.classList.add('d-none');
  resultsContainer.classList.remove('d-none');

  // Enable Save button
  btnSave.disabled = false;
  btnSave.classList.remove('btn-secondary');
  btnSave.classList.add('btn-success');
}

// Render Chart.js Doughnut Chart
function renderBreakdownChart(principal, interest) {
  const ctx = document.getElementById('emiBreakdownChart').getContext('2d');

  if (emiChartInstance) {
    emiChartInstance.destroy();
  }

  emiChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Principal Amount', 'Total Interest'],
      datasets: [{
        data: [principal, interest],
        backgroundColor: ['#2563eb', '#f59e0b'],
        hoverBackgroundColor: ['#1d4ed8', '#d97706'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const val = context.raw || 0;
              return ` ${label}: ${formatINR(val)}`;
            }
          }
        }
      },
      cutout: '72%'
    }
  });
}

// Save Current Calculation to Backend / PostgreSQL
async function saveCurrentCalculation() {
  if (!currentCalculation) {
    showToast('Please calculate an EMI first before saving.', 'error');
    return;
  }

  const payload = {
    loanName: currentCalculation.loanName,
    loanAmount: currentCalculation.loanAmount,
    annualInterestRate: currentCalculation.annualInterestRate,
    tenure: currentCalculation.tenure,
    tenureUnit: currentCalculation.tenureUnit,
    tenureMonths: currentCalculation.tenureMonths
  };

  setButtonLoading(btnSave, true, 'Saving...');
  if (btnSaveShortcut) setButtonLoading(btnSaveShortcut, true, 'Saving...');

  try {
    const response = await fetch(`${API_BASE}/api/calculations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData.message || 'Failed to save calculation to database.';
      throw new Error(msg);
    }

    const savedRecord = await response.json();
    showToast(`Calculation for "${savedRecord.loanName}" saved successfully!`, 'success');

    // Refresh history table
    await fetchHistory();

    // Disable Save button until next calculation
    btnSave.disabled = true;
  } catch (error) {
    console.error('Error saving calculation:', error);
    showToast(`Error: ${error.message}`, 'error');
  } finally {
    setButtonLoading(btnSave, false, '<i class="bi bi-cloud-arrow-up me-1"></i> Save');
    if (btnSaveShortcut) setButtonLoading(btnSaveShortcut, false, '<i class="bi bi-cloud-arrow-up-fill me-1"></i> Save to History');
  }
}

// Fetch Calculation History from Backend
async function fetchHistory() {
  const refreshIcon = document.getElementById('refreshIcon');
  if (refreshIcon) refreshIcon.classList.add('spin');
  historyLoading.classList.remove('d-none');
  historyEmptyState.classList.add('d-none');

  try {
    const response = await fetch(`${API_BASE}/api/calculations`);
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    savedHistoryData = Array.isArray(data) ? data : [];
    renderHistoryTable(savedHistoryData);
    updateHistoryBadge(savedHistoryData.length);
  } catch (error) {
    console.error('Error fetching calculation history:', error);
    historyTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center py-4 text-danger">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          Could not connect to backend API (${error.message}). Ensure Spring Boot and PostgreSQL are running.
        </td>
      </tr>
    `;
    updateHistoryBadge(0);
  } finally {
    historyLoading.classList.add('d-none');
    if (refreshIcon) refreshIcon.classList.remove('spin');
  }
}

// Render History Table Rows
function renderHistoryTable(records) {
  historyTableBody.innerHTML = '';

  if (!records || records.length === 0) {
    historyEmptyState.classList.remove('d-none');
    return;
  }

  historyEmptyState.classList.add('d-none');

  records.forEach((item) => {
    const tr = document.createElement('tr');
    tr.id = `history-row-${item.id}`;

    tr.innerHTML = `
      <td class="fw-bold text-secondary">#${item.id}</td>
      <td>
        <span class="fw-semibold text-dark">${escapeHtml(item.loanName || 'General Loan')}</span>
      </td>
      <td class="fw-bold text-dark">${formatINR(item.loanAmount || item.principal)}</td>
      <td><span class="badge bg-light text-primary border">${Number(item.annualInterestRate).toFixed(2)}%</span></td>
      <td>${item.tenureMonths} Mo <span class="text-muted small">(${(item.tenureMonths / 12).toFixed(1)}y)</span></td>
      <td class="fw-bold text-primary">${formatINR(item.monthlyEmi)}</td>
      <td class="text-warning-emphasis">${formatINR(item.totalInterest)}</td>
      <td class="fw-semibold text-dark">${formatINR(item.totalPayment)}</td>
      <td class="small text-secondary">${formatDateTime(item.createdAt)}</td>
      <td class="text-end">
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary" onclick="viewCalculationDetail(${item.id})" title="View Details">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-outline-danger" onclick="deleteHistoryItem(${item.id})" title="Delete Record">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;

    historyTableBody.appendChild(tr);
  });
}

// Update Nav Badge
function updateHistoryBadge(count) {
  if (historyBadge) {
    historyBadge.textContent = count;
  }
}

// Filter History by Amount or Date
function filterHistoryTable() {
  const query = historySearchInput.value.trim().toLowerCase();
  const dateQuery = historyDateInput.value; // "YYYY-MM-DD"

  const filtered = savedHistoryData.filter(item => {
    let matchesQuery = true;
    let matchesDate = true;

    if (query) {
      const name = (item.loanName || '').toLowerCase();
      const amount = String(item.loanAmount || item.principal || '');
      const id = String(item.id);
      matchesQuery = name.includes(query) || amount.includes(query) || id.includes(query);
    }

    if (dateQuery) {
      if (item.createdAt) {
        const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
        matchesDate = itemDate === dateQuery;
      } else {
        matchesDate = false;
      }
    }

    return matchesQuery && matchesDate;
  });

  renderHistoryTable(filtered);
}

function clearDateFilter() {
  historyDateInput.value = '';
  filterHistoryTable();
}

// View Complete Calculation Details Modal
async function viewCalculationDetail(id) {
  try {
    const response = await fetch(`${API_BASE}/api/calculations/${id}`);
    if (!response.ok) {
      throw new Error(`Record not found (HTTP ${response.status})`);
    }

    const calc = await response.json();
    const modalBody = document.getElementById('modalDetailBody');

    const principal = Number(calc.loanAmount || calc.principal);
    const totalInterest = Number(calc.totalInterest);
    const totalPayment = Number(calc.totalPayment);
    const interestRatio = totalPayment > 0 ? ((totalInterest / totalPayment) * 100).toFixed(1) : 0;
    const principalRatio = (100 - interestRatio).toFixed(1);

    modalBody.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="fw-bold text-dark mb-0">${escapeHtml(calc.loanName || 'General Loan')}</h4>
        <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">ID: #${calc.id}</span>
      </div>

      <div class="card border-0 bg-light p-3 rounded-3 mb-3 text-center">
        <div class="small text-secondary fw-semibold">Monthly EMI</div>
        <div class="display-6 fw-bold text-primary">${formatINR(calc.monthlyEmi)}</div>
        <div class="small text-muted">Payable for ${calc.tenureMonths} Months (${(calc.tenureMonths / 12).toFixed(1)} Years)</div>
      </div>

      <div class="list-group list-group-flush small mb-3">
        <div class="list-group-item d-flex justify-content-between px-0">
          <span class="text-secondary">Principal Loan Amount:</span>
          <span class="fw-bold text-dark">${formatINR(principal)}</span>
        </div>
        <div class="list-group-item d-flex justify-content-between px-0">
          <span class="text-secondary">Annual Interest Rate:</span>
          <span class="fw-bold text-dark">${Number(calc.annualInterestRate).toFixed(2)}%</span>
        </div>
        <div class="list-group-item d-flex justify-content-between px-0">
          <span class="text-secondary">Loan Tenure:</span>
          <span class="fw-bold text-dark">${calc.tenureMonths} Months (${(calc.tenureMonths / 12).toFixed(1)} Years)</span>
        </div>
        <div class="list-group-item d-flex justify-content-between px-0">
          <span class="text-secondary">Total Interest Payable:</span>
          <span class="fw-bold text-warning-emphasis">${formatINR(totalInterest)} (${interestRatio}%)</span>
        </div>
        <div class="list-group-item d-flex justify-content-between px-0">
          <span class="text-secondary">Total Repayment:</span>
          <span class="fw-bold text-primary">${formatINR(totalPayment)}</span>
        </div>
        <div class="list-group-item d-flex justify-content-between px-0">
          <span class="text-secondary">Saved On:</span>
          <span class="text-muted">${formatDateTime(calc.createdAt)}</span>
        </div>
      </div>

      <div class="progress mb-2" style="height: 10px;">
        <div class="progress-bar bg-primary" role="progressbar" style="width: ${principalRatio}%" title="Principal ${principalRatio}%"></div>
        <div class="progress-bar bg-warning" role="progressbar" style="width: ${interestRatio}%" title="Interest ${interestRatio}%"></div>
      </div>
      <div class="d-flex justify-content-between small text-muted">
        <span>Principal: ${principalRatio}%</span>
        <span>Interest: ${interestRatio}%</span>
      </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('calculationDetailModal'));
    modal.show();
  } catch (error) {
    showToast(`Error retrieving details: ${error.message}`, 'error');
  }
}

// Delete Individual History Record
async function deleteHistoryItem(id) {
  if (!confirm(`Are you sure you want to delete calculation #${id}?`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/calculations/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to delete record (HTTP ${response.status})`);
    }

    showToast(`Calculation #${id} was deleted successfully.`, 'success');
    await fetchHistory();
  } catch (error) {
    showToast(`Error deleting calculation: ${error.message}`, 'error');
  }
}

// Confirm Clear All Dialog
function confirmClearAll() {
  if (!savedHistoryData || savedHistoryData.length === 0) {
    showToast('There is no history to clear.', 'info');
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById('clearAllConfirmModal'));
  modal.show();
}

// Execute Clear All History
async function executeClearAll() {
  const btn = document.getElementById('btnConfirmClear');
  setButtonLoading(btn, true, 'Clearing...');

  try {
    const response = await fetch(`${API_BASE}/api/calculations`, {
      method: 'DELETE'
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to clear history (HTTP ${response.status})`);
    }

    const modalEl = document.getElementById('clearAllConfirmModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    showToast('All calculation history has been cleared successfully.', 'success');
    await fetchHistory();
  } catch (error) {
    showToast(`Error clearing history: ${error.message}`, 'error');
  } finally {
    setButtonLoading(btn, false, 'Yes, Clear All');
  }
}

// Helper: Button Loading State
function setButtonLoading(button, isLoading, text) {
  if (!button) return;
  if (isLoading) {
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${text}`;
  } else {
    button.disabled = false;
    button.innerHTML = text;
  }
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m];
  });
}
