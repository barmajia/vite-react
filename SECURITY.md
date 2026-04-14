# Security Guide for Aurora E-Commerce Frontend

This document outlines the security posture for the frontend (vite-react) and the recommended hardening steps. It is a living document to guide developers and ensure consistent security practices.

Principles
- Minimize trusted surface area: limit exposed globals, minimize inline scripts, and avoid leaking secrets to the frontend.
- Defense in depth: rely on server-side controls (PKCE flow, HttpOnly cookies) and client-side controls (CSP, strict headers).
- Fail secure: avoid leaking detailed error information in production; show generic messages to users while logging details server-side.

Current hardening in place
- PKCE authentication flow and secure session management (via Supabase client with cookie storage).
- Security headers included in production (vercel.json) and dev server in Vite config:
  - X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Strict-Transport-Security, X-XSS-Protection, etc.
- Content Security Policy (CSP) added in production headers (Content-Security-Policy in vercel.json).
- Cookies set with Secure flag in production when not localhost.
- Production logs are silenced for non-critical messages via a production guard (production-guard.ts).
- Environment variable handling avoids committing secrets (VITE_ prefixed env vars, example in .env.example).

Recommended next steps
- Add CSP reporting endpoint and enable Content-Security-Policy-Report-Only to monitor violations without breaking production.
- Add a Content Security Policy for upgrade-insecure-requests if needed (depending on app assets).
- Add rate limiting and monitoring for critical auth endpoints (server-side, not just frontend).
- Integrate dependency security tooling (e.g., Dependabot alerts, Snyk) and automatically fix or pin vulnerable versions.
- Add a formal security testing plan: unit tests for input sanitization, integration tests for login flows, and security-specific end-to-end tests.
- Create a Security Incident Response runbook and a dedicated RESPONSIBILITIES.md to handle breaches or alerts.

Contribution guidance
- Report security concerns via issues with high priority, describe steps to reproduce, and attach any relevant logs.
- When proposing changes, include a security impact assessment.
