import argparse
import itertools
import json
import os
import re
import tempfile
import zipfile
from dataclasses import asdict
from pathlib import Path

import requests
from dotenv import load_dotenv
from github import Auth, Github, GithubException

from noir_fingerprint import (
    EmbeddingProvider,
    FingerprintVectorStore,
    RepoFingerprint,
    RepoFingerprintExtractor,
    structural_similarity,
)


load_dotenv()


class GitHubPublicRepoHarvester:
    def __init__(self, token: str | None = None, per_page: int = 10):
        self.token = token or os.getenv("GITHUB_TOKEN")
        self.per_page = per_page
        self.github = Github(auth=Auth.Token(self.token)) if self.token else Github()

    def _extract_domain_keywords(self, target: RepoFingerprint) -> list[str]:
        """
        Extracts semantic domain keywords from repository name, description, and README.
        For example: 'hospital-queue-optimization' -> ['hospital', 'queue', 'optimization']
        """
        tokens = []
        noise = {
            "project", "repo", "repository", "app", "application", "code", "demo",
            "sample", "test", "tests", "master", "main", "dev", "final", "homework",
            "service", "system", "backend", "frontend", "fullstack", "v1", "v2", "my",
            "assignment", "lab", "exercises", "learning", "src"
        }

        # 1. From repository identifier / name
        repo_name = target.repo_id.split("/")[-1] if target.repo_id else ""
        name_words = re.findall(r"[a-zA-Z]{3,}", repo_name.lower())
        for w in name_words:
            if w not in noise and w not in tokens:
                tokens.append(w)

        # 2. From README excerpt if available
        if target.readme_excerpt:
            first_lines = target.readme_excerpt[:400].lower()
            readme_words = re.findall(r"[a-zA-Z]{4,}", first_lines)
            common_words = noise | {"this", "that", "with", "from", "using", "which", "build", "install", "run", "requirements", "setup", "license"}
            for w in readme_words:
                if w not in common_words and w not in tokens and len(tokens) < 6:
                    tokens.append(w)

        return tokens

    def search_similar_candidates(self, target: RepoFingerprint, limit: int = 8):
        domain_tokens = self._extract_domain_keywords(target)
        candidates = []
        seen_ids = {target.repo_id.lower()}

        excluded_catalog_terms = {
            "awesome", "free-programming-books", "system-design-primer", "public-apis",
            "interview", "cheatsheet", "roadmap", "curated", "collection", "tutorial",
            "algorithms", "leetcode", "design-patterns", "course", "curated-list"
        }

        def is_genuine_peer(r):
            name_low = r.name.lower()
            desc_low = (r.description or "").lower()
            full_low = r.full_name.lower()
            if full_low in seen_ids:
                return False
            if any(term in name_low or term in desc_low for term in excluded_catalog_terms):
                return False
            return True

        queries = []
        lang_filter = f"language:{target.primary_language}" if target.primary_language != "unknown" else ""

        # Strategy 1: Targeted domain keywords + language
        if domain_tokens:
            primary_domain = " ".join(domain_tokens[:3])
            queries.append(f"{primary_domain} {lang_filter} NOT awesome NOT book NOT tutorial NOT interview NOT list".strip())
            if len(domain_tokens) > 1:
                queries.append(f"{domain_tokens[0]} {domain_tokens[1]} {lang_filter} NOT awesome NOT list".strip())
            queries.append(f"{domain_tokens[0]} {lang_filter} stars:>1 NOT awesome NOT list".strip())

        # Strategy 2: Architecture patterns & dependencies
        signal_terms = [t.lower().replace("_", "-") for t in (target.dependencies[:4] + target.architecture_patterns[:3])]
        signal_terms = [t for t in signal_terms if len(t) >= 3 and t not in {"os", "sys", "json", "typing", "tests"}][:3]
        if signal_terms:
            queries.append(f"{' '.join(signal_terms)} {lang_filter} stars:>2 NOT awesome NOT book".strip())

        # Strategy 3: General domain fallback (avoiding top generic catalogs)
        queries.append(f"{lang_filter} stars:2..500 archived:false NOT awesome NOT book NOT list NOT tutorial".strip())

        for query in queries:
            if len(candidates) >= limit:
                break
            try:
                results = self.github.search_repositories(query=query, sort="stars", order="desc")
                for repo in itertools.islice(results, 15):
                    if is_genuine_peer(repo):
                        seen_ids.add(repo.full_name.lower())
                        candidates.append(repo)
                        if len(candidates) >= limit:
                            break
            except Exception:
                continue

        return candidates

    def download_public_repo_zip(self, repo, destination: Path) -> Path | None:
        try:
            # 1. Fetch exact latest commit SHA on the default branch to bypass GitHub CDN caching
            commit_sha = None
            try:
                default_branch = getattr(repo, "default_branch", "main") or "main"
                try:
                    commit_sha = repo.get_commits()[0].sha
                except Exception:
                    branch_obj = repo.get_branch(default_branch)
                    commit_sha = branch_obj.commit.sha
            except Exception:
                pass

            if commit_sha:
                url = f"https://api.github.com/repos/{repo.full_name}/zipball/{commit_sha}"
            else:
                ref = getattr(repo, "default_branch", "main") or "main"
                url = f"https://api.github.com/repos/{repo.full_name}/zipball/{ref}"

            headers = {
                "Accept": "application/vnd.github+json",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache"
            }
            if self.token:
                headers["Authorization"] = f"Bearer {self.token}"

            response = requests.get(url, headers=headers, timeout=45, allow_redirects=True)
            if response.status_code >= 400:
                return None

            owner_login = getattr(repo.owner, "login", "repo") if hasattr(repo, "owner") else "repo"
            repo_name = getattr(repo, "name", "download")
            zip_path = destination / f"{owner_login}-{repo_name}.zip"
            zip_path.write_bytes(response.content)
            extract_root = destination / f"{owner_login}-{repo_name}"
            extract_root.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(zip_path) as archive:
                archive.extractall(extract_root)

            children = [path for path in extract_root.iterdir() if path.is_dir()]
            return children[0] if children else extract_root
        except Exception:
            return None


