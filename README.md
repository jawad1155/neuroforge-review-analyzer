# NeuroForge — AI Customer Review Analyzer

[![Hackathon](https://img.shields.io/badge/AMD%20Developer%20Hackathon-ACT%20III-ED1C24.svg)](https://lablab.ai)
[![Evolus Workspace](https://img.shields.io/badge/Evolus%20Workspace-5f96b97d--e488--44dc--973d--09c30c5625aa-blue.svg)](https://app.evolus.ai)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![Docker](https://img.shields.io/badge/Containerized-Docker%20%7C%20Compose-2496ED.svg)](https://docker.com)

**NeuroForge** is an enterprise AI-powered customer review intelligence platform built for the **AMD Developer Hackathon: ACT III**. It transforms raw, unstructured customer reviews into real-time sentiment distribution, top customer praise, high-priority complaints, and actionable business insights.

---

## 🏛 Architecture & Hackathon Integrations

NeuroForge combines **Evolus AI Agent orchestration** with **AMD high-performance hardware inference**:

```
+-----------------------------------------------------------+
|                    Frontend Dashboard                     |
|           (HTML5 / CSS3 / Vanilla JS / WebGL)             |
+-----------------------------+-----------------------------+
                              |
                              v
+-----------------------------------------------------------+
|               NeuroForge FastAPI Backend                  |
|    Data Ingestion, CSV Sanitization, Webhook Dispatch     |
+---------------+-----------------------------+-------------+
                |                             |
                v                             v
+-------------------------------+ +-------------------------+
|     Evolus AI Workspace       | |   AMD Developer Cloud   |
| (app.evolus.ai / Workflows)   | |  Hardware-Accelerated   |
| ID: 5f96b97d-e488-44dc...     | |    vLLM Model Endpoint  |
| - Review Analyzer Agent       | |  - DeepSeek-V4-Flash    |
| - Knowledge Library RAG       | |  - ROCm Acceleration    |
| - Automated Extraction Tasks  | |  - Low-latency batching |
+-------------------------------+ +-------------------------+
```

### 1. Evolus AI Platform Integration
* **Workspace ID**: `5f96b97d-e488-44dc-973d-09c30c5625aa`
* **Agent Name**: `Review Insight Analyst`
* **Agent ID**: `aa475004-2f3e-4b8c-93cd-0676450c5058`
* **Agent Role**: Customer Review Sentiment, Complaint & Insight Extraction Agent.
* **Knowledge Library**: Ingests customer review batches and CSV datasets to build contextual retrieval.
* **REST & Agent API**: The backend communicates directly with `https://api.evolus.ai/api/v1` using `X-Application-Id` and agent execution routes.
* **Verification Route**: Check status at `/evolus/info`.

### 2. AMD Hardware Acceleration
* **Inference Endpoint**: High-throughput AMD Developer Cloud API powered by ROCm infrastructure.
* **Model Engine**: `DeepSeek-V4-Flash` with JSON-mode semantic parsing and retry logic.
* **Resilient Fallback**: Auto-balancing between Evolus AI agent workflows and direct AMD cloud endpoints.

---

## 🚀 Quick Start (Docker - Recommended)

The application is fully containerized for seamless evaluation:

```bash
# Clone the repository
git clone <repo-url>
cd neuroforge-review-analyzer

# Launch container with Docker Compose
docker compose up --build
```

The web dashboard and API will be live at:
👉 **http://localhost:8000**

---

## 💻 Local Setup (Without Docker)

### 1. Requirements
* Python 3.10+
* pip

### 2. Installation
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Create or verify `backend/.env`:
```env
AMD_RADEON_API_KEY=your_amd_key_here
EVOLUS_WORKSPACE_ID=5f96b97d-e488-44dc-973d-09c30c5625aa
EVOLUS_API_KEY=your_evolus_api_key_if_available
DATABASE_URL=sqlite:///./neuroforge.db
```

### 4. Run the Server
```bash
python -m uvicorn backend.main:app --reload --port 8000
```
Open **`http://localhost:8000`** in your browser.

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check & orchestration diagnostics |
| `GET` | `/evolus/info` | Evolus Workspace & AMD model verification |
| `POST` | `/evolus/sync` | Sync review dataset with Evolus agent |
| `POST` | `/analyze` | Upload CSV and process sentiment & topics |
| `POST` | `/ask` | Conversational Q&A agent over customer reviews |
| `POST` | `/import-url` | Scrape reviews from live product URL |
| `POST` | `/auth/signup` | User registration |
| `POST` | `/auth/token` | OAuth2 Bearer token generation |
| `POST` | `/api/keys` | Create programmatic API keys |
| `POST` | `/webhooks/subscribe` | Register webhook for analysis event callbacks |

---

## 🧪 Testing with Demo Data
A realistic dataset of customer reviews is included in the root directory:
* [`sample_reviews_real.csv`](sample_reviews_real.csv)
You can upload this file directly in the web UI or click **"Use demo reviews"** on the dashboard.

---

## 👥 Hackathon Submission Info
* **Event**: AMD Developer Hackathon: ACT III
* **Track**: Evolus AI Agent & AMD Hardware Acceleration
* **Evolus Workspace ID**: `5f96b97d-e488-44dc-973d-09c30c5625aa`
* **Evolus Agent ID**: `aa475004-2f3e-4b8c-93cd-0676450c5058` (`Review Insight Analyst`)
