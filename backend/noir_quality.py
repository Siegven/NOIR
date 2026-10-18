import os
import re
import ast
from pathlib import Path
from typing import Dict, List, Any, Optional

CODE_EXTENSIONS = {'.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.go', '.rs'}
SKIP_DIRS = {'.git', '.venv', 'venv', 'node_modules', 'dist', 'build', '__pycache__', '.next'}

class RepositoryQualityAuditor:
    """
    Autonomous Code Quality & Architecture Health Auditor.
    Computes objective quality scores across 6 industry dimensions:
    1. Maintainability & Modularity
    2. Security & Vulnerability Guard
    3. Error Handling & Resilience
    4. Architecture & Structure
    5. Test Readiness
    6. Documentation & Specifications
    """

    def audit_local_path(self, root_path: str | Path, repo_name: str = "") -> Dict[str, Any]:
        root = Path(root_path).resolve()
        
        total_files = 0
        total_code_files = 0
        total_lines = 0
        code_files = []
        has_readme = False
        has_tests = False
        has_cicd = False
        
        detected_issues: List[Dict[str, Any]] = []
        
        # Dimension penalty accumulators
        security_penalties = 0
        maintainability_penalties = 0
        error_handling_penalties = 0
        
        # Traverse repository
        for p in root.rglob("*"):
            if not p.is_file():
                continue
            if any(part in SKIP_DIRS for part in p.parts):
                continue
            
            total_files += 1
            rel_path = str(p.relative_to(root)).replace("\\", "/")
            
            # Check test & cicd presence
            if "test" in rel_path.lower() or p.name.startswith("test_") or p.name.endswith("_test.py") or ".spec." in p.name:
                has_tests = True
            if ".github" in rel_path.lower() or "docker" in p.name.lower() or "procfile" in p.name.lower():
                has_cicd = True
            if p.name.lower().startswith("readme"):
                has_readme = True

            ext = p.suffix.lower()
            if ext in CODE_EXTENSIONS:
                total_code_files += 1
                code_files.append((rel_path, p))

        # Inspect code files for specific defects and patterns
        for rel_path, file_path in code_files:
            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue

            lines = content.splitlines()
            line_count = len(lines)
            total_lines += line_count

            # 1. Maintainability Checks
            if line_count > 400:
                maintainability_penalties += 12
                detected_issues.append({
                    "file": rel_path,
                    "line": 1,
                    "severity": "LOW",
                    "category": "Maintainability",
                    "issue": f"Large monolithic file ({line_count} lines)",
                    "recommendation": "Split into cohesive smaller modules"
                })

            # Deep nesting check
            max_indent = 0
            for idx, line in enumerate(lines, start=1):
                indent = len(line) - len(line.lstrip(" "))
                if indent > max_indent:
                    max_indent = indent
            if max_indent >= 16:
                maintainability_penalties += 8
                detected_issues.append({
                    "file": rel_path,
                    "line": 1,
                    "severity": "MEDIUM",
                    "category": "Maintainability",
                    "issue": "Excessive control flow nesting depth (>= 4 levels)",
                    "recommendation": "Use early return guard clauses to flatten logic"
                })

            # 2. Python AST Checks for Robust Resilience & Bug Detection
            file_ext = file_path.suffix.lower()
            if file_ext == ".py":
                try:
                    tree = ast.parse(content)
                    for node in ast.walk(tree):
                        # Arithmetic division guard check
                        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Div):
                            # Skip Pathlib joins (e.g. ROOT / "Dataset")
                            if isinstance(node.right, ast.Constant) and isinstance(node.right.value, str):
                                continue
                            # Skip non-zero constant division (e.g. x / 2, x / 100)
                            if isinstance(node.right, ast.Constant) and isinstance(node.right.value, (int, float)) and node.right.value != 0:
                                continue
                            line_no = getattr(node, "lineno", 1)
                            surrounding = lines[max(0, line_no - 4):min(len(lines), line_no + 3)]
                            surrounding_text = "\n".join(surrounding)
                            if not any(kw in surrounding_text for kw in ["try:", "except", "if not ", "if len(", "!= 0", "> 0", "if "]):
                                error_handling_penalties += 10
                                detected_issues.append({
                                    "file": rel_path,
                                    "line": line_no,
                                    "severity": "MEDIUM",
                                    "category": "Resilience",
                                    "issue": "Potential unhandled ZeroDivisionError in arithmetic division",
                                    "recommendation": "Add a guard clause checking denominator != 0 or wrap in try/except"
                                })
                except SyntaxError:
                    pass

            # 3. Line-by-Line Security & Resilience Checks
            for idx, line in enumerate(lines, start=1):
                stripped = line.strip()
                if stripped.startswith("#") or stripped.startswith("//") or stripped.startswith("/*"):
                    continue

                # Dangerous dynamic code execution
                if re.search(r"\beval\s*\(", stripped):
                    security_penalties += 30
                    detected_issues.append({
                        "file": rel_path,
                        "line": idx,
                        "severity": "CRITICAL",
                        "category": "Security",
                        "issue": "Arbitrary code execution via eval()",
                        "recommendation": "Replace eval() with safe parsers, lookup tables, or ast.literal_eval"
                    })

                if re.search(r"\bexec\s*\(", stripped):
                    security_penalties += 30
                    detected_issues.append({
                        "file": rel_path,
                        "line": idx,
                        "severity": "CRITICAL",
                        "category": "Security",
                        "issue": "Arbitrary code execution via exec()",
                        "recommendation": "Remove dynamic exec() invocations"
                    })

                # Hardcoded credentials
                if re.search(r'(api_key|secret|password|auth_token)\s*[:=]\s*["\'][a-zA-Z0-9_\-]{8,}["\']', stripped, re.IGNORECASE):
                    security_penalties += 25
                    detected_issues.append({
                        "file": rel_path,
                        "line": idx,
                        "severity": "HIGH",
                        "category": "Security",
                        "issue": "Potential hardcoded credentials/secrets detected",
                        "recommendation": "Move secrets into environment variables (.env)"
                    })

                # Raw shell commands
                if "os.system(" in stripped or "shell=True" in stripped:
                    security_penalties += 20
                    detected_issues.append({
                        "file": rel_path,
                        "line": idx,
                        "severity": "HIGH",
                        "category": "Security",
                        "issue": "Dangerous shell execution invocation",
                        "recommendation": "Use subprocess.run with explicit argument lists"
                    })

                # Bare except check in Python
                if file_ext == ".py" and (re.match(r"^except\s*:\s*$", stripped) or re.match(r"^except\s*Exception\s*:\s*pass\b", stripped)):
                    error_handling_penalties += 15
                    detected_issues.append({
                        "file": rel_path,
                        "line": idx,
                        "severity": "MEDIUM",
                        "category": "Resilience",
                        "issue": "Silently swallowed exceptions or bare except",
                        "recommendation": "Catch specific exceptions and log error context"
                    })

                # JS/TS specific checks
                if file_ext in {".js", ".jsx", ".ts", ".tsx"}:
                    if "dangerouslySetInnerHTML" in stripped:
                        security_penalties += 20
                        detected_issues.append({
                            "file": rel_path,
                            "line": idx,
                            "severity": "HIGH",
                            "category": "Security",
                            "issue": "XSS hazard: dangerouslySetInnerHTML used without sanitization",
                            "recommendation": "Use clean React text nodes or DOMPurify before injecting markup"
                        })
                    if "JSON.parse(" in stripped and "try" not in content:
                        error_handling_penalties += 10
                        detected_issues.append({
                            "file": rel_path,
                            "line": idx,
                            "severity": "MEDIUM",
                            "category": "Resilience",
                            "issue": "Unprotected JSON.parse without try/catch guard",
                            "recommendation": "Wrap JSON.parse in try/catch to avoid uncaught SyntaxError crashes"
                        })

        # Calculate scores for each dimension (0 - 100)
        security_score = max(20, min(100, 100 - security_penalties))
        maintainability_score = max(25, min(100, 100 - maintainability_penalties))
        error_handling_score = max(20, min(100, 100 - error_handling_penalties))
        
        # Architecture & Modularity
        arch_score = 80
        if total_code_files >= 3:
            arch_score = 90
        elif total_code_files == 1:
            arch_score = 60
        if any("/" in rel for rel, _ in code_files):
            arch_score = min(100, arch_score + 10)

        # Test Readiness
        test_score = 90 if has_tests else 40
        if has_cicd:
            test_score = min(100, test_score + 10)

        # Documentation
        doc_score = 88 if has_readme else 45

        # Weighted Overall Health Score (0 - 100)
        overall_score = round(
            (security_score * 0.25) +
            (maintainability_score * 0.20) +
            (error_handling_score * 0.20) +
            (arch_score * 0.15) +
            (test_score * 0.10) +
            (doc_score * 0.10)
        )

        # Determine Letter Grade
        if overall_score >= 90:
            grade = "A+"
            badge_status = "Production Ready"
        elif overall_score >= 80:
            grade = "A"
            badge_status = "Robust Architecture"
        elif overall_score >= 70:
            grade = "B"
            badge_status = "Needs Architecture Polish"
        elif overall_score >= 60:
            grade = "C"
            badge_status = "Moderate Technical Debt"
        else:
            grade = "D"
            badge_status = "Critical Refactoring Required"

        parameters = [
            {
                "name": "Security & Vulnerability Guard",
                "score": security_score,
                "weight": 25,
                "color": "#10b981" if security_score >= 80 else ("#f59e0b" if security_score >= 60 else "#f43f5e"),
                "details": "Evaluation of dynamic code execution, credential safety, and injection hazards."
            },
            {
                "name": "Maintainability & Clean Code",
                "score": maintainability_score,
                "weight": 20,
                "color": "#38bdf8" if maintainability_score >= 80 else ("#f59e0b" if maintainability_score >= 60 else "#f43f5e"),
                "details": "Nesting control flow depth, modular file lengths, and readability standards."
            },
            {
                "name": "Error Handling & Resilience",
                "score": error_handling_score,
                "weight": 20,
                "color": "#818cf8" if error_handling_score >= 80 else ("#f59e0b" if error_handling_score >= 60 else "#f43f5e"),
                "details": "Exception handling guards, zero-division protection, and crash resilience."
            },
            {
                "name": "Architecture & Modularity",
                "score": arch_score,
                "weight": 15,
                "color": "#a855f7" if arch_score >= 80 else ("#f59e0b" if arch_score >= 60 else "#f43f5e"),
                "details": "Separation of concerns, folder structure hygiene, and cohesion."
            },
            {
                "name": "Test & CI/CD Readiness",
                "score": test_score,
                "weight": 10,
                "color": "#10b981" if test_score >= 80 else ("#f59e0b" if test_score >= 60 else "#f43f5e"),
                "details": "Presence of test suites, automated CI pipelines, and verification specs."
            },
            {
                "name": "Documentation & Standards",
                "score": doc_score,
                "weight": 10,
                "color": "#34d399" if doc_score >= 80 else ("#f59e0b" if doc_score >= 60 else "#f43f5e"),
                "details": "README coverage, project setup clarity, and documentation quality."
            }
        ]

        return {
            "repository": repo_name or root.name,
            "overall_score": overall_score,
            "grade": grade,
            "badge_status": badge_status,
            "stats": {
                "total_files": total_files,
                "code_files": total_code_files,
                "total_lines": total_lines,
                "has_readme": has_readme,
                "has_tests": has_tests,
                "has_cicd": has_cicd
            },
            "parameters": parameters,
            "detected_issues": detected_issues[:25],
            "issues_count": len(detected_issues)
        }