class CrossRepositoryAnalyzer:
    def __init__(
        self,
        db_path: str | Path | None = None,
        extractor: RepoFingerprintExtractor | None = None,
        embedder: EmbeddingProvider | None = None,
    ):
        if db_path is None:
            candidate = Path(__file__).resolve().parent.parent / ".noir" / "vector_store.sqlite3"
            if candidate.parent.exists() or candidate.exists():
                db_path = candidate
            else:
                db_path = Path(__file__).resolve().parent / ".noir" / "vector_store.sqlite3"

        self.extractor = extractor or RepoFingerprintExtractor()
        self.embedder = embedder or EmbeddingProvider()
        self.store = FingerprintVectorStore(db_path)

    def index_local_repo(self, path: str | Path, repo_id: str | None = None) -> RepoFingerprint:
        fingerprint = self.extractor.from_local_path(path, repo_id=repo_id)
        vector = self.embedder.embed(fingerprint.fingerprint_text)
        self.store.upsert(fingerprint, vector)
        return fingerprint

    def compare_against_index(self, path: str | Path, repo_id: str | None = None, limit: int = 10) -> dict:
        target = self.index_local_repo(path, repo_id=repo_id)
        target_vector = self.embedder.embed(target.fingerprint_text)
        matches = self.store.search(target_vector, limit=limit, exclude_repo_id=target.repo_id)
        return self._ranked_report(target, matches)

    def compare_against_public_github(
        self,
        path: str | Path,
        repo_id: str | None = None,
        candidate_limit: int = 6,
        result_limit: int = 5,
        token: str | None = None,
    ) -> dict:
        # Always clear vector store for a completely fresh domain analysis run
        self.store.clear()
        target = self.index_local_repo(path, repo_id=repo_id)
        harvester = GitHubPublicRepoHarvester(token=token)
        candidates = harvester.search_similar_candidates(target, limit=candidate_limit)
        candidate_ids = [c.full_name for c in candidates]

        with tempfile.TemporaryDirectory(prefix="noir-public-repos-") as tmp:
            tmp_path = Path(tmp)
            for repo in candidates:
                repo_path = harvester.download_public_repo_zip(repo, tmp_path)
                if not repo_path:
                    continue
                fingerprint = self.extractor.from_local_path(repo_path, repo_id=repo.full_name)
                vector = self.embedder.embed(fingerprint.fingerprint_text)
                self.store.upsert(fingerprint, vector)

        target_vector = self.embedder.embed(target.fingerprint_text)
        matches = self.store.search(
            target_vector, 
            limit=result_limit, 
            exclude_repo_id=target.repo_id,
            allowed_repo_ids=candidate_ids
        )
        return self._ranked_report(target, matches)

    def _ranked_report(self, target: RepoFingerprint, matches: list[dict]) -> dict:
        enriched = []
        for match in matches:
            structure_score = structural_similarity(target, match["fingerprint"])
            combined_score = round((match["score"] * 0.7) + (structure_score * 0.3), 4)
            enriched.append(
                {
                    "repo_id": match["repo_id"],
                    "source": match["source"],
                    "semantic_similarity": round(match["score"], 4),
                    "structural_similarity": round(structure_score, 4),
                    "combined_similarity": combined_score,
                    "shared_patterns": sorted(
                        set(target.architecture_patterns)
                        & set(match["fingerprint"].get("architecture_patterns", []))
                    ),
                    "shared_dependencies": sorted(
                        set(target.dependencies) & set(match["fingerprint"].get("dependencies", []))
                    )[:30],
                    "insight": self._make_insight(target, match["fingerprint"], combined_score),
                }
            )

        enriched.sort(key=lambda row: row["combined_similarity"], reverse=True)
        return {
            "target": asdict(target),
            "matches": enriched,
            "next_actions": [
                "Use top matches as evidence for architecture recommendations.",
                "Ask NOIR to generate a fix plan using target repo gaps versus matched repos.",
                "Apply changes on a branch and validate before creating a pull request.",
            ],
        }

    def _make_insight(self, target: RepoFingerprint, match: dict, score: float) -> str:
        missing_patterns = sorted(set(match.get("architecture_patterns", [])) - set(target.architecture_patterns))
        shared_patterns = sorted(set(match.get("architecture_patterns", [])) & set(target.architecture_patterns))
        missing_deps = sorted(set(match.get("dependencies", [])) - set(target.dependencies))[:8]

        parts = [
            f"Based on structural match {match['repo_id']} (similarity {score}):",
        ]
        if shared_patterns:
            parts.append(f"  - Maintain best practices for: {', '.join(shared_patterns[:6])}.")
        if missing_patterns:
            parts.append(f"  - SUGGESTED ARCHITECTURE: Consider implementing {', '.join(missing_patterns[:6])} as seen in top repos.")
        if missing_deps:
            parts.append(f"  - MISSING STANDARD DEPENDENCIES: Highly rated repos use {', '.join(missing_deps)}. Integrate these concepts if applicable.")
        
        parts.append("  - RULE: Fix code structure to match industry standards found in these high-quality repositories.")
        return "\n".join(parts)


def main():
    parser = argparse.ArgumentParser(description="NOIR cross-repository vector analysis")
    parser.add_argument("--path", default=".", help="Local repository or folder to analyze")
    parser.add_argument("--repo-id", default=None, help="Stable id/name for this repo")
    parser.add_argument("--public", action="store_true", help="Fetch and compare against public GitHub repos")
    parser.add_argument("--limit", type=int, default=5, help="Number of matches to return")
    parser.add_argument("--candidate-limit", type=int, default=6, help="Public repos to harvest before ranking")
    parser.add_argument("--db", default=".noir/vector_store.sqlite3", help="Vector store path")
    args = parser.parse_args()

    analyzer = CrossRepositoryAnalyzer(db_path=args.db)
    if args.public:
        report = analyzer.compare_against_public_github(
            args.path,
            repo_id=args.repo_id,
            candidate_limit=args.candidate_limit,
            result_limit=args.limit,
        )
    else:
        report = analyzer.compare_against_index(args.path, repo_id=args.repo_id, limit=args.limit)

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
