package com.starlie.loanemi.calculation;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "loan_calculations")
public class Calculation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String loanName = "General Loan";

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal loanAmount;

    @Column(nullable = false, precision = 7, scale = 4)
    private BigDecimal annualInterestRate;

    @Column(nullable = false)
    private Integer tenureMonths;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyEmi;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalInterest;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalPayment;

    @Column(nullable = false)
    private Instant createdAt;

    public Calculation() {
        this.createdAt = Instant.now();
    }

    public Calculation(String loanName, BigDecimal loanAmount, BigDecimal annualInterestRate,
                       Integer tenureMonths, BigDecimal monthlyEmi, BigDecimal totalInterest,
                       BigDecimal totalPayment) {
        this.loanName = (loanName != null && !loanName.trim().isEmpty()) ? loanName.trim() : "General Loan";
        this.loanAmount = loanAmount;
        this.annualInterestRate = annualInterestRate;
        this.tenureMonths = tenureMonths;
        this.monthlyEmi = monthlyEmi;
        this.totalInterest = totalInterest;
        this.totalPayment = totalPayment;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLoanName() {
        return loanName;
    }

    public void setLoanName(String loanName) {
        this.loanName = loanName;
    }

    public BigDecimal getLoanAmount() {
        return loanAmount;
    }

    public void setLoanAmount(BigDecimal loanAmount) {
        this.loanAmount = loanAmount;
    }

    public BigDecimal getPrincipal() {
        return loanAmount;
    }

    public BigDecimal getAnnualInterestRate() {
        return annualInterestRate;
    }

    public void setAnnualInterestRate(BigDecimal annualInterestRate) {
        this.annualInterestRate = annualInterestRate;
    }

    public Integer getTenureMonths() {
        return tenureMonths;
    }

    public void setTenureMonths(Integer tenureMonths) {
        this.tenureMonths = tenureMonths;
    }

    public BigDecimal getMonthlyEmi() {
        return monthlyEmi;
    }

    public void setMonthlyEmi(BigDecimal monthlyEmi) {
        this.monthlyEmi = monthlyEmi;
    }

    public BigDecimal getTotalInterest() {
        return totalInterest;
    }

    public void setTotalInterest(BigDecimal totalInterest) {
        this.totalInterest = totalInterest;
    }

    public BigDecimal getTotalPayment() {
        return totalPayment;
    }

    public void setTotalPayment(BigDecimal totalPayment) {
        this.totalPayment = totalPayment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
