# NOIR 🛡️
### Autonomous Cross-Repository Code Repair & Quality Intelligence Engine

[![NOIR CI Pipeline](https://github.com/Siegven/NOIR/actions/workflows/ci.yml/badge.svg)](https://github.com/Siegven/NOIR/actions/workflows/ci.yml)
[![Model](https://img.shields.io/badge/Model-noir%3Alatest%20(QLoRA)-7C3AED.svg)](Noir%20Info/NOIR_FINETUNING.md)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

NOIR is an autonomous AI GitHub engineer. It connects to your GitHub repositories, performs multi-dimensional security and architecture audits, discovers similar public open-source peers through **Cross-Repository RAG**, and autonomously authors pull requests to eliminate code smells, vulnerabilities, and runtime crashes.

---

## ⚡ Core Capabilities

1. **6-Dimension Autonomous Quality Auditor:**
   - Computes objective health scorecards across *Security, Resilience, Maintainability, Architecture, Test Readiness, and Documentation*.
   - Flags critical flaws including `eval()` / `exec()` injection, raw shell calls (`os.system`), hardcoded secrets, and unhandled `ZeroDivisionError` risks.

2. **Cross-Repository Architecture Radar (RAG):**
   - Fingerprints language, imports, dependencies, and AST design patterns.
   - Searches public GitHub for top-rated peer repositories solving the same problem.
   - Computes **Hybrid Similarity (70% Semantic + 30% Structural Jaccard)** to extract production-grade design benchmarks.

3. **Autonomous Code Repair Engine (`noir:latest`):**
   - Powered by a custom fine-tuned **Qwen 2.5 Coder 7B (QLoRA)** model.
   - Injects peer architectural insights as ground truth to refactor code without hallucinations.
   - Creates isolated Git branches and opens clean, multi-file Pull Requests automatically.

---

## 🏗️ Project Architecture

```
NOIR/
├── .github/workflows/       # Automated CI Pipeline (Frontend Build & Backend Tests)
├── backend/                 # FastAPI REST API & Core Intelligence Engine
│   ├── api.py               # API Endpoints (Audit, Cross-Repo, PR Generation)
│   ├── noir_quality.py      # AST Quality & Vulnerability Auditor
│   ├── noir_cross_repo.py   # GitHub Public Harvester & Hybrid Similarity
│   ├── noir_fingerprint.py  # Repository AST Fingerprinter & Vector Store
│   ├── Noir_engine.py       # Fine-Tuned Model Inference & Repair Agent
│   └── tests/               # Automated Unit Test Suite
├── frontend/                # Studio Dashboard (Vite + React + Tailwind CSS)
│   ├── src/views/           # Repositories, Radar, Repair, PRs, Settings
│   └── src/components/      # Diff Viewer, Quality Scorecard, Sidebar
└── Noir Info/               # Technical Specifications & Fine-Tuning Reports
    ├── NOIR_ARCHITECTURE.md # Detailed System Architecture
    ├── NOIR_FINETUNING.md   # QLoRA Training Data, Weights, & Loss Curves
    └── NOIR_TECH_SPEC.md    # API Specifications & Requirements
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.ai) with `noir:latest` fine-tuned model

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp ../.env.example ../.env
python api.py
```
*API will run live at `http://localhost:8000` (Swagger docs at `/docs`).*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Web dashboard opens at `http://localhost:5173`.*

### 4. Running Automated Tests
```bash
python backend/tests/test_quality_auditor.py
```

---

## 📚 Technical Documentation & Fine-Tuning Reports
Detailed design specifications, dataset documentation, and fine-tuning weight logs are organized in the [`Noir Info/`](Noir%20Info/) directory:
- [System Architecture](Noir%20Info/NOIR_ARCHITECTURE.md)
- [Model Fine-Tuning Specification](Noir%20Info/NOIR_FINETUNING.md)
- [Technical Architecture Spec](Noir%20Info/NOIR_TECH_SPEC.md)

