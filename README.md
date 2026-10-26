# Loan EMI Calculator (Full Stack Web Application)

A modern, responsive, full-stack **Loan EMI Calculator with Persistent History** built using **Java 17**, **Spring Boot 3**, **PostgreSQL**, **Bootstrap 5**, and **Chart.js**.

---

## 🌟 Key Features

1. **Accurate EMI Calculation**:
   - Computes Monthly EMI, Total Interest Payable, and Total Repayment (Principal + Interest).
   - Handles promotional **0% zero-interest loans** seamlessly without division errors.
   - Supports flexible tenure in either **Months** or **Years** with automatic conversion.
   - Formats currency in Indian Rupees (`₹`) with 2 decimal places.

2. **Visual Breakdown Chart**:
   - Interactive doughnut chart powered by **Chart.js** displaying Principal vs. Interest percentage ratios.

3. **Persistent Calculation History**:
   - Stores calculations permanently in **PostgreSQL** (`loan_emi_db`).
   - Sorted with newest calculations first.
   - View complete details in an interactive modal.
   - Search/filter history dynamically by loan amount or date.
   - Delete individual records or clear all history with a confirmation dialog.
   - Saved history persists across browser refreshes and server restarts.

4. **Independent Backend Validation**:
   - Spring Boot REST API validates all inputs independently (`loanAmount > 0`, `annualInterestRate >= 0`, `tenure > 0`, numerical limits) and computes values on the server using `BigDecimal` precision.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3, Bootstrap Icons, Chart.js 4.4 |
| **Backend** | Java 17, Spring Boot 3.2.5, Spring Web REST, Spring Data JPA, Hibernate |
| **Database** | PostgreSQL 18 (default DB: `loan_emi_db`) |
| **Build & Tooling** | Apache Maven 3.9.6, Maven Wrapper (`mvnw.cmd`) |

---

## 📁 Project Structure

```text
FSD PROJECT/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/starlie/loanemi/
│   │   │   │   ├── LoanEmiApiApplication.java       # Spring Boot Application Entrypoint
│   │   │   │   ├── calculation/
│   │   │   │   │   ├── Calculation.java             # JPA Entity for PostgreSQL table
│   │   │   │   │   ├── CalculationRequest.java      # Request DTO with Bean Validation
│   │   │   │   │   ├── CalculationResponse.java     # Response DTO
│   │   │   │   │   ├── CalculationRepository.java   # Spring Data JPA Repository
│   │   │   │   │   ├── CalculationService.java      # Financial EMI calculation & business logic
│   │   │   │   │   ├── CalculationController.java   # REST API Endpoints
│   │   │   │   │   ├── CalculationNotFoundException.java # Custom 404 Exception
│   │   │   │   │   └── ApiExceptionHandler.java     # Global REST Exception Handler (@RestControllerAdvice)
│   │   │   │   └── config/
│   │   │   │       └── CorsConfig.java              # Cross-Origin Resource Sharing (CORS) Configuration
│   │   │   └── resources/
│   │   │       ├── application.properties           # PostgreSQL and server configuration
│   │   │       └── static/                          # Unified Frontend served by Spring Boot
│   │   │           ├── index.html                   # Dashboard UI
│   │   │           ├── css/styles.css               # Financial dashboard styling
│   │   │           └── js/app.js                    # Frontend logic & API client
│   │   └── test/                                    # Automated JUnit 5 & MockMvc Tests (10/10 Passed)
│   │       ├── java/com/starlie/loanemi/calculation/
│   │       │   ├── CalculationServiceTest.java
│   │       │   └── CalculationControllerIntegrationTest.java
│   │       └── resources/
│   │           └── application.properties           # In-memory H2 DB for isolated testing
│   ├── pom.xml                                      # Maven project dependencies & build plugins
│   └── mvnw.cmd                                     # Maven Wrapper for backend
├── frontend/                                        # Standalone frontend copy
│   ├── index.html
│   ├── css/styles.css
│   └── js/app.js
├── database/
│   └── init.sql                                     # PostgreSQL database & table initialization script
├── mvnw.cmd                                         # Project-level Maven Wrapper
├── .gitignore
└── README.md
```

---

## 📐 Mathematical EMI Formula

The Equated Monthly Installment (EMI) is computed using:

$$\text{EMI} = P \times \frac{r \times (1 + r)^n}{(1 + r)^n - 1}$$

Where:
- **$P$** = Principal loan amount
- **$r$** = Monthly interest rate $= \frac{\text{Annual Interest Rate}}{12 \times 100}$
- **$n$** = Total number of monthly installments $(\text{Years} \times 12 \text{ or Months})$

### Special Cases:
- **Zero-Interest ($r = 0$)**: $\text{EMI} = \frac{P}{n}$, $\text{Total Interest} = 0$, $\text{Total Payment} = P$
- **Total Payment**: $\text{EMI} \times n$
- **Total Interest**: $\text{Total Payment} - P$

---

## 🚀 Beginner-Friendly Windows Setup & Run Guide

### Step 1: Install & Verify Java 17
1. Open PowerShell or Command Prompt.
2. Run:
   ```powershell
   java -version
   ```
3. Ensure the output shows version `17` (e.g. `openjdk version "17.0.x"`).

---

### Step 2: Install & Start PostgreSQL
1. If PostgreSQL is not yet running as a Windows Service, open an **Administrator** PowerShell and run:
   ```powershell
   net start postgresql-x64-18
   ```
   *(Replace `18` with your installed PostgreSQL major version if different, e.g., `postgresql-x64-16` or `postgresql-x64-15`).*
