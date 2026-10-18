import os
import sys
import tempfile
import unittest
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from noir_quality import RepositoryQualityAuditor


class TestRepositoryQualityAuditor(unittest.TestCase):
    """Test suite for NOIR's AST-based Code Quality & Security Auditor."""

    def setUp(self):
        self.auditor = RepositoryQualityAuditor()

    def test_auditor_detects_security_and_resilience_flaws(self):
        """Verify that NOIR's Quality Auditor correctly flags dangerous code patterns."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            
            bad_code = (
                'import os\n\n'
                'api_key = "sk_live_9948271049281729482910"\n\n'
                'def calc(x):\n'
                '    return eval(f"{x} * 0.1")\n\n'
                'def run(cmd):\n'
                '    os.system(cmd)\n\n'
                'def compute_ratio(total, count):\n'
                '    ratio = total / count\n'
                '    return ratio\n\n'
                'def handler():\n'
                '    try:\n'
                '        run("echo test")\n'
                '    except:\n'
                '        pass\n'
            )
            test_file = tmp_path / "flawed_service.py"
            test_file.write_text(bad_code, encoding="utf-8")

            report = self.auditor.audit_local_path(tmp_path, repo_name="test-repo")

            self.assertIn("overall_score", report)
            self.assertIn("grade", report)
            self.assertIn("detected_issues", report)
            self.assertGreater(report["issues_count"], 0)

            issue_texts = [i["issue"] for i in report["detected_issues"]]
            self.assertTrue(any("eval()" in t for t in issue_texts), "Should detect eval()")
            self.assertTrue(any("credentials" in t or "secret" in t for t in issue_texts), "Should detect hardcoded secrets")
            self.assertTrue(any("shell execution" in t for t in issue_texts), "Should detect os.system")
            self.assertTrue(any("ZeroDivisionError" in t for t in issue_texts), "Should detect potential ZeroDivisionError")

    def test_auditor_clean_code(self):
        """Verify that clean modular code receives a high quality score without false positives."""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            (tmp_path / "README.md").write_text("# Clean Project\nDocumentation present.", encoding="utf-8")
            
            clean_code = (
                'import os\n'
                'from typing import Optional\n'
                'def safe_add(a: int, b: int) -> int:\n'
                '    return a + b\n'
                'def safe_divide(a: float, b: float) -> Optional[float]:\n'
                '    if b == 0:\n'
                '        return None\n'
                '    return a / b\n'
            )
            (tmp_path / "service.py").write_text(clean_code, encoding="utf-8")

            report = self.auditor.audit_local_path(tmp_path, repo_name="clean-repo")

            self.assertGreaterEqual(report["overall_score"], 80)
            self.assertEqual(report["issues_count"], 0)


if __name__ == "__main__":
    unittest.main()
