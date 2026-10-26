package com.starlie.loanemi.calculation;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class CalculationController {

    private final CalculationService service;

    public CalculationController(CalculationService service) {
        this.service = service;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "UP", "service", "Loan EMI Calculator API");
    }

    /**
     * Preview EMI calculation without persisting to database.
     */
    @PostMapping("/calculations/calculate")
    public ResponseEntity<CalculationResponse> previewCalculation(@Valid @RequestBody CalculationRequest request) {
        return ResponseEntity.ok(service.calculatePreview(request));
    }

    /**
     * Save a new calculation to persistent history.
     */
    @PostMapping("/calculations")
    public ResponseEntity<CalculationResponse> createCalculation(@Valid @RequestBody CalculationRequest request) {
        CalculationResponse saved = service.save(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * Retrieve all calculations, ordered by newest first.
     */
    @GetMapping("/calculations")
    public ResponseEntity<List<CalculationResponse>> getAllCalculations() {
        return ResponseEntity.ok(service.findAll());
    }

    /**
     * Retrieve a single calculation by ID.
     */
    @GetMapping("/calculations/{id}")
    public ResponseEntity<CalculationResponse> getCalculationById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    /**
     * Delete a single calculation by ID.
     */
    @DeleteMapping("/calculations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCalculation(@PathVariable Long id) {
        service.deleteById(id);
    }

    /**
     * Delete all calculations (clear history).
     */
    @DeleteMapping("/calculations")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAllCalculations() {
        service.deleteAll();
    }
}
