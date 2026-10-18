# NOIR Cross-Repository Intelligence Plan

NOIR is an AI GitHub engineer. A user signs in with GitHub, selects a repository, sees quality analytics, compares it with similar public repositories, and can ask NOIR to create code fixes.

## Core Pipeline

1. Authenticate with GitHub and list the user's repositories.
2. Build a repository fingerprint:
   - language distribution
   - dependency files
   - folder structure
   - functions, classes, and imports
   - architecture patterns such as API routes, auth, database access, tests, AI integration, and CI/CD
   - README/project description signal
3. Convert the fingerprint into an embedding vector.
4. Store vectors in `.noir/vector_store.sqlite3`.
5. Search public GitHub repositories with similar dependency, import, language, and architecture signals.
6. Fingerprint public candidates and rank them by:
   - semantic embedding similarity
   - structural similarity
7. Generate repo insights:
   - similar public repositories
   - shared dependencies and architecture patterns
   - patterns present in public repos but missing locally
   - evidence for repair recommendations
8. When the user chooses fix mode:
   - create a branch
   - generate patches with NOIR/Qwen
   - validate syntax/tests/static checks
   - open a pull request or commit if auto-commit is enabled

## Current Backend Prototype

- `noir_fingerprint.py`
  - Extracts codebase-level fingerprints.
  - Generates embeddings through Ollama using `NOIR_EMBED_MODEL`.
  - Falls back to a deterministic local hashing vector if the embedding model is unavailable.
  - Stores vectors in SQLite.

- `noir_cross_repo.py`
  - Indexes local repositories.
  - Searches and downloads public GitHub candidates.
  - Compares repos with semantic and structural similarity.
  - Emits JSON for a future backend API or frontend dashboard.

## Run Locally

Index and compare against already stored repos:

```bash
python noir_cross_repo.py --path . --repo-id noir-local --limit 5
```

Search public GitHub repos, fingerprint them, and compare:

```bash
python noir_cross_repo.py --path . --repo-id noir-local --public --candidate-limit 6 --limit 5
```

Useful environment variables:

```bash
GITHUB_TOKEN=your_github_token
NOIR_EMBED_MODEL=nomic-embed-text
MODEL_NAME=noir
```

## Frontend Data Shape

The analyzer returns JSON with:

- `target`: the selected repository fingerprint
- `matches`: ranked similar repositories
- `semantic_similarity`: embedding score
- `structural_similarity`: dependency, folder, import, and pattern overlap
- `combined_similarity`: final rank score
- `shared_patterns`
- `shared_dependencies`
- `insight`: short evidence-based comparison text

This can power the repo analytics page and the cross-repository comparison panel.
