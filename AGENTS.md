## Project Overview

This project lets users upload, validate and order photographs which comply with ICAO standards for the use of international passports.

## Development Workflow

1. Make changes
2. Run typecheck
3. Run tests
4. Lint before committing
5. Before creating PR: run full lint and test suite

## Code Style & Conventions

- Prefer `type` over `interface`; never use `enum` (use string literal unions instead)
- Use descriptive variable names
- Keep functions small and focused
- Write tests for new functionality
- Handle errors explicitly, don't swallow them

## Commands Reference

```sh
# Verification loop commands (customize for your project)
npm run typecheck        # Type checking
npm run test            # Run tests
npm run lint            # Lint all files
npm run format          # Format code

# Git workflow
git status              # Check current state
git diff                # Review changes before commit
```
## Things you Should NOT Do

- Don't use `any` type in TypeScript without explicit approval
- Don't skip error handling
- Don't commit without running tests first
- Don't make breaking API changes without discussion

## Project-Specific Patterns

When I report a bug, don't start by trying to fix it. Instead, start by writing a test that reproduces the bug. Then, have subagents try to fix the bug and prove it with a passing test.