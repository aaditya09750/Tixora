<!-- markdownlint-disable MD013 -->

# Security Policy

This document outlines the security policies, disclosure procedures, scope definitions, and known security trade-offs for the Tixora support CRM system.

---

## 1. Supported Release Versions

Tixora is in pre-1.0 development status. Only the active `main` branch is monitored and patched for security vulnerabilities.

| Version                            | Security Updates Support Status |
| ---------------------------------- | ------------------------------- |
| **`main`** (Development)           | :white_check_mark: Supported    |
| **`< main`** (Historical branches) | :x: Not Supported               |

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability, **do not open a public GitHub issue**. Instead, report it privately to the maintainers:

- Send a detailed email report to: **aadigunjal0975@gmail.com**
- Include the following details in your report:
  1. A description of the vulnerability and its potential impact.
  2. Step-by-step instructions to reproduce the issue (including proof-of-concept scripts or API payloads).
  3. Details about the affected environment (OS, Node version, or build).

### Response Timeline:

- **Acknowledgement**: You will receive an initial email acknowledgement within **3 business days**.
- **Remediation**: Once the vulnerability is confirmed, a patch will be developed on a private branch.
- **Credits**: You will be credited in the release notes and repository changes log, unless you prefer anonymity.

---

## 3. Scope of Security Audits

### In Scope

- **Access Boundaries**: Role-Based Access Controls (RBAC) separating admins from sales agents.
- **Authentication Integrity**: JWT generation, decoding, verification, and timing attacks on password validation.
- **Input Validation**: Request payload sanitization at HTTP entry boundaries (Zod validation, DTO checks).
- **Secrets Management**: Handling of signing secrets, database credentials, and env variables.
- **Dependency Vulnerabilities**: Security audits of third-party libraries (e.g. evaluating packages for known CVEs).

### Out of Scope

- **Local Development Environments**: Security vulnerabilities that require physical or console access to a developer's local machine.
- **Third-Party Infrastructure Services**: Vulnerabilities on platforms hosting the application (like Neon DB, Render, or Vercel). Please report those issues directly to the respective providers.
- **Social Engineering**: Phishing, credential stuffing, or other client-side social attacks.

---

## 4. Known Security Trade-offs & Architecture Decisions

Tixora accepts the following security trade-offs in its current development state:

### 4.1. Client-Side JWT Storage

- **Decision**: Bearer JWT tokens are stored in `localStorage` on the client (documented in [ADR 0005](docs/ADRs/0005-token-in-localstorage.md)).
- **Risk**: Makes the application susceptible to token theft via Cross-Site Scripting (XSS) attacks.
- **Mitigation Plan**: We plan to transition authentication to HTTP-only secure cookies. We recommend configuring strict Content Security Policies (CSP) on deployment targets.

### 4.2. Database Access Rules

- **Decision**: Neon DB access policies permit connections from any IP (`0.0.0.0/0`) during development.
- **Risk**: Increased database network exposure.
- **Mitigation Plan**: In production environments, restrict Neon DB allowlists to the IP ranges of your hosting environment (e.g. Render server IPs).
