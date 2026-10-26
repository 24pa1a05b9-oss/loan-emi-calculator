import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing calculation ID.' });
  }

  const supabase = getSupabase();

  // GET /api/calculations/:id
  if (req.method === 'GET') {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('loan_calculations')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          return res.status(404).json({ error: `Calculation #${id} not found.` });
        }

        return res.status(200).json({
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

      return res.status(200).json({ id, message: 'Supabase not configured' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve calculation: ' + err.message });
    }
  }

  // DELETE /api/calculations/:id
  if (req.method === 'DELETE') {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('loan_calculations')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Supabase delete item error:', error);
          throw new Error(error.message);
        }
      }

      return res.status(204).end();
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete calculation: ' + err.message });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
