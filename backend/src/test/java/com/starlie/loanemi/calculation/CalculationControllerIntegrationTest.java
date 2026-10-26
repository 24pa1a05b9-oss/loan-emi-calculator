package com.starlie.loanemi.calculation;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CalculationControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CalculationRepository repository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void cleanUp() {
        repository.deleteAll();
    }

    @Test
    @DisplayName("Scenario 6: Save and retrieve calculation history sorted newest first")
    void testSaveAndRetrieveCalculations() throws Exception {
        CalculationRequest req1 = new CalculationRequest("Loan 1", BigDecimal.valueOf(100000), null, BigDecimal.valueOf(10), 12, null, "MONTHS");
        CalculationRequest req2 = new CalculationRequest("Loan 2", BigDecimal.valueOf(200000), null, BigDecimal.valueOf(12), 24, null, "MONTHS");

        mockMvc.perform(post("/api/calculations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.monthlyEmi").value(8791.59));

        mockMvc.perform(post("/api/calculations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.loanName").value("Loan 2"));

        // Retrieve all calculations
        mockMvc.perform(get("/api/calculations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].loanName").value("Loan 2"))
                .andExpect(jsonPath("$[1].loanName").value("Loan 1"));
    }

    @Test
    @DisplayName("Scenario 7: Retrieve calculation by ID and handle 404 for missing ID")
    void testRetrieveCalculationById() throws Exception {
        CalculationRequest req = new CalculationRequest("Personal Loan", BigDecimal.valueOf(50000), null, BigDecimal.valueOf(8), 6, null, "MONTHS");

        String responseBody = mockMvc.perform(post("/api/calculations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        CalculationResponse saved = objectMapper.readValue(responseBody, CalculationResponse.class);

        // Fetch existing by ID
        mockMvc.perform(get("/api/calculations/" + saved.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.id()))
                .andExpect(jsonPath("$.loanName").value("Personal Loan"));

        // Fetch non-existent ID -> 404
        mockMvc.perform(get("/api/calculations/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    @DisplayName("Scenario 8: Delete an individual history entry")
    void testDeleteIndividualCalculation() throws Exception {
        CalculationRequest req = new CalculationRequest("Bike Loan", BigDecimal.valueOf(80000), null, BigDecimal.valueOf(9), 12, null, "MONTHS");

        String responseBody = mockMvc.perform(post("/api/calculations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        CalculationResponse saved = objectMapper.readValue(responseBody, CalculationResponse.class);

        // Delete calculation
        mockMvc.perform(delete("/api/calculations/" + saved.id()))
                .andExpect(status().isNoContent());

        // Verify it was removed
        mockMvc.perform(get("/api/calculations/" + saved.id()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Scenario 9: Clear all calculation history")
    void testClearAllHistory() throws Exception {
        CalculationRequest req1 = new CalculationRequest("Loan A", BigDecimal.valueOf(50000), null, BigDecimal.valueOf(8), 6, null, "MONTHS");
        CalculationRequest req2 = new CalculationRequest("Loan B", BigDecimal.valueOf(75000), null, BigDecimal.valueOf(9), 12, null, "MONTHS");

        mockMvc.perform(post("/api/calculations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/calculations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isCreated());

        // Clear all
        mockMvc.perform(delete("/api/calculations"))
                .andExpect(status().isNoContent());

        // Verify list is empty
        mockMvc.perform(get("/api/calculations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("Test Preview calculation without saving")
    void testPreviewCalculation() throws Exception {
        CalculationRequest req = new CalculationRequest("Preview Loan", BigDecimal.valueOf(100000), null, BigDecimal.valueOf(10), 12, null, "MONTHS");

        mockMvc.perform(post("/api/calculations/calculate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").doesNotExist())
                .andExpect(jsonPath("$.monthlyEmi").value(8791.59));

        // Ensure not saved in database
        mockMvc.perform(get("/api/calculations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
