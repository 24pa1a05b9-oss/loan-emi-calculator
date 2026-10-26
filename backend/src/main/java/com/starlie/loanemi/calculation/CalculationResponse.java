package com.starlie.loanemi.calculation;

import java.math.BigDecimal;
import java.time.Instant;

public record CalculationResponse(
        Long id,
        String loanName,
        BigDecimal loanAmount,
        BigDecimal principal,
        BigDecimal annualInterestRate,
        Integer tenureMonths,
        BigDecimal monthlyEmi,
        BigDecimal totalInterest,
        BigDecimal totalPayment,
        Instant createdAt
) {
    public static CalculationResponse from(Calculation c) {
        return new CalculationResponse(
                c.getId(),
                c.getLoanName(),
                c.getLoanAmount(),
                c.getLoanAmount(),
                c.getAnnualInterestRate(),
                c.getTenureMonths(),
                c.getMonthlyEmi(),
                c.getTotalInterest(),
                c.getTotalPayment(),
                c.getCreatedAt()
        );
    }
}
