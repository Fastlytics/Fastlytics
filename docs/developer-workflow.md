# Developer Workflow

This guide explains how to work with the Fastlytics codebase using the new professional standards.

## The "Happy Path" Cycle

1.  **Code**: Write your code as usual.
2.  **Auto-Format**: Your IDE should format on save (thanks to Prettier). If not, run:
    ```bash
    npm run format
    ```
3.  **Test Locally**: Before checking in, make sure you haven't broken anything.
    - **Frontend**: `npm run test` (Runs Vitest)
    - **Backend**: `cd backend-api && pytest`
4.  **Commit**: When you run `git commit`, **Husky** will automatically:
    - Lint your code (`eslint`, `ruff`).
    - Check formatting (`prettier`).
    - _If this fails, the commit is blocked. Fix errors and try again._
5.  **Push**: Once committed, you know your code is clean and passes basic checks.

## Key Commands

| Goal             | Frontend Command  | Backend Command             |
| :--------------- | :---------------- | :-------------------------- |
| **Start Server** | `npm run dev`     | `uvicorn main:app --reload` |
| **Run Tests**    | `npm run test`    | `pytest`                    |
| **Lint Code**    | `npm run lint`    | `ruff check .`              |
| **Format Code**  | `npm run format`  | `ruff format .`             |
| **Build Docs**   | `npm run typedoc` | `mkdocs build`              |

## Documentation

- **Frontend API**: Generated from your TypeScript comments. Run `npm run typedoc` to update `docs/frontend/`.
- **Backend API**: Generated from Python docstrings. Run `mkdocs build` to update `backend-api/site/`.

## Handling Errors

- **Linting Errors**: Read the error message. Usually it's a missing type or unused variable.
- **Pre-commit Fails**: The terminal will show you exactly what file failed. Fix it, `git add`, and commit again.
