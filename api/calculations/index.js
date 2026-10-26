import { createClient } from '@supabase/supabase-js';

// Safe Supabase client initializer
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

// In-memory fallback cache for development/preview when Supabase env vars are not yet configured
let inMemoryFallbackHistory = [];

// Independent server-side EMI calculation
function calculateEMI({ principal, annualInterestRate, tenureMonths }) {
  const p = Number(principal);
  const annual = Number(annualInterestRate);
  const n = Number(tenureMonths);

  if (!(p > 0) || annual < 0 || !(n > 0)) {
    return null;
  }

  const r = annual / 1200;
  const emi = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = emi * n;
  const totalInterest = Math.max(0, totalPayment - p);

  return {
    monthlyEmi: Math.round(emi * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100
  };
}

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getSupabase();

  // 1. GET /api/calculations - Retrieve all calculations (newest first)
  if (req.method === 'GET') {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('loan_calculations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase query error:', error);
          throw new Error(error.message);
        }

        // Map database column names if necessary
        const formatted = (data || []).map(row => ({
          id: row.id,
          loanName: row.loan_name,
          principal: Number(row.principal),
          annualInterestRate: Number(row.annual_interest_rate),
          tenureMonths: Number(row.tenure_months),
          monthlyEmi: Number(row.monthly_emi),
          totalInterest: Number(row.total_interest),
          totalPayment: Number(row.total_payment),
          createdAt: row.created_at
        }));

        return res.status(200).json(formatted);
      }

      // If Supabase is not configured yet, return in-memory history with warning header
      res.setHeader('X-Storage-Mode', 'in-memory-fallback');
      return res.status(200).json(inMemoryFallbackHistory);
    } catch (err) {
      console.error('GET error:', err);
      return res.status(500).json({ error: 'Failed to retrieve calculations: ' + err.message });
    }
  }

  // 2. POST /api/calculations - Validate, calculate, and save calculation
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const loanName = (body.loanName || 'General Loan').trim();
      const principal = Number(body.principal || body.loanAmount);
      const annualInterestRate = Number(body.annualInterestRate);
      const tenureMonths = Number(body.tenureMonths || (body.tenureUnit === 'YEARS' ? body.tenure * 12 : body.tenure));

      // Server-side validation
      if (!principal || isNaN(principal) || principal <= 0) {
        return res.status(400).json({ error: 'Loan amount (principal) must be greater than zero.' });
      }
      if (isNaN(annualInterestRate) || annualInterestRate < 0 || annualInterestRate > 100) {
        return res.status(400).json({ error: 'Annual interest rate must be between 0% and 100%.' });
      }
      if (!tenureMonths || isNaN(tenureMonths) || tenureMonths <= 0 || tenureMonths > 600) {
        return res.status(400).json({ error: 'Tenure must be between 1 and 600 months (up to 50 years).' });
      }

      // Compute EMI independently
      const computed = calculateEMI({ principal, annualInterestRate, tenureMonths });
      if (!computed) {
        return res.status(400).json({ error: 'Calculation failed with given inputs.' });
      }

      const newRecord = {
        loan_name: loanName,
        principal,
        annual_interest_rate: annualInterestRate,
        tenure_months: tenureMonths,
        monthly_emi: computed.monthlyEmi,
        total_interest: computed.totalInterest,
        total_payment: computed.totalPayment,
        created_at: new Date().toISOString()
      };

      if (supabase) {
        const { data, error } = await supabase
          .from('loan_calculations')
          .insert([newRecord])
          .select()
          .single();

        if (error) {
          console.error('Supabase insert error:', error);
          throw new Error(error.message);
        }

        return res.status(201).json({
          id: data.id,
          loanName: data.loan_name,
          principal: Number(data.principal),
          annualInterestRate: Number(data.annual_interest_rate),
          tenureMonths: Number(data.tenure_months),
          monthlyEmi: Number(data.monthly_emi),
          totalInterest: Number(data.total_interest),
          totalPayment: Number(data.total_payment),
          createdAt: data.created_at
        });
      }

      // In-memory fallback
      const fallbackRecord = {
        id: Date.now(),
        loanName: newRecord.loan_name,
        principal: newRecord.principal,
        annualInterestRate: newRecord.annual_interest_rate,
        tenureMonths: newRecord.tenure_months,
        monthlyEmi: newRecord.monthly_emi,
        totalInterest: newRecord.total_interest,
        totalPayment: newRecord.total_payment,
        createdAt: newRecord.created_at
      };
      inMemoryFallbackHistory.unshift(fallbackRecord);
      res.setHeader('X-Storage-Mode', 'in-memory-fallback');
      return res.status(201).json(fallbackRecord);
    } catch (err) {
      console.error('POST error:', err);
      return res.status(500).json({ error: 'Failed to save calculation: ' + err.message });
    }
  }

  // 3. DELETE /api/calculations - Clear all history
  if (req.method === 'DELETE') {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('loan_calculations')
          .delete()
          .gte('id', 0); // Delete all rows

        if (error) {
          console.error('Supabase delete all error:', error);
          throw new Error(error.message);
        }
      }

      inMemoryFallbackHistory = [];
      return res.status(204).end();
    } catch (err) {
      console.error('DELETE error:', err);
      return res.status(500).json({ error: 'Failed to clear history: ' + err.message });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
