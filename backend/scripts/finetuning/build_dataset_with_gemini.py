import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv

script_dir = Path(__file__).parent
env_path = script_dir.parent.parent / ".env"
load_dotenv(env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print(f"❌ ERROR: Could not find GEMINI_API_KEY in {env_path.resolve()}")
    exit(1)

from google import genai
from google.genai import types

client = genai.Client(api_key=GEMINI_API_KEY)

PROMPT = """
You are an expert AI software architect creating training data. 
Generate a JSON array containing 3 training examples for a code repair AI named NOIR.

For each example, create:
1. "context": A short string of architectural insights.
2. "input": A piece of messy, buggy, or poorly structured code (Python, JS, React, etc.).
3. "output": The perfectly fixed, architecturally sound code, enclosed in markdown ``` language blocks.
4. "instruction": Always use exactly: "You are NOIR, an autonomous cross-repository code repair engine. Fix the bugs and architectural flaws in the following code based on the provided cross-repository insights."

Ensure the output is a valid JSON array of objects.
"""

def generate_synthetic_data(iterations=5):
    dataset_path = script_dir.parent.parent / "dataset" / "qlora_finetune_data.jsonl"
    dataset_path.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"🚀 Starting NOIR Synthetic Data Generation (Target: {iterations * 3} examples)")
    
    total_generated = 0
    with open(dataset_path, "a", encoding="utf-8") as f:
        for i in range(iterations):
            print(f"🔄 Generation Batch {i+1}/{iterations}...")
            
            # Retry loop to handle Free Tier rate limits gracefully
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    response = client.models.generate_content(
                        model='gemini-3.8-flash', # Using the latest Flash model!
                        contents=PROMPT,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                        ),
                    )
                    
                    data = json.loads(response.text)
                    for item in data:
                        f.write(json.dumps(item) + "\n")
                        total_generated += 1
                        
                    print(f"✅ Batch {i+1} successful.")
                    time.sleep(4) # Small delay to respect the 15 RPM limit
                    break # Success! Break out of the retry loop
                    
                except Exception as e:
                    error_msg = str(e)
                    # Catch both Rate Limits (429) and High Demand Spikes (503)
                    if any(err in error_msg for err in ["429", "RESOURCE_EXHAUSTED", "503", "UNAVAILABLE"]):
                        wait_time = 30
                        print(f"   ⏳ API busy (High demand). Waiting {wait_time} seconds before retrying (Attempt {attempt+1}/{max_retries})...")
                        time.sleep(wait_time)
                    else:
                        print(f"❌ Error in batch {i+1}: {error_msg}")
                        break # Break on actual code errors
                        
    print(f"🎉 Complete! Added {total_generated} examples to {dataset_path.resolve()}")

if __name__ == "__main__":
    generate_synthetic_data(iterations=5)
