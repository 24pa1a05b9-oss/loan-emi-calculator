export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    platform: 'Vercel Serverless',
    service: 'Loan EMI Calculator API',
    timestamp: new Date().toISOString()
  });
}
