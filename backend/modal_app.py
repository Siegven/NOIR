import os
import subprocess
import time
from pathlib import Path
import modal

# 1. Create a persistent Modal Volume for the Ollama model cache
# Model weights are downloaded ONCE and preserved across container cold starts.
volume = modal.Volume.from_name("noir-ollama-cache", create_if_missing=True)

# 2. Build CUDA-enabled container image with Ollama and backend dependencies
BACKEND_DIR = Path(__file__).resolve().parent

noir_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("curl", "ca-certificates", "git", "zstd")
    .run_commands("curl -fsSL https://ollama.com/install.sh | sh")
    .pip_install(
        "fastapi>=0.100.0",
        "uvicorn>=0.23.0",
        "pydantic>=2.0.0",
        "ollama>=0.6.2",
        "PyGithub>=2.0.0",
        "python-dotenv>=1.0.0",
        "requests>=2.31.0",
        "numpy>=1.24.0",
        "scikit-learn>=1.3.0",
    )
    .add_local_dir(
        BACKEND_DIR,
        remote_path="/root/backend",
        copy=True,
        ignore=["models/**", "dataset/**", "__pycache__/**", ".noir/**", "*.zip"]
    )
)

app = modal.App(name="noir-engine")

# Named Modal secret created from backend/.env
noir_secret = modal.Secret.from_name("noir-secrets")

@app.function(
    image=noir_image,
    gpu="L4",  # Fast Nvidia L4 GPU (~$0.80/hr, automatically scales to 0 when idle)
    volumes={"/root/.ollama": volume},
    secrets=[noir_secret],
    scaledown_window=300,  # Keeps warm for 5 minutes after a request, then shuts down to $0
    timeout=600,
    max_containers=1,
)
@modal.asgi_app()
def fastapi_app():
    import sys
    sys.path.insert(0, "/root/backend")

    # Start Ollama service in the background
    subprocess.Popen(["ollama", "serve"])

    # Wait for Ollama service to be ready
    for _ in range(30):
        try:
            import requests
            r = requests.get("http://127.0.0.1:11434/api/tags", timeout=1)
            if r.status_code == 200:
                break
        except Exception:
            time.sleep(1)

    # Initialize model if not already present in the persistent volume
    try:
        import requests
        tags = requests.get("http://127.0.0.1:11434/api/tags", timeout=5).json()
        model_names = [m.get("name") for m in tags.get("models", [])]
        if not any("noir" in m for m in model_names):
            print("[NOIR Modal] Model 'noir' not found in cache. Initializing...")
            subprocess.run(["ollama", "pull", "qwen2.5-coder:7b"], check=True)
            modelfile_path = "/root/backend/Modelfile"
            subprocess.run(["ollama", "create", "noir", "-f", modelfile_path], check=True)
            volume.commit()
            print("[NOIR Modal] Model 'noir' built and committed to volume!")
    except Exception as e:
        print(f"[NOIR Modal] Warning during model initialization: {e}")

    # Import and return the NOIR FastAPI application
    from api import app as web_app
    return web_app


@app.function(
    image=noir_image,
    gpu="L4",
    volumes={"/root/.ollama": volume},
    timeout=1200,
)
def warmup():
    """Initializes the persistent volume with Ollama and the NOIR model."""
    import sys
    sys.path.insert(0, "/root/backend")
    
    print("[NOIR Warmup] Starting Ollama server...")
    proc = subprocess.Popen(["ollama", "serve"])
    
    for _ in range(30):
        try:
            import requests
            r = requests.get("http://127.0.0.1:11434/api/tags", timeout=1)
            if r.status_code == 200:
                break
        except Exception:
            time.sleep(1)

    print("[NOIR Warmup] Pulling qwen2.5-coder:7b into persistent volume...")
    subprocess.run(["ollama", "pull", "qwen2.5-coder:7b"], check=True)
    
    print("[NOIR Warmup] Creating 'noir' model with custom Modelfile...")
    modelfile_path = "/root/backend/Modelfile"
    subprocess.run(["ollama", "create", "noir", "-f", modelfile_path], check=True)
    
    volume.commit()
    print("[NOIR Warmup] Persistent volume successfully initialized and committed!")
    proc.terminate()
    return "Warmup complete"

