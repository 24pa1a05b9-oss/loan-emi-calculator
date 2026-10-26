package com.starlie.loanemi.calculation;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record CalculationRequest(
        @Size(max = 100, message = "Loan name cannot exceed 100 characters")
        String loanName,

        @DecimalMin(value = "0.01", message = "Loan amount must be greater than zero")
        @DecimalMax(value = "100000000000.00", message = "Loan amount is too large")
        BigDecimal loanAmount,

        // Alias for loanAmount to support various client payloads
        @DecimalMin(value = "0.01", message = "Principal must be greater than zero")
        @DecimalMax(value = "100000000000.00", message = "Principal is too large")
        BigDecimal principal,

        @NotNull(message = "Annual interest rate is required")
        @DecimalMin(value = "0.00", message = "Annual interest rate cannot be negative")
        @DecimalMax(value = "100.00", message = "Annual interest rate cannot exceed 100%")
        BigDecimal annualInterestRate,

        @Min(value = 1, message = "Tenure must be greater than zero")
        @Max(value = 600, message = "Tenure cannot exceed 600")
        Integer tenure,

        // Direct months input support
        @Min(value = 1, message = "Tenure months must be greater than zero")
        @Max(value = 600, message = "Tenure months cannot exceed 600")
        Integer tenureMonths,

        String tenureUnit
) {
    public BigDecimal getEffectiveLoanAmount() {
        if (loanAmount != null) {
            return loanAmount;
        }
        return principal;
    }

    public int getEffectiveTenureMonths() {
        if (tenureMonths != null && tenureMonths > 0) {
            return tenureMonths;
        }
        if (tenure != null && tenure > 0) {
            if ("YEARS".equalsIgnoreCase(tenureUnit)) {
                return tenure * 12;
            }
            return tenure;
        }
        return 0;
    }
}
