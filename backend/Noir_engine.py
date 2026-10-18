import os
import sys
import json
import uuid
import tempfile
import ollama
from datetime import datetime
from dotenv import load_dotenv
from github import Github, Auth, GithubException

# Import the Cross-Repo Analyzer (Requires noir_cross_repo.py in same directory)
from noir_cross_repo import CrossRepositoryAnalyzer, GitHubPublicRepoHarvester
from pathlib import Path

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPO_NAME = os.getenv("REPO_NAME")
MODEL_NAME = os.getenv("MODEL_NAME", "noir")

CODE_EXTENSIONS = ('.py', '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.java', '.cpp')

def log_qlora_training_data(prompt: str, original: str, fixed: str, file_path: str):
    """
    Logs every QWEN action to a JSONL file. 
    This automatically builds your dataset for QLoRA fine-tuning!
    """
    os.makedirs("dataset", exist_ok=True)
    record = {
        "instruction": "You are NOIR, an autonomous cross-repository code repair engine. Fix the bugs and architectural flaws in the following code based on the provided cross-repository insights.",
        "context": prompt,  # The specific cross-repo insights given to the LLM
        "input": original,
        "output": fixed,
        "file_path": file_path,
        "timestamp": datetime.now().isoformat()
    }
    with open("dataset/qlora_finetune_data.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

def generate_cross_repo_context(gh_repo, github_token: str) -> str:
    """
    Downloads the remote repo temporarily and uses NOIR's cross_repo logic
    to extract architectural insights from highly-starred GitHub repos.
    """
    try:
        harvester = GitHubPublicRepoHarvester(token=github_token)
        analyzer = CrossRepositoryAnalyzer()
        
        with tempfile.TemporaryDirectory() as tmpdir:
            print(f"   [Context Extraction] Temporarily cloning {gh_repo.full_name} to analyze architecture...")
            repo_path = harvester.download_public_repo_zip(gh_repo, Path(tmpdir))
            
            if repo_path:
                # Compare against public github and get the top 2 matches
                report = analyzer.compare_against_public_github(
                    repo_path, 
                    repo_id=gh_repo.full_name, 
                    result_limit=2,
                    token=github_token
                )
                insights = [match["insight"] for match in report.get("matches", [])]
                
                if insights:
                    return "\n- ".join(insights)
    except Exception as e:
        print(f"   [Context Extraction] Warning - Could not fetch cross-repo context: {e}")
        
    return "Compare against highly-starred GitHub repositories. Enforce modularity, clear separation of concerns, and robust error handling."

def noir_analyze_code(file_path: str, code_content: str, cross_repo_context: str) -> dict:
    prompt = f"""
    You are NOIR, an autonomous cross-repository code repair engine.
    Analyze this file: {file_path}

    CROSS-REPOSITORY INSIGHTS:
    {cross_repo_context}

    Code:
    ```
    {code_content}
    ```

    Instructions:
    1. If the code has no bugs or bad practices, return the exact same code.
    2. If there are bugs or architectural flaws, use the insights above to output ONLY the fully fixed replacement code inside markdown code blocks.
    3. Do NOT add any conversational explanation.
    """

    response = ollama.chat(
        model=MODEL_NAME,
        messages=[{'role': 'user', 'content': prompt}]
    )

    raw_output = response['message']['content']

    if "```" in raw_output:
        lines = raw_output.split("\n")
        cleaned = [line for line in lines if not line.startswith("```")]
        fixed_code = "\n".join(cleaned)
    else:
        fixed_code = raw_output.strip()

    # Build QLoRA dataset entry if changes were made
    if code_content.strip() != fixed_code.strip():
        log_qlora_training_data(cross_repo_context, code_content, fixed_code, file_path)

    return {
        "original": code_content,
        "fixed": fixed_code,
        "has_changes": code_content.strip() != fixed_code.strip()
    }

def noir_auto_scan_and_fix_repo(repo_full_name: str, github_token: str | None = None):
    print(f"🚀 Initializing NOIR Autonomous Scanner for {repo_full_name}...")
    token = github_token or GITHUB_TOKEN
    auth = Auth.Token(token)
    gh = Github(auth=auth)

    try:
        repo = gh.get_repo(repo_full_name)
        print(f"✅ Connected to Repository: {repo.full_name}")

        # 1. Gather Cross-Repo Context (Connecting the two scripts!)
        print("🔍 Gathering Cross-Repository Intelligence...")
        cross_repo_context = generate_cross_repo_context(repo, token)
        print(f"🧠 Context Acquired:\n- {cross_repo_context}\n")

        # 2. Setup a new branch for the Pull Request
        branch_name = f"noir-fixes-{uuid.uuid4().hex[:8]}"
        main_ref = repo.get_git_ref(f"heads/{repo.default_branch}")
        repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=main_ref.object.sha)
        print(f"🌿 Created new safe branch: {branch_name}")

        tree = repo.get_git_tree(repo.default_branch, recursive=True)
        code_files = [e for e in tree.tree if e.type == "blob" and e.path.endswith(CODE_EXTENSIONS)]
        print(f"📁 Found {len(code_files)} code file(s). Beginning Analysis...\n")

        files_fixed = 0

        for file_element in code_files:
            file_path = file_element.path
            print(f"Scanning {file_path}...")

            content_file = repo.get_contents(file_path, ref=branch_name)
            original_code = content_file.decoded_content.decode("utf-8")

            # 3. Analyze using QWEN with Cross-Repo Context
            analysis = noir_analyze_code(file_path, original_code, cross_repo_context)

            if analysis["has_changes"]:
                print(f"   ⚠️ Issues detected! Committing fix to branch...")
                commit_message = f"🤖 NOIR: Autonomous quality repair for {file_path}"
                
                # Commit to the NEW branch, not main
                repo.update_file(
                    path=file_path,
                    message=commit_message,
                    content=analysis["fixed"],
                    sha=content_file.sha,
                    branch=branch_name
                )
                files_fixed += 1
            else:
                print(f"   ✨ Clean.")

        # 4. Open a Pull Request for user review
        if files_fixed > 0:
            print("\n🚀 Opening Pull Request...")
            pr = repo.create_pull(
                title=f"🤖 NOIR Autonomous Fixes ({files_fixed} files)",
                body="### NOIR Analysis Complete\n\nNOIR has analyzed this repository against similar high-quality open-source projects. This PR contains structural and quality fixes based on cross-repository insights.",
                head=branch_name,
                base=repo.default_branch
            )
            print(f"🎉 PR Created successfully: {pr.html_url}")
        else:
            print("\n🎉 No issues found! Repository is fully optimized.")

    except GithubException as e:
        print(f"❌ GitHub API Error: {e.status} - {e.data.get('message')}")
    except Exception as e:
        print(f"❌ Execution Error: {str(e)}")

if __name__ == "__main__":
    target_repo = sys.argv[1] if len(sys.argv) > 1 else REPO_NAME
    if not target_repo:
        print("Set REPO_NAME in .env or pass a repo name like: python Noir_engine.py owner/repo")
        sys.exit(1)
    noir_auto_scan_and_fix_repo(target_repo)
