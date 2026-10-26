package com.starlie.loanemi.calculation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CalculationRepository extends JpaRepository<Calculation, Long> {
    List<Calculation> findAllByOrderByCreatedAtDesc();
}
