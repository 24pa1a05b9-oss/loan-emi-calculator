import { useEffect, useMemo, useState } from 'react'
import {
  Calculator,
  Clock3,
  Trash2,
  Wallet,
  TrendingUp,
  Landmark,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react'

// On Vercel, serverless functions live on the same origin under /api
// VITE_API_BASE_URL can override for custom remote deployments
const API = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const initialForm = {
  loanName: 'Home Loan',
  principal: '2500000',
  annualInterestRate: '8.5',
  tenureMonths: '240'
}

// EMI Calculation Formula
// EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
// where r = annualInterestRate / 12 / 100
function calculate({ principal, annualInterestRate, tenureMonths }) {
  const p = Number(principal)
  const annual = Number(annualInterestRate)
  const n = Number(tenureMonths)

  if (!(p > 0) || isNaN(annual) || annual < 0 || !(n > 0)) {
    return null
  }

  const r = annual / 1200
  // Zero-interest promotional scheme support
  const emi = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  const totalPayment = emi * n
  const totalInterest = Math.max(0, totalPayment - p)

  return {
    monthlyEmi: emi,
    totalPayment,
    totalInterest
  }
}

export default function App() {
  const [form, setForm] = useState(initialForm)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('calculator')

  const result = useMemo(() => calculate(form), [form])

  // Load calculations from Vercel Serverless API with resilient localStorage cache
  async function loadHistory() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API}/api/calculations`)
      if (!response.ok) {
        throw new Error(`API error (status ${response.status})`)
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setHistory(data)
        try {
          localStorage.setItem('loanwise_history_cache', JSON.stringify(data))
        } catch {}
      }
    } catch (err) {
      // Resilient fallback for local dev or when Supabase is not yet initialized
      const cached = localStorage.getItem('loanwise_history_cache')
      if (cached) {
        try {
          setHistory(JSON.parse(cached))
        } catch {}
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  function update(key, value) {
    setForm(current => ({ ...current, [key]: value }))
  }

  // Save calculation via Vercel Function (Supabase) + Local cache
  async function saveCalculation(event) {
    event.preventDefault()
    if (!result) return

    setSaving(true)
    setError('')

    const payload = {
      loanName: form.loanName.trim() || 'General Loan',
      principal: Number(form.principal),
      annualInterestRate: Number(form.annualInterestRate),
      tenureMonths: Number(form.tenureMonths)
    }

    try {
      const response = await fetch(`${API}/api/calculations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const saved = await response.json()
        setHistory(current => {
          const next = [saved, ...current.filter(item => item.id !== saved.id)]
          try {
            localStorage.setItem('loanwise_history_cache', JSON.stringify(next))
          } catch {}
          return next
        })
        setActiveTab('history')
        return
      }

      const body = await response.json().catch(() => ({}))
      throw new Error(body.error || 'Server error while saving calculation.')
    } catch (err) {
      // If serverless is offline, persist locally so user work is never lost
      const fallbackRecord = {
        id: Date.now(),
        loanName: payload.loanName,
        principal: payload.principal,
        annualInterestRate: payload.annualInterestRate,
        tenureMonths: payload.tenureMonths,
        monthlyEmi: result.monthlyEmi,
        totalInterest: result.totalInterest,
        totalPayment: result.totalPayment,
        createdAt: new Date().toISOString()
      }
      setHistory(current => {
        const next = [fallbackRecord, ...current]
        try {
          localStorage.setItem('loanwise_history_cache', JSON.stringify(next))
        } catch {}
        return next
      })
      setActiveTab('history')
    } finally {
      setSaving(false)
    }
  }

  // Delete individual calculation
  async function deleteCalculation(id) {
    try {
      await fetch(`${API}/api/calculations/${id}`, { method: 'DELETE' })
    } catch (e) {
      console.warn('API delete failed, removing locally:', e)
    }

    setHistory(current => {
      const next = current.filter(item => item.id !== id)
      try {
        localStorage.setItem('loanwise_history_cache', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  // Clear all history
  async function clearAllHistory() {
    if (!window.confirm('Are you sure you want to delete all saved calculations?')) {
      return
    }

    try {
      await fetch(`${API}/api/calculations`, { method: 'DELETE' })
    } catch (e) {
      console.warn('API clear failed, clearing locally:', e)
    }

    setHistory([])
    try {
      localStorage.removeItem('loanwise_history_cache')
    } catch {}
  }

  const years = Math.floor(Number(form.tenureMonths || 0) / 12)
  const months = Number(form.tenureMonths || 0) % 12

  // Validation checks
  const isPrincipalValid = Number(form.principal) > 0
  const isRateValid = !isNaN(Number(form.annualInterestRate)) && Number(form.annualInterestRate) >= 0 && Number(form.annualInterestRate) <= 100
  const isTenureValid = Number(form.tenureMonths) >= 1 && Number(form.tenureMonths) <= 600

  return (
    <div className="app-shell">
      {/* Top Navigation Bar */}
      <header className="topbar">
        <a className="brand" href="#" onClick={() => setActiveTab('calculator')}>
          <span className="brand-mark">
            <Landmark size={20} />
          </span>
          <span>
            Loan<span className="brand-light">Wise</span>
          </span>
        </a>
        <nav className="nav-tabs">
          <button
            className={activeTab === 'calculator' ? 'nav-tab active' : 'nav-tab'}
            onClick={() => setActiveTab('calculator')}
          >
            <Calculator size={16} /> Calculator
          </button>
          <button
            className={activeTab === 'history' ? 'nav-tab active' : 'nav-tab'}
            onClick={() => setActiveTab('history')}
          >
            <Clock3 size={16} /> History <span className="count">{history.length}</span>
          </button>
        </nav>
        <span className="secure-pill">
          <ShieldCheck size={14} className="text-success" />
          <span>Vercel + Supabase Ready</span>
        </span>
      </header>

      <main className="main-content">
        {/* Hero Section */}
        <section className="hero">
          <div className="eyebrow">
            <span /> SMART LOAN PLANNING
          </div>
          <h1>
            Make your next move<br />
            <span>with confidence.</span>
          </h1>
          <p>
            Understand your monthly payments, plan your budget, and keep every calculation in one place.
          </p>
        </section>

        {error && (
          <div className="alert" role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <button onClick={loadHistory} aria-label="Retry">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {activeTab === 'calculator' ? (
          <div className="dashboard-grid">
            {/* Input Form Panel */}
            <section className="panel input-panel">
              <div className="panel-heading">
                <div className="heading-icon">
                  <Calculator size={19} />
                </div>
                <div>
                  <h2>Loan details</h2>
                  <p>Adjust the values to estimate your EMI.</p>
                </div>
              </div>
              <form onSubmit={saveCalculation}>
                <label className="field-label" htmlFor="loanName">
                  Loan name
                </label>
                <input
                  id="loanName"
                  value={form.loanName}
                  maxLength="100"
                  onChange={e => update('loanName', e.target.value)}
                  placeholder="e.g. Home Loan, Car Loan"
                  required
                />

                <div className="field-title-row">
                  <label className="field-label" htmlFor="principal">
                    Loan amount
                  </label>
                  <span className="field-hint">INR (₹)</span>
                </div>
                <div className="input-with-prefix">
                  <span>₹</span>
                  <input
                    id="principal"
                    type="number"
                    min="1"
                    max="100000000"
                    step="0.01"
                    value={form.principal}
                    onChange={e => update('principal', e.target.value)}
                    required
                  />
                </div>
                {!isPrincipalValid && (
                  <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>
                    Please enter a valid loan amount greater than ₹0.
                  </div>
                )}

                {/* Range Slider for Principal */}
                <input
                  aria-label="Loan amount slider"
                  className="range"
                  type="range"
                  min="10000"
                  max="10000000"
                  step="10000"
                  value={Math.min(10000000, Math.max(10000, Number(form.principal) || 10000))}
                  onChange={e => update('principal', e.target.value)}
                />
                <div className="range-labels">
                  <span>₹10K</span>
                  <span>₹25L</span>
                  <span>₹50L</span>
                  <span>₹1 Cr</span>
                </div>

                <div className="two-fields">
                  <div>
                    <label className="field-label" htmlFor="rate">
                      Interest rate
                    </label>
                    <div className="input-with-suffix">
                      <input
                        id="rate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={form.annualInterestRate}
                        onChange={e => update('annualInterestRate', e.target.value)}
                        required
                      />
                      <span>% p.a.</span>
                    </div>
                    {!isRateValid && (
                      <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>
                        Rate must be between 0% and 100%.
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="field-label" htmlFor="tenure">
                      Tenure (months)
                    </label>
                    <input
                      id="tenure"
                      type="number"
                      min="1"
                      max="600"
                      step="1"
                      value={form.tenureMonths}
                      onChange={e => update('tenureMonths', e.target.value)}
                      required
                    />
                    {!isTenureValid && (
                      <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>
                        Tenure must be 1 to 600 months.
                      </div>
                    )}
                  </div>
                </div>

                <div className="tenure-note">
                  {years} {years === 1 ? 'year' : 'years'}
                  {months ? `, ${months} ${months === 1 ? 'month' : 'months'}` : ''} repayment period
                </div>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={!result || !form.loanName.trim() || !isPrincipalValid || !isRateValid || !isTenureValid || saving}
                >
                  {saving ? 'Saving…' : 'Save calculation'}{' '}
                  <ArrowUpRight size={17} />
                </button>
              </form>
              <p className="privacy-note">
                Calculations persist securely via Vercel Functions and Supabase.
              </p>
            </section>

            {/* Results Column */}
            <section className="results-column">
              <div className="result-card main-result">
                <div className="result-top">
                  <span className="result-label">ESTIMATED MONTHLY EMI</span>
                  <span className="result-icon">
                    <Wallet size={19} />
                  </span>
                </div>
                <div className="emi-amount">{money(result?.monthlyEmi)}</div>
                <p className="result-subtitle">Your fixed monthly payment estimate</p>
                <div className="result-divider" />
                <div className="mini-stats">
                  <div>
                    <span>Loan amount</span>
                    <strong>{money(form.principal)}</strong>
                  </div>
                  <div>
                    <span>Interest rate</span>
                    <strong>
                      {Number(form.annualInterestRate || 0)}% <small>p.a.</small>
                    </strong>
                  </div>
                </div>
              </div>

              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-icon interest">
                    <TrendingUp size={17} />
                  </div>
                  <span>Total interest</span>
                  <strong>{money(result?.totalInterest)}</strong>
                  <small>Cost of borrowing</small>
                </div>
                <div className="stat-card">
                  <div className="stat-icon payment">
                    <Landmark size={17} />
                  </div>
                  <span>Total repayment</span>
                  <strong>{money(result?.totalPayment)}</strong>
                  <small>Principal + interest</small>
                </div>
              </div>

              {/* Payment Breakdown Bar */}
              <div className="breakdown-card">
                <div className="breakdown-heading">
                  <div>
                    <h3>Payment breakdown</h3>
                    <p>How your repayment is split</p>
                  </div>
                  <span className="breakdown-icon">
                    <TrendingUp size={18} />
                  </span>
                </div>
                <div className="breakdown-bar">
                  <span
                    style={{
                      width: `${
                        result && result.totalPayment > 0
                          ? (Number(form.principal) / result.totalPayment) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
                <div className="legend">
                  <span>
                    <i className="principal-dot" /> Principal <strong>{money(form.principal)}</strong>
                  </span>
                  <span>
                    <i className="interest-dot" /> Interest <strong>{money(result?.totalInterest)}</strong>
                  </span>
                </div>
              </div>

              {/* Planning Tip */}
              <div className="tip-card">
                <span className="tip-spark">✳</span>
                <p>
                  <strong>Planning tip</strong>
                  <br />
                  A lower interest rate or shorter tenure can significantly reduce the total interest you pay over time.
                </p>
              </div>
            </section>
          </div>
        ) : (
          /* History Panel */
          <section className="panel history-panel">
            <div className="panel-heading history-heading">
              <div className="heading-icon">
                <Clock3 size={19} />
              </div>
              <div>
                <h2>Calculation history</h2>
                <p>Your saved loan estimates, newest first.</p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                {history.length > 0 && (
                  <button
                    className="secondary-button"
                    onClick={clearAllHistory}
                    style={{ color: '#bd4b55', borderColor: '#f1d6d6' }}
                    title="Clear all history"
                  >
                    <Trash2 size={15} /> Clear all
                  </button>
                )}
                <button className="secondary-button" onClick={loadHistory}>
                  <RefreshCw size={15} /> Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="empty-state">Loading saved calculations…</div>
            ) : history.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">
                  <Clock3 size={25} />
                </span>
                <h3>No calculations saved yet</h3>
                <p>Calculate your EMI and save it to see it here.</p>
                <button className="primary-button compact" onClick={() => setActiveTab('calculator')}>
                  Open calculator
                </button>
              </div>
            ) : (
              <div className="history-list">
                {history.map(item => (
                  <article className="history-item" key={item.id}>
                    <div className="history-symbol">
                      <Landmark size={18} />
                    </div>
                    <div className="history-details">
                      <h3>{item.loanName || 'General Loan'}</h3>
                      <p>
                        {money(item.principal)} · {item.annualInterestRate}% p.a. · {item.tenureMonths} months
                      </p>
                      <small>{new Date(item.createdAt).toLocaleString('en-IN')}</small>
                    </div>
                    <div className="history-emi">
                      <span>Monthly EMI</span>
                      <strong>{money(item.monthlyEmi)}</strong>
                      <small>Total interest: {money(item.totalInterest)}</small>
                    </div>
                    <button
                      className="delete-button"
                      title="Delete calculation"
                      onClick={() => deleteCalculation(item.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <footer>
          <span>LoanWise</span> · Estimates are for planning only. Actual lender EMI may vary due to fees, rate changes, and lender-specific rounding.
        </footer>
      </main>
    </div>
  )
}
