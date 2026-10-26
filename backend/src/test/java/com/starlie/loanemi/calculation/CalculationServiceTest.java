package com.starlie.loanemi.calculation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.math.RoundingMode;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CalculationServiceTest {

    @Mock
    private CalculationRepository repository;

    private CalculationService service;

    @BeforeEach
    void setUp() {
        service = new CalculationService(repository);
    }

    @Test
    @DisplayName("Scenario 1: Standard loan calculation with interest")
    void testStandardLoanCalculation() {
        // Loan: ₹100,000 at 10% annual interest for 12 months
        CalculationRequest request = new CalculationRequest(
                "Personal Loan",
                BigDecimal.valueOf(100000),
                null,
                BigDecimal.valueOf(10.0),
                12,
                null,
                "MONTHS"
        );

        CalculationService.CalculationResult result = service.compute(request);

        assertNotNull(result);
        assertEquals(new BigDecimal("100000.00"), result.loanAmount());
        assertEquals(new BigDecimal("10.0"), result.annualInterestRate());
        assertEquals(12, result.tenureMonths());

        // Expected EMI for 100000 at 10% for 12 months: ₹8791.59
        assertEquals(new BigDecimal("8791.59"), result.monthlyEmi());
        // Total Payment = 8791.59 * 12 = 105499.08
        assertEquals(new BigDecimal("105499.08"), result.totalPayment());
        // Total Interest = 105499.08 - 100000 = 5499.08
        assertEquals(new BigDecimal("5499.08"), result.totalInterest());
    }

    @Test
    @DisplayName("Scenario 2: Zero-interest loan calculation")
    void testZeroInterestLoanCalculation() {
        // Loan: ₹60,000 at 0% annual interest for 12 months
        CalculationRequest request = new CalculationRequest(
                "Zero Interest Scheme",
                BigDecimal.valueOf(60000),
                null,
                BigDecimal.ZERO,
                12,
                null,
                "MONTHS"
        );

        CalculationService.CalculationResult result = service.compute(request);

        assertNotNull(result);
        assertEquals(new BigDecimal("60000.00"), result.loanAmount());
        assertEquals(BigDecimal.ZERO, result.annualInterestRate());
        assertEquals(12, result.tenureMonths());

        // Expected EMI: 60000 / 12 = 5000.00
        assertEquals(new BigDecimal("5000.00"), result.monthlyEmi());
        assertEquals(new BigDecimal("60000.00"), result.totalPayment());
        assertEquals(new BigDecimal("0.00"), result.totalInterest());
    }

    @Test
    @DisplayName("Scenario 3: Loan tenure entered in years converted to months")
    void testTenureInYearsCalculation() {
        // Loan: ₹500,000 at 8.5% annual interest for 5 years = 60 months
        CalculationRequest request = new CalculationRequest(
                "Car Loan",
                BigDecimal.valueOf(500000),
                null,
                BigDecimal.valueOf(8.5),
                5,
                null,
                "YEARS"
        );

        CalculationService.CalculationResult result = service.compute(request);

        assertNotNull(result);
        assertEquals(60, result.tenureMonths());
        // Verify EMI calculation for 60 months
        assertTrue(result.monthlyEmi().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(result.totalInterest().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(result.totalPayment().compareTo(result.loanAmount()) > 0);
    }

    @Test
    @DisplayName("Scenario 4: Invalid and negative inputs throw IllegalArgumentException")
    void testInvalidInputs() {
        // Negative loan amount
        assertThrows(IllegalArgumentException.class, () -> {
            service.compute(new CalculationRequest("Invalid", BigDecimal.valueOf(-1000), null, BigDecimal.valueOf(10), 12, null, "MONTHS"));
        });

        // Zero loan amount
        assertThrows(IllegalArgumentException.class, () -> {
            service.compute(new CalculationRequest("Invalid", BigDecimal.ZERO, null, BigDecimal.valueOf(10), 12, null, "MONTHS"));
        });

        // Negative interest rate
        assertThrows(IllegalArgumentException.class, () -> {
            service.compute(new CalculationRequest("Invalid", BigDecimal.valueOf(10000), null, BigDecimal.valueOf(-5), 12, null, "MONTHS"));
        });

        // Zero tenure
        assertThrows(IllegalArgumentException.class, () -> {
            service.compute(new CalculationRequest("Invalid", BigDecimal.valueOf(10000), null, BigDecimal.valueOf(5), 0, null, "MONTHS"));
        });

        // Excessive tenure (>600 months)
        assertThrows(IllegalArgumentException.class, () -> {
            service.compute(new CalculationRequest("Invalid", BigDecimal.valueOf(10000), null, BigDecimal.valueOf(5), 601, null, "MONTHS"));
        });
    }

    @Test
    @DisplayName("Scenario 5: Save calculation persists through repository")
    void testSaveCalculation() {
        CalculationRequest request = new CalculationRequest(
                "Home Loan",
                BigDecimal.valueOf(2500000),
                null,
                BigDecimal.valueOf(7.5),
                20,
                null,
                "YEARS"
        );

        Calculation mockEntity = new Calculation(
                "Home Loan",
                BigDecimal.valueOf(2500000).setScale(2, RoundingMode.HALF_UP),
                BigDecimal.valueOf(7.5),
                240,
                new BigDecimal("20140.09"),
                new BigDecimal("2333621.60"),
                new BigDecimal("4833621.60")
        );
        mockEntity.setId(1L);

        when(repository.save(any(Calculation.class))).thenReturn(mockEntity);

        CalculationResponse response = service.save(request);

        assertNotNull(response);
        assertEquals(1L, response.id());
        assertEquals("Home Loan", response.loanName());
        assertEquals(240, response.tenureMonths());
        verify(repository, times(1)).save(any(Calculation.class));
    }
}
