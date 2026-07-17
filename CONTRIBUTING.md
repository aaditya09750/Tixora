<!-- markdownlint-disable MD013 MD033 -->

# Contributing to Tixora

Thank you for contributing to Tixora. This document outlines onboarding procedures, coding standards, branch conventions, and quality gates to maintain a clean, stable codebase.

---

## 1. Local Workspace Development

### System Requirements

- **Node.js**: Version `22.x` (enforced by [`.nvmrc`](file:///c:/SharedData/Downloads/Tixora/.nvmrc))
- **pnpm**: Version `10.30.0` or higher (workspace packages manager)
- **PostgreSQL / Neon DB**: Accessible relational database instance

### Onboarding Steps

1. Install workspace dependencies at the root:
   ```bash
   pnpm install
   ```
2. Configure environments for the Backend and Frontend modules by following the instructions in the [Setup Guide](docs/SETUP.md).
3. Validate backend type-safety and generate database schema files:
   ```bash
   pnpm --filter ./Backend prisma:generate
   ```

---

## 2. Git Workflow & Conventions

### Branch Naming Patterns

All feature branches should be created off `main` and named using the following prefixes:

- `feat/` for new features (e.g. `feat/ticket-assignee`)
- `fix/` for bug fixes (e.g. `fix/cors-origin-allowlist`)
- `chore/` for tooling, configuration, and dependencies updates (e.g. `chore/eslint-v9`)
- `docs/` for documentation edits (e.g. `docs/api-examples`)
- `perf/` for performance tuning (e.g. `perf/db-indexing`)

---

### Commit Message Standards

Tixora enforces **Conventional Commits**. Commit messages are checked by `commitlint` on the `commit-msg` hook (limited to a maximum header length of 100 characters).

#### Message Format:

```text
type(scope): concise imperative description

Optional multi-line commit explanation body detailing why this change was implemented.
```

#### Allowed Types:

- `feat`: A new user-facing feature.
- `fix`: A bug fix.
- `chore`: Maintenance modifications (dependencies, config changes).
- `docs`: Documentation-only updates.
- `refactor`: Code restructuring without changing runtime behaviors.
- `perf`: Performance optimizations.
- `test`: Adding or correcting tests.
- `build`/`ci`: Build scripts or pipeline updates.

#### Examples:

```text
feat(tickets): add assignee dropdown filter for admins
fix(auth): prevent timing attacks on password verification checks
docs: update troubleshooting sections in setup guide
```

---

## 3. Code Style & Quality Guidelines

### Formatting and Linting

- **Formatting**: Formats are validated using Prettier. The `pre-commit` hook automatically formats modified files.
- **Linting Rules**: ESLint rules are active in both workspace directories.
- Run format checks locally:
  ```bash
  pnpm format:check # Run check across MD, JSON, YAML files
  ```

### Code Style Design Guidelines

1. **TypeScript Strictness**: Always write strict TypeScript. Avoid using type assertions (`as AnyType`) or `any` declarations.
2. **File Size Boundaries**: Keep modules small. If a source file grows beyond **~300 lines**, split it into separate modules.
3. **Comment Rationale**: Write comments detailing _why_ code was written in a specific way, rather than explaining _what_ a line of code does.
4. **Clean Imports**: Use relative import paths. Avoid long, nested relative paths (`../../../../`); split modules if path trees grow too deep.

---

## 4. Pull Request Requirements

Before submitting your Pull Request, ensure the following checklist is completed:

- [ ] **Clean Lint Checks**: Both packages pass `pnpm lint` checks with zero warnings.
- [ ] **TypeScript Type Safety**: All TypeScript builds pass (`pnpm typecheck`) without exceptions.
- [ ] **Local Build Verification**: The application builds locally (`pnpm build` completes successfully).
- [ ] **No Secrets in Source**: No hardcoded passwords, tokens, or credentials exist in the source files.
- [ ] **Environment Variable Alignment**: Any newly added variable is documented in the matching `.env.example` files.
- [ ] **Documentation Updates**: Associated documentation files (`README.md`, `ARCHITECTURE.md`, `docs/API.md`) are updated to reflect the new code changes.
- [ ] **Conventional Commit Formats**: All commits follow the specified Conventional Commit rules.

---

## 5. Security Reports

Do not open public GitHub issues for security vulnerabilities. Review [`SECURITY.md`](SECURITY.md) for steps on disclosing security risks privately.
