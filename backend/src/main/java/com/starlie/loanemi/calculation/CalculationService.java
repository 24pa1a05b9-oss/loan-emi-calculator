package com.starlie.loanemi.calculation;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
public class CalculationService {

    private final CalculationRepository repository;

    public CalculationService(CalculationRepository repository) {
        this.repository = repository;
    }

    /**
     * Independently computes EMI, Total Interest, and Total Payment.
     */
    public CalculationResult compute(CalculationRequest request) {
        BigDecimal loanAmount = request.getEffectiveLoanAmount();
        if (loanAmount == null || loanAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Loan amount must be greater than zero.");
        }

        BigDecimal annualInterestRate = request.annualInterestRate();
        if (annualInterestRate == null || annualInterestRate.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Annual interest rate cannot be negative.");
        }

        int tenureMonths = request.getEffectiveTenureMonths();
        if (tenureMonths <= 0) {
            throw new IllegalArgumentException("Loan tenure must be greater than zero.");
        }
        if (tenureMonths > 600) {
            throw new IllegalArgumentException("Loan tenure cannot exceed 600 months (50 years).");
        }

        BigDecimal p = loanAmount.setScale(2, RoundingMode.HALF_UP);
        BigDecimal emi;
        BigDecimal totalPayment;
        BigDecimal totalInterest;

        // Zero-interest-rate special handling
        if (annualInterestRate.compareTo(BigDecimal.ZERO) == 0) {
            emi = p.divide(BigDecimal.valueOf(tenureMonths), 2, RoundingMode.HALF_UP);
            totalPayment = emi.multiply(BigDecimal.valueOf(tenureMonths)).setScale(2, RoundingMode.HALF_UP);
            totalInterest = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        } else {
            // r = annualInterestRate / 12 / 100
            BigDecimal monthlyRate = annualInterestRate.divide(BigDecimal.valueOf(1200), 12, RoundingMode.HALF_UP);
            double r = monthlyRate.doubleValue();
            double factor = Math.pow(1.0 + r, tenureMonths);

            if (Double.isInfinite(factor) || Double.isNaN(factor) || factor <= 1.0) {
                throw new IllegalArgumentException("Calculation resulted in numerical overflow. Please check the inputs.");
            }

            double emiVal = (p.doubleValue() * r * factor) / (factor - 1.0);
            emi = BigDecimal.valueOf(emiVal).setScale(2, RoundingMode.HALF_UP);

            totalPayment = emi.multiply(BigDecimal.valueOf(tenureMonths)).setScale(2, RoundingMode.HALF_UP);
            totalInterest = totalPayment.subtract(p).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        }

        String loanName = request.loanName();
        if (loanName == null || loanName.trim().isEmpty()) {
            loanName = "Loan Calculation";
        } else {
            loanName = loanName.trim();
        }

        return new CalculationResult(loanName, p, annualInterestRate, tenureMonths, emi, totalInterest, totalPayment);
    }

    /**
     * Calculates and saves the calculation record to PostgreSQL.
     */
    @Transactional
    public CalculationResponse save(CalculationRequest request) {
        CalculationResult result = compute(request);
        Calculation calculation = new Calculation(
                result.loanName(),
                result.loanAmount(),
                result.annualInterestRate(),
                result.tenureMonths(),
                result.monthlyEmi(),
                result.totalInterest(),
                result.totalPayment()
        );
        Calculation saved = repository.save(calculation);
        return CalculationResponse.from(saved);
    }

    /**
     * Computes the calculation result preview without persisting to the database.
     */
    public CalculationResponse calculatePreview(CalculationRequest request) {
        CalculationResult result = compute(request);
        return new CalculationResponse(
                null,
                result.loanName(),
                result.loanAmount(),
                result.loanAmount(),
                result.annualInterestRate(),
                result.tenureMonths(),
                result.monthlyEmi(),
                result.totalInterest(),
                result.totalPayment(),
                Instant.now()
        );
    }

    /**
     * Retrieves all saved calculations, sorted newest first.
     */
    @Transactional(readOnly = true)
    public List<CalculationResponse> findAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(CalculationResponse::from)
                .toList();
    }

    /**
     * Retrieves a single calculation by its unique ID.
     */
    @Transactional(readOnly = true)
    public CalculationResponse findById(Long id) {
        return repository.findById(id)
                .map(CalculationResponse::from)
                .orElseThrow(() -> new CalculationNotFoundException(id));
    }

    /**
     * Deletes a single calculation by ID.
     */
    @Transactional
    public void deleteById(Long id) {
        if (!repository.existsById(id)) {
            throw new CalculationNotFoundException(id);
        }
        repository.deleteById(id);
    }

    /**
     * Clears all calculation history.
     */
    @Transactional
    public void deleteAll() {
        repository.deleteAll();
    }

    public record CalculationResult(
            String loanName,
            BigDecimal loanAmount,
            BigDecimal annualInterestRate,
            Integer tenureMonths,
            BigDecimal monthlyEmi,
            BigDecimal totalInterest,
            BigDecimal totalPayment
    ) {}
}
