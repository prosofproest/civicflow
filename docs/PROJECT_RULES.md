# CivicFlow — Project Rules & Engineering Guidelines

## Hackathon Context & Authority
- **Source of Truth**: The official hackathon PDF is the primary source of truth for all requirements, workflows, and specifications.
- **Four Mandatory Lifecycle Stages**: The architecture and user journey must strictly preserve and center around the four mandatory stages:
  1. **Capture**: Citizen report intake with multimodal context (text, image, precise geolocation, category).
  2. **Understand**: AI processing pipeline (structured extraction, duplicate detection, automated clustering, severity and priority scoring).
  3. **Reveal**: Administrative and public transparency (priority dashboards, spatial maps, verifiable cluster views, audit logs).
  4. **Act**: Departmental assignment, transparent status progression, SLA tracking, and citizen notification.

## Engineering Standards & Architecture
- **No Unnecessary Features**: Build strictly to specification. Avoid feature creep or speculative functionality.
- **Clean Architecture & Separation of Concerns**: Maintain modular boundaries across presentation (UI components), domain logic (services/lib), and data contracts (types).
- **Reusable UI Components**: UI elements must be implemented as centralized, typed, reusable components in `src/components/ui/` with consistent styling, accessibility, and keyboard focus states.
- **TypeScript Strict Mode**: Strict mode is enabled and mandatory across the entire codebase. No untyped code (`any`) allowed without strict explicit justification.
- **Input Validation**: All external inputs (forms, API request payloads, query parameters, webhook payloads) must be strictly validated before processing.

## Security & Secrets Management
- **Never Expose API Keys**: Client bundles must never contain private keys, secret tokens, or admin credentials.
- **Server-Side Execution**: All sensitive operations (AI model calls, database mutations, admin verifications, image signatures) must execute server-side.
- **No Secrets in Logs**: Sensitive parameters, tokens, and personally identifiable information (PII) must never be written to stdout, console logs, or monitoring traces.
- **Git Credential Safeguards**: Never commit `.env.local`, `.env`, private keys (`.pem`), or local credential files. Verify `.gitignore` rules continuously.

## AI Transparency & Data Honesty
- **Explainable AI Decisions**: Every AI categorization, severity score, priority calculation, and cluster assignment must provide explainable factor breakdowns and human-auditable rationales.
- **Honesty in Presentation**: Any mocked, synthetic, or sample dataset in the user interface or documentation must be clearly and visibly labeled as "Sample data".
- **No False Claims**: Never claim integrations, backend connections, or AI capabilities that are not genuinely implemented and operational in the codebase.

## Design & UI Constraints
- **Zero Emojis**: Emojis are strictly prohibited throughout the application interface and typography. Use Lucide icons exclusively for visual iconography.
- **Light Theme Only**: The application strictly supports a light theme (`color-scheme: light`). Dark theme and `dark:` utility classes are disallowed.

## Workflow & Repository Discipline
- **Dependency Control**: Do not install additional npm dependencies or libraries without explicit authorization.
- **Single Branch Policy**: Work strictly on the `main` branch. Never create additional Git branches or worktrees.
- **Push Authority**: The AI assistant prepares, validates, and commits locally. The repository owner pushes to GitHub.
