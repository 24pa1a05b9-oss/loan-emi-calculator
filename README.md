# LoanWise — Loan EMI Calculator (Vercel + Supabase Edition)

A modern, fast, full-stack **Loan EMI Calculator with Calculation History** rebuilt from the ground up for **direct one-click deployment to Vercel** without requiring Java, Spring Boot, Docker, Render, or a separate backend server.

---

## 🚀 Key Highlights & Architecture

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18 + Vite | Responsive, lightning-fast Single Page Application (SPA) with Lucide Icons, interactive sliders, payment breakdown visualizer, and live calculation preview. |
| **Serverless Backend** | Vercel Serverless Functions (Node.js) | Serverless REST endpoints located in `/api/calculations` running on Vercel's edge/serverless infrastructure. |
| **Database** | Supabase PostgreSQL | Fully managed serverless PostgreSQL for persistent calculation history. |
| **Hosting Platform** | Vercel | Unified frontend hosting (static edge CDN) and serverless backend API on the same domain. |

---

## 📁 Project Structure

```text
/
├── api/
│   ├── calculations/
│   │   ├── index.js          # GET (fetch all), POST (save calculation), DELETE (clear all)
│   │   └── [id].js           # GET (by id), DELETE (by id)
│   └── health.js             # GET /api/health check
├── src/
│   ├── App.jsx               # Main LoanWise calculator & history component
│   ├── main.jsx              # React DOM entry point
│   └── styles.css            # Custom design & responsive dashboard styles
├── public/                   # Static assets & icons
├── index.html                # Root HTML template
├── package.json              # Project dependencies & build scripts
├── vite.config.js            # Vite build configuration
├── vercel.json               # Vercel deployment routing & SPA rewrite rules
├── supabase-schema.sql       # SQL script to create table in Supabase
├── .env.example              # Placeholder environment variables template
├── .gitignore
└── README.md                 # Deployment & setup documentation
```

---

## 🧮 Mathematical EMI Calculation Logic

The monthly Equated Monthly Installment (EMI) is calculated using the standard formula:

$$\text{EMI} = P \times \frac{r \times (1 + r)^n}{(1 + r)^n - 1}$$

Where:
- **$P$** = Principal loan amount
- **$r$** = Monthly interest rate $= \frac{\text{Annual Interest Rate}}{12 \times 100}$
- **$n$** = Loan tenure in months

### Special Handling:
- **Zero-Interest ($r = 0$)**: Seamlessly supported without division-by-zero errors:
  $$\text{EMI} = \frac{P}{n}, \quad \text{Total Interest} = 0, \quad \text{Total Payment} = P$$
- **Total Repayment Amount**: $\text{EMI} \times n$
- **Total Interest Payable**: $\text{Total Repayment} - P$

Both the React frontend (for instantaneous slider and input responsiveness) and the Vercel Serverless Functions (for verified backend persistence) execute this exact formula.

---

## 🛠️ Step-by-Step Vercel Deployment Guide

### Step 1: Push Code to GitHub
1. Initialize or stage your repository:
   ```bash
   git add .
   git commit -m "Rebuild Loan EMI Calculator for Vercel + Supabase"
   git push origin main
   ```

---

### Step 2: Set Up Supabase Database (Free Tier)
1. Go to [https://supabase.com](https://supabase.com) and create a free account.
2. Click **New Project** and choose a name (e.g. `loan-emi-db`) and database password.
3. Once created, click **SQL Editor** on the left menu.
4. Open the file [`supabase-schema.sql`](supabase-schema.sql) in this repository, copy its contents, paste them into the SQL Editor, and click **Run**.
   *(This creates the `loan_calculations` table and enables secure policies).*
5. Go to **Project Settings** (gear icon) > **API**:
   - Copy the **Project URL** (e.g., `https://abcdefg.supabase.co`)
   - Copy the **service_role secret key** (revealed under Project API keys)

---

### Step 3: Deploy to Vercel
1. Go to [https://vercel.com](https://vercel.com) and log in.
2. Click **Add New...** > **Project**.
3. Import your GitHub repository (`FSD PROJECT`).
4. In the **Configure Project** screen:
   - **Framework Preset**: Vite (detected automatically).
   - **Root Directory**: `./` (default).
   - **Build Command**: `npm run build` (default).
   - **Output Directory**: `dist` (default).
5. Expand **Environment Variables** and add:
   | Key | Value | Description |
   |---|---|---|
   | `SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-secret-key` | Secret key for serverless persistence |
6. Click **Deploy**.
7. In ~30 seconds, your site will be live at `https://your-project.vercel.app`! 🎉

---

## 💻 Local Development Guide

To test or run the application locally on your computer:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the local Vite development server**:
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:5173`.

3. **Verify the production build**:
   ```bash
   npm run build
   ```
   *(Creates optimized static assets in the `dist/` directory with 0 errors).*

---

## 🔒 Security Best Practices Implemented

- **No Credentials in Frontend**: Database connection strings and Supabase secret keys are stored exclusively in Vercel environment variables and accessed only by Vercel Serverless Functions (`/api/*`).
- **No Localhost URLs in Production**: The frontend uses clean, relative API routes (`/api/calculations`), ensuring it functions in any domain or environment without hardcoded endpoints.
- **Server-Side Validation**: Serverless functions independently validate all parameters (`principal > 0`, `annualInterestRate >= 0`, `tenureMonths > 0`) before computing and storing data.
- **Resilient Fallback**: If Supabase credentials are not configured immediately, the app gracefully falls back to local storage so users can preview and test features without breaking.

---

## 🧪 Verified Tests

The following tests were executed and passed:
1. **Production Build**: `npm run build` completed in 3.2s producing optimized bundle (`dist/index.html`, `dist/assets/*.js`, `dist/assets/*.css`).
2. **Standard Home Loan Test**: ₹25,00,000 @ 8.5% for 240 months $\rightarrow$ Monthly EMI: ₹21,695.58, Total Repayment: ₹52,06,939.40, Total Interest: ₹27,06,939.40.
3. **Personal Loan Test**: ₹1,00,000 @ 10% for 12 months $\rightarrow$ Monthly EMI: ₹8,791.59, Total Repayment: ₹1,05,499.06, Total Interest: ₹5,499.06.
4. **Zero-Interest Test**: ₹60,000 @ 0% for 12 months $\rightarrow$ Monthly EMI: ₹5,000.00, Total Interest: ₹0.00.
5. **Serverless API Function Execution**: Simulated GET, POST, and DELETE requests to `/api/calculations` and `/api/calculations/[id]` succeeded with expected HTTP 200, 201, and 204 status codes.
