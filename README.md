# NeuroForge

### AI Customer Review Intelligence Platform

**Built for AMD Developer Hackathon: ACT III**

NeuroForge turns raw customer reviews into clear, actionable intelligence.  
Upload a CSV or drop a product URL. Get sentiment breakdown, top praise, critical complaints, and concrete recommendations — powered by Evolus AI agents and AMD Radeon inference.

---

## What It Actually Does

- **CSV Review Analysis**  
  Upload any CSV. Auto-detects the review column, cleans the data, and runs full sentiment + topic extraction.

- **Live URL Import**  
  Paste an Amazon or Trustpilot product page. Reviews are scraped safely (SSRF-protected) and analyzed instantly.

- **Conversational Q&A**  
  Ask natural language questions about your reviews. The agent answers using the actual review context.

- **Full Auth System**  
  Email verification (Brevo), JWT login, project isolation, API keys, and webhook subscriptions.

- **Real Backend Intelligence**  
  Evolus AI Agent orchestration with AMD DeepSeek-V4-Flash fallback. JSON-mode responses with retry logic.

---

## Tech Stack (What’s Actually Used)

| Layer              | Technology                                      |
|--------------------|--------------------------------------------------|
| Backend            | FastAPI + Uvicorn                               |
| AI Inference       | AMD Radeon API (`DeepSeek-V4-Flash`) + Evolus AI Agent |
| Database           | SQLAlchemy (SQLite / PostgreSQL)                |
| Auth               | JWT + bcrypt + OAuth2PasswordBearer             |
| Email              | Brevo Transactional API                         |
| Scraping           | httpx + BeautifulSoup (Amazon + Trustpilot)     |
| Frontend           | Vanilla HTML / CSS / JavaScript                 |
| Deployment         | Docker + Vercel serverless                      |

---

## Quick Start

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/jawad1155/neuroforge-review-analyzer.git
cd neuroforge-review-analyzer

cp .env.example .env
# Fill in your keys

docker compose up --build

### 4. Run the Server
```bash
python -m uvicorn backend.main:app --reload --port 8000
```
Open **`http://localhost:8000`** in your browser.

---
 ENVIRONMENT Variables 
# Required for AI
AMD_RADEON_API_KEY=your_amd_key
EVOLUS_WORKSPACE_ID=your_workspace_id
EVOLUS_AGENT_ID=your_agent_id
EVOLUS_API_KEY=your_evolus_key          # optional but preferred

# App
SECRET_KEY=generate_a_long_random_string
DATABASE_URL=sqlite:///./neuroforge.db

# Email (for signup verification)
BREVO_API_KEY=your_brevo_key
BREVO_SENDER_EMAIL=verify@neuroforge.ai
BREVO_SENDER_NAME=NeuroForge Security
  

## 📡 API Endpoints

| Method | Endpoint                        | Description                                      | Auth Required |
|--------|----------------------------------|--------------------------------------------------|---------------|
| GET    | `/health`                        | Health check + orchestration status              | No            |
| GET    | `/evolus/info`                   | Evolus workspace + AMD model info                | No            |
| POST   | `/evolus/sync`                   | Sync with Evolus workspace                       | No            |
| POST   | `/analyze`                       | Upload CSV and run full analysis                 | Optional      |
| POST   | `/import-url`                    | Scrape & analyze Amazon / Trustpilot URL         | No            |
| POST   | `/ask`                           | Ask questions about reviews (chatbot)            | No            |
| POST   | `/auth/send-verification`        | Send 6-digit email verification code             | No            |
| POST   | `/auth/verify-code`              | Verify the email code                            | No            |
| POST   | `/auth/signup`                   | Create new account                               | No            |
| POST   | `/auth/token`                    | Login → Get JWT token                            | No            |
| GET    | `/auth/me`                       | Get current user info                            | Yes           |
| POST   | `/projects`                      | Create a new project                             | Yes           |
| GET    | `/projects`                      | List user's projects                             | Yes           |
| GET    | `/projects/{project_id}/analysis`| Get analysis of a project                        | Yes           |
| GET    | `/jobs/{job_id}`                 | Check analysis job status                        | Yes           |
| POST   | `/webhooks/subscribe`            | Subscribe to analysis webhooks                   | Yes           |
| GET    | `/webhooks/subscriptions`        | List webhook subscriptions                       | Yes           |
| DELETE | `/webhooks/subscriptions/{id}`   | Delete a webhook subscription                    | Yes           |
| POST   | `/api/keys`                      | Create a new API key                             | Yes           |
| GET    | `/api/keys`                      | List API keys                                    | Yes           |
| DELETE | `/api/keys/{key_id}`             | Revoke an API key                                | Yes           |
| POST   | `/api/v1/analyze`                | Programmatic CSV analysis (API key)              | API Key       |
| GET    | `/api/v1/jobs/{job_id}`          | Get job status (API key)                         | API Key       |
| GET    | `/api/v1/projects/{id}/analysis` | Get project analysis (API key)                   | API Key       |


### 🌉 Architecture flow
|Frontend (Vanilla JS)
        ↓
FastAPI Backend
        ├── CSV cleaning + column detection
        ├── ReviewScraper (Amazon / Trustpilot + SSRF protection)
        ├── ReviewAnalyzer
        │       ├── Evolus AI Agent (primary)
        │       └── AMD Radeon DeepSeek-V4-Flash (fallback)
        ├── Auth + Projects + API Keys
        └── Webhook dispatcher



### ℹ️ Hackathon Details

Event: AMD Developer Hackathon – ACT III
Track: Evolus AI Agent + AMD Hardware Acceleration
Agent: Review Insight Analyst
