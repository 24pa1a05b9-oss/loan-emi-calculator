package com.starlie.loanemi.calculation;

public class CalculationNotFoundException extends RuntimeException {
    public CalculationNotFoundException(Long id) {
        super("Calculation with ID " + id + " was not found.");
    }
}
