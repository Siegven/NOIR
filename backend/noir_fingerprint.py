import ast
import hashlib
import json
import os
import re
import sqlite3
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
import ollama
from sklearn.feature_extraction.text import HashingVectorizer


CODE_EXTENSIONS = {
    ".py",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".java",
    ".cpp",
    ".c",
    ".cs",
    ".go",
    ".rs",
    ".php",
    ".rb",
}

DEPENDENCY_FILES = {
    "requirements.txt",
    "pyproject.toml",
    "package.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "package-lock.json",
    "go.mod",
    "Cargo.toml",
    "pom.xml",
    "build.gradle",
}

SKIP_DIRS = {
    ".git",
    ".venv",
    "venv",
    "node_modules",
    "dist",
    "build",
    "__pycache__",
    ".next",
    ".turbo",
}


@dataclass
class RepoFingerprint:
    repo_id: str
    source: str
    summary_hash: str
    primary_language: str
    languages: dict[str, int]
    dependencies: list[str]
    file_count: int
    directory_profile: dict[str, int]
    symbols: dict[str, list[str]]
    architecture_patterns: list[str]
    readme_excerpt: str
    fingerprint_text: str


class RepoFingerprintExtractor:
    def __init__(self, max_file_bytes: int = 120_000, max_files: int = 350):
        self.max_file_bytes = max_file_bytes
        self.max_files = max_files

    def from_local_path(self, root_path: str | Path, repo_id: str | None = None) -> RepoFingerprint:
        root = Path(root_path).resolve()
        files = list(self._iter_local_files(root))
        return self._build_fingerprint(
            repo_id=repo_id or root.name,
            source=str(root),
            files=files,
            read_file=lambda path: path.read_text(encoding="utf-8", errors="ignore"),
            relative_path=lambda path: str(path.relative_to(root)).replace("\\", "/"),
        )

    def _iter_local_files(self, root: Path) -> Iterable[Path]:
        count = 0
        for path in root.rglob("*"):
            if count >= self.max_files:
                break
            if not path.is_file():
                continue
            if any(part in SKIP_DIRS for part in path.parts):
                continue
            if path.stat().st_size > self.max_file_bytes:
                continue
            if path.suffix in CODE_EXTENSIONS or path.name in DEPENDENCY_FILES or path.name.lower().startswith("readme"):
                count += 1
                yield path

    def _build_fingerprint(self, repo_id, source, files, read_file, relative_path) -> RepoFingerprint:
        language_counts = Counter()
        directory_counts = Counter()
        dependency_names = set()
        function_names = set()
        class_names = set()
        import_names = set()
        architecture_patterns = set()
        readme_excerpt = ""
        snippets = []
        file_count = 0

        for file_ref in files:
            rel = relative_path(file_ref)
            file_count += 1
            directory_counts[self._top_directory(rel)] += 1

            ext = Path(rel).suffix.lower()
            if ext in CODE_EXTENSIONS:
                language_counts[self._language_for_extension(ext)] += 1

            try:
                content = read_file(file_ref)
            except Exception:
                continue

            if Path(rel).name in DEPENDENCY_FILES:
                dependency_names.update(self._extract_dependencies(Path(rel).name, content))

            if Path(rel).name.lower().startswith("readme") and not readme_excerpt:
                readme_excerpt = self._compact_text(content, limit=1200)

            self._collect_symbols(rel, content, function_names, class_names, import_names)
            architecture_patterns.update(self._detect_patterns(rel, content))

            if ext in CODE_EXTENSIONS:
                snippets.append(self._summarize_file(rel, content))

        primary_language = language_counts.most_common(1)[0][0] if language_counts else "unknown"
        symbols = {
            "functions": sorted(function_names)[:120],
            "classes": sorted(class_names)[:120],
            "imports": sorted(import_names)[:120],
        }

        fingerprint_text = self._make_fingerprint_text(
            repo_id=repo_id,
            primary_language=primary_language,
            languages=language_counts,
            dependencies=dependency_names,
            directory_profile=directory_counts,
            symbols=symbols,
            patterns=architecture_patterns,
            readme_excerpt=readme_excerpt,
            snippets=snippets[:80],
        )
        summary_hash = hashlib.sha256(fingerprint_text.encode("utf-8")).hexdigest()

        return RepoFingerprint(
            repo_id=repo_id,
            source=source,
            summary_hash=summary_hash,
            primary_language=primary_language,
            languages=dict(language_counts),
            dependencies=sorted(dependency_names)[:200],
            file_count=file_count,
            directory_profile=dict(directory_counts),
            symbols=symbols,
            architecture_patterns=sorted(architecture_patterns),
            readme_excerpt=readme_excerpt,
            fingerprint_text=fingerprint_text,
        )

    def _language_for_extension(self, ext: str) -> str:
        return {
            ".py": "Python",
            ".js": "JavaScript",
            ".ts": "TypeScript",
            ".jsx": "React",
            ".tsx": "React TypeScript",
            ".java": "Java",
            ".cpp": "C++",
            ".c": "C",
            ".cs": "C#",
            ".go": "Go",
            ".rs": "Rust",
            ".php": "PHP",
            ".rb": "Ruby",
        }.get(ext, ext.lstrip(".").upper())

    def _top_directory(self, relative_path: str) -> str:
        parts = relative_path.split("/")
        return parts[0] if len(parts) > 1 else "."

    def _extract_dependencies(self, filename: str, content: str) -> set[str]:
        deps = set()
        if filename == "package.json":
            try:
                payload = json.loads(content)
                for group in ("dependencies", "devDependencies", "peerDependencies"):
                    deps.update(payload.get(group, {}).keys())
            except json.JSONDecodeError:
                pass
        elif filename == "requirements.txt":
            for line in content.splitlines():
                line = line.strip()
                if line and not line.startswith("#"):
                    deps.add(re.split(r"[<>=~!;\[]", line, maxsplit=1)[0].strip())
        elif filename in {"pyproject.toml", "Cargo.toml", "go.mod", "pom.xml", "build.gradle"}:
            deps.update(re.findall(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+|[A-Za-z0-9_.-]{3,}", content)[:80])
        return {dep for dep in deps if dep}

    def _collect_symbols(self, rel, content, function_names, class_names, import_names):
        ext = Path(rel).suffix.lower()
        if ext == ".py":
            try:
                tree = ast.parse(content)
            except SyntaxError:
                return
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    function_names.add(node.name)
                elif isinstance(node, ast.ClassDef):
                    class_names.add(node.name)
                elif isinstance(node, ast.Import):
                    for alias in node.names:
                        import_names.add(alias.name.split(".")[0])
                elif isinstance(node, ast.ImportFrom) and node.module:
                    import_names.add(node.module.split(".")[0])
            return

        function_names.update(re.findall(r"(?:function\s+|def\s+|const\s+)([A-Za-z_][A-Za-z0-9_]*)", content))
        class_names.update(re.findall(r"class\s+([A-Za-z_][A-Za-z0-9_]*)", content))
        import_names.update(re.findall(r"(?:from|import)\s+['\"]?(@?[A-Za-z0-9_./-]+)", content))

    def _detect_patterns(self, rel: str, content: str) -> set[str]:
        text = f"{rel}\n{content[:6000]}".lower()
        patterns = set()
        pattern_rules = {
            "api-routes": ["route", "router", "endpoint", "fastapi", "express", "graphql", "trpc"],
            "authentication": ["auth", "jwt", "oauth", "token", "session", "passport", "nextauth"],
            "database-access": ["sql", "mongodb", "mongoose", "prisma", "sqlalchemy", "repository", "orm"],
            "background-jobs": ["queue", "worker", "celery", "bullmq", "cron", "redis", "rabbitmq"],
            "tests": ["test_", "pytest", "jest", "describe(", "it(", "cypress"],
            "frontend-components": ["component", "react", "vue", "tsx", "jsx", "svelte", "tailwind"],
            "state-management": ["redux", "zustand", "context", "vuex", "pinia"],
            "configuration": [".env", "config", "settings", "modelfile", "yaml"],
            "ai-integration": ["ollama", "openai", "qwen", "embedding", "model", "langchain", "huggingface"],
            "security-risk": ["eval(", "exec(", "hardcoded", "password", "secret_key"],
            "ci-cd": [".github/workflows", "dockerfile", "pipeline", "deploy", "kubernetes", "k8s"],
            "caching": ["memcached", "redis", "cache", "lru"],
            "websockets": ["socket.io", "websocket", "ws://", "pusher"],
        }
        for label, needles in pattern_rules.items():
            if any(needle in text for needle in needles):
                patterns.add(label)
        return patterns

    def _summarize_file(self, rel: str, content: str) -> str:
        # Extract class/function signatures for better semantic representation
        signatures = re.findall(r"^(?:class|def|function|const)\s+[A-Za-z_].*", content, re.MULTILINE)
        if signatures:
            preview = " ".join(signatures[:10])
        else:
            lines = [line.strip() for line in content.splitlines() if line.strip()]
            preview = " ".join(lines[:20])
        return f"FILE {rel} signatures: {self._compact_text(preview, limit=500)}"

    def _compact_text(self, text: str, limit: int) -> str:
        compacted = re.sub(r"\s+", " ", text).strip()
        return compacted[:limit]

    def _make_fingerprint_text(
        self,
        repo_id,
        primary_language,
        languages,
        dependencies,
        directory_profile,
        symbols,
        patterns,
        readme_excerpt,
        snippets,
    ) -> str:
        return "\n".join(
            [
                f"Repository: {repo_id}",
                f"Primary language: {primary_language}",
                f"Languages: {json.dumps(dict(languages), sort_keys=True)}",
                f"Dependencies: {', '.join(sorted(dependencies)[:160])}",
                f"Directory profile: {json.dumps(dict(directory_profile), sort_keys=True)}",
                f"Architecture patterns: {', '.join(sorted(patterns))}",
                f"Classes: {', '.join(symbols['classes'][:80])}",
                f"Functions: {', '.join(symbols['functions'][:80])}",
                f"Imports: {', '.join(symbols['imports'][:80])}",
                f"README: {readme_excerpt}",
                "Code signals:",
                "\n".join(snippets),
            ]
        )


class EmbeddingProvider:
    def __init__(self, model: str | None = None):
        self.model = model or os.getenv("NOIR_EMBED_MODEL", "nomic-embed-text")
        self._fallback = HashingVectorizer(n_features=768, alternate_sign=False, norm="l2")

    def embed(self, text: str) -> np.ndarray:
        try:
            response = ollama.embeddings(model=self.model, prompt=text)
            return self._normalize(np.array(response["embedding"], dtype=np.float32))
        except Exception:
            vector = self._fallback.transform([text]).toarray()[0].astype(np.float32)
            return self._normalize(vector)

    def _normalize(self, vector: np.ndarray) -> np.ndarray:
        norm = np.linalg.norm(vector)
        return vector if norm == 0 else vector / norm


class FingerprintVectorStore:
    def __init__(self, db_path: str | Path = ".noir/vector_store.sqlite3"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS repo_vectors (
                    repo_id TEXT PRIMARY KEY,
                    source TEXT NOT NULL,
                    summary_hash TEXT NOT NULL,
                    fingerprint_json TEXT NOT NULL,
                    vector BLOB NOT NULL,
                    dimensions INTEGER NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conn.commit()

    def clear(self):
        """Clears all indexed vectors to guarantee fresh analysis for new repositories."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("DELETE FROM repo_vectors")
            conn.commit()

    def upsert(self, fingerprint: RepoFingerprint, vector: np.ndarray):
        payload = json.dumps(asdict(fingerprint), sort_keys=True)
        vector = np.asarray(vector, dtype=np.float32)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO repo_vectors(repo_id, source, summary_hash, fingerprint_json, vector, dimensions)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(repo_id) DO UPDATE SET
                    source=excluded.source,
                    summary_hash=excluded.summary_hash,
                    fingerprint_json=excluded.fingerprint_json,
                    vector=excluded.vector,
                    dimensions=excluded.dimensions,
                    created_at=CURRENT_TIMESTAMP
                """,
                (
                    fingerprint.repo_id,
                    fingerprint.source,
                    fingerprint.summary_hash,
                    payload,
                    vector.tobytes(),
                    int(vector.shape[0]),
                ),
            )
            conn.commit()

    def search(
        self, 
        query_vector: np.ndarray, 
        limit: int = 10, 
        exclude_repo_id: str | None = None,
        allowed_repo_ids: list[str] | None = None,
    ) -> list[dict]:
        query_vector = np.asarray(query_vector, dtype=np.float32)
        rows = []
        allowed_set = {r.lower() for r in allowed_repo_ids} if allowed_repo_ids else None
        with sqlite3.connect(self.db_path) as conn:
            for repo_id, source, payload, blob, dimensions in conn.execute(
                "SELECT repo_id, source, fingerprint_json, vector, dimensions FROM repo_vectors"
            ):
                if exclude_repo_id and repo_id.lower() == exclude_repo_id.lower():
                    continue
                if allowed_set is not None and repo_id.lower() not in allowed_set:
                    continue
                vector = np.frombuffer(blob, dtype=np.float32, count=dimensions)
                if vector.shape != query_vector.shape:
                    continue
                score = float(np.dot(query_vector, vector))
                rows.append(
                    {
                        "repo_id": repo_id,
                        "source": source,
                        "score": score,
                        "fingerprint": json.loads(payload),
                    }
                )
        return sorted(rows, key=lambda row: row["score"], reverse=True)[:limit]


def structural_similarity(left: RepoFingerprint | dict, right: RepoFingerprint | dict) -> float:
    left_data = asdict(left) if isinstance(left, RepoFingerprint) else left
    right_data = asdict(right) if isinstance(right, RepoFingerprint) else right
    scores = [
        _jaccard(left_data.get("dependencies", []), right_data.get("dependencies", [])),
        _jaccard(left_data.get("architecture_patterns", []), right_data.get("architecture_patterns", [])),
        _jaccard(left_data.get("directory_profile", {}).keys(), right_data.get("directory_profile", {}).keys()),
        _jaccard(left_data.get("symbols", {}).get("imports", []), right_data.get("symbols", {}).get("imports", [])),
    ]
    return sum(scores) / len(scores)


def _jaccard(left, right) -> float:
    left_set = set(left)
    right_set = set(right)
    if not left_set and not right_set:
        return 0.0
    return len(left_set & right_set) / len(left_set | right_set)