2. Alternatively, open Windows Services (`services.msc`), find **postgresql-x64-18**, right-click, and select **Start**.

---

### Step 3: Create the Database (`loan_emi_db`)
1. Open **psql** command line:
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
   ```
   *(Enter your PostgreSQL password when prompted)*.
2. In the `psql` prompt, create the database:
   ```sql
   CREATE DATABASE loan_emi_db;
   \q
   ```
3. Alternatively, you can run the SQL script directly:
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -f "database\init.sql"
   ```

---

### Step 4: Configure Database Credentials
Open `backend\src\main\resources\application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/loan_emi_db
spring.datasource.username=postgres
spring.datasource.password=YOUR_POSTGRES_PASSWORD
```
Replace `YOUR_POSTGRES_PASSWORD` with your actual password (or pass via environment variables `DB_PASSWORD=your_password`).

---

### Step 5: Run the Spring Boot Backend

From the project root (`c:\Users\HP\Downloads\FSD PROJECT`), run:

```powershell
.\mvnw.cmd spring-boot:run -f backend/pom.xml
```

Or run the pre-built standalone executable JAR:

```powershell
java -jar backend/target/loan-emi-api-1.0.0.jar
```

You will see:
```text
Started LoanEmiApiApplication in ... seconds (process running for ...)
Tomcat started on port 8080 (http)
```

---

### Step 6: Open the Frontend
Once Spring Boot is running, open your web browser to:
👉 **[http://localhost:8080](http://localhost:8080)**

The frontend is served directly by Spring Boot!

*(Optional: You can also open `frontend/index.html` directly or via VS Code Live Server; it will automatically connect to `http://localhost:8080/api` with CORS enabled).*

---

### Step 7: Run Automated Tests

To run the complete automated test suite (all 10 test scenarios):

```powershell
.\mvnw.cmd test -f backend/pom.xml
```

Test Results:
```text
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0 -- CalculationControllerIntegrationTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0 -- CalculationServiceTest
[INFO] Results:
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

## 📡 REST API Documentation

### 1. Save a Calculation
- **Method**: `POST`
- **Endpoint**: `/api/calculations`
- **Request Body**:
  ```json
  {
    "loanName": "Home Loan",
    "loanAmount": 1000000.00,
    "annualInterestRate": 8.50,
    "tenure": 10,
    "tenureUnit": "YEARS"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 1,
    "loanName": "Home Loan",
    "loanAmount": 1000000.00,
    "principal": 1000000.00,
    "annualInterestRate": 8.5000,
    "tenureMonths": 120,
    "monthlyEmi": 12398.57,
    "totalInterest": 487828.40,
    "totalPayment": 1487828.40,
    "createdAt": "2026-10-26T15:30:00Z"
  }
  ```

---

### 2. Preview Calculation (Without Saving)
- **Method**: `POST`
- **Endpoint**: `/api/calculations/calculate`
- **Request Body**:
  ```json
  {
    "loanAmount": 500000.00,
    "annualInterestRate": 10.0,
    "tenure": 36,
    "tenureUnit": "MONTHS"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": null,
    "loanName": "Loan Calculation",
    "loanAmount": 500000.00,
    "principal": 500000.00,
    "annualInterestRate": 10.0000,
    "tenureMonths": 36,
    "monthlyEmi": 16133.60,
    "totalInterest": 80809.60,
    "totalPayment": 580809.60,
    "createdAt": "2026-10-26T15:31:00Z"
  }
  ```

---

### 3. Retrieve All Saved Calculations
- **Method**: `GET`
- **Endpoint**: `/api/calculations`
- **Response (200 OK)**: List of calculations sorted newest first (`ORDER BY createdAt DESC`).

---

### 4. Retrieve a Calculation by ID
- **Method**: `GET`
- **Endpoint**: `/api/calculations/{id}`
- **Response (200 OK)**: Calculation object.
- **Response (404 Not Found)** if ID does not exist:
  ```json
  {
    "status": 404,
    "error": "Not Found",
    "message": "Calculation with ID 999 was not found.",
    "timestamp": "2026-10-26T15:32:00Z"
  }
  ```

---

### 5. Delete an Individual Calculation
- **Method**: `DELETE`
- **Endpoint**: `/api/calculations/{id}`
- **Response (204 No Content)**

---

### 6. Delete All Calculations (Clear History)
- **Method**: `DELETE`
- **Endpoint**: `/api/calculations`
- **Response (204 No Content)**

---

## 🛠️ Troubleshooting Guide

### 1. Database Connection Failure (`Connection to localhost:5432 refused`)
- **Cause**: PostgreSQL service is not running or port 5432 is blocked.
- **Solution**:
  - Run `net start postgresql-x64-18` as Administrator or start the PostgreSQL service via `services.msc`.
  - Ensure the database `loan_emi_db` was created (`CREATE DATABASE loan_emi_db;`).
  - Verify credentials in `backend/src/main/resources/application.properties`.

### 2. Port 8080 Conflict (`Port 8080 was already in use`)
- **Cause**: Another service is using port 8080.
- **Solution**:
  - In PowerShell:
    ```powershell
    Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process -Force
    ```
  - Or change the port in `application.properties`:
    ```properties
    server.port=8081
    ```

### 3. Validation Errors (`400 Bad Request`)
- **Cause**: Negative loan amount, interest rate > 100%, or tenure <= 0.
- **Solution**: Check the error message in the JSON response or the frontend input highlighting for field-specific correction.
