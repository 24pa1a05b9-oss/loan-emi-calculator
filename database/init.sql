-- ==========================================================
-- Loan EMI Calculator - PostgreSQL Database Initialization Script
-- ==========================================================

-- 1. Create the database (Run as superuser 'postgres')
-- Note: In psql or pgAdmin query tool, execute this line:
CREATE DATABASE loan_emi_db;

-- 2. Connect to the loan_emi_db database:
\c loan_emi_db;

-- 3. Create the table for Calculation History
-- (Spring Data JPA automatically creates/updates this table if ddl-auto=update)
CREATE TABLE IF NOT EXISTS loan_calculations (
    id BIGSERIAL PRIMARY KEY,
    loan_name VARCHAR(100) NOT NULL DEFAULT 'General Loan',
    loan_amount NUMERIC(15, 2) NOT NULL CHECK (loan_amount > 0),
    annual_interest_rate NUMERIC(7, 4) NOT NULL CHECK (annual_interest_rate >= 0),
    tenure_months INTEGER NOT NULL CHECK (tenure_months > 0),
    monthly_emi NUMERIC(15, 2) NOT NULL CHECK (monthly_emi > 0),
    total_interest NUMERIC(15, 2) NOT NULL CHECK (total_interest >= 0),
    total_payment NUMERIC(15, 2) NOT NULL CHECK (total_payment >= loan_amount),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Index for high-performance sorting by newest first
CREATE INDEX IF NOT EXISTS idx_loan_calculations_created_at_desc
ON loan_calculations (created_at DESC);

-- Sample test record (optional verification):
INSERT INTO loan_calculations 
(loan_name, loan_amount, annual_interest_rate, tenure_months, monthly_emi, total_interest, total_payment, created_at)
VALUES 
('Sample Home Loan', 1000000.00, 8.5000, 120, 12398.57, 487828.40, 1487828.40, CURRENT_TIMESTAMP);
