import json
import os
import sys
from pathlib import Path

# Fix Windows console UTF-8 output
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

try:
    from datasets import load_dataset
except ImportError:
    print("[ERROR] Missing 'datasets' library.")
    print("Please run: pip install datasets")
    exit(1)

script_dir = Path(__file__).parent
dataset_path = script_dir.parent.parent / "dataset" / "qlora_finetune_data.jsonl"
dataset_path.parent.mkdir(parents=True, exist_ok=True)

print("[INFO] Downloading Open-Source Code Repair Dataset from HuggingFace...")
dataset = load_dataset("sahil2801/CodeAlpaca-20k", split="train")

print("[INFO] Downloaded successfully! Filtering code-repair and architecture examples for NOIR...")

noir_examples = []
# Prioritize bug fixing, refactoring, and optimization examples
for row in dataset:
    instr = row.get('instruction', '').lower()
    inp = row.get('input', '')
    out = row.get('output', '')
    if any(k in instr for k in ["fix", "refactor", "bug", "optimize", "error", "improve"]):
        if inp.strip() and out.strip():
            noir_examples.append(row)
    if len(noir_examples) >= 500:
        break

# If we need more, add general input-driven code tasks
if len(noir_examples) < 500:
    for row in dataset:
        inp = row.get('input', '')
        out = row.get('output', '')
        if inp.strip() and out.strip() and row not in noir_examples:
            noir_examples.append(row)
            if len(noir_examples) >= 500:
                break

print(f"[INFO] Formatting and saving {len(noir_examples)} examples to {dataset_path.name}...")

with open(dataset_path, "w", encoding="utf-8") as f:
    for row in noir_examples:
        noir_format = {
            "instruction": "You are NOIR, an autonomous cross-repository code repair engine. Fix the bugs and architectural flaws in the following code based on the provided cross-repository insights.",
            "context": f"Architectural Insight: {row.get('instruction', '')}",
            "input": row.get('input', ''),
            "output": f"```python\n{row.get('output', '')}\n```"
        }
        f.write(json.dumps(noir_format, ensure_ascii=False) + "\n")

print(f"[SUCCESS] Dataset built successfully at: {dataset_path.resolve()}")
print("[NEXT STEP] Upload this dataset to Google Colab and run FINE_TUNING_GUIDE.md!")
