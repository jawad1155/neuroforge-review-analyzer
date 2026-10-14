# NeuroForge — AI Customer Review Analyzer

NeuroForge is a web application that helps a business inspect customer reviews from a CSV file. It combines a browser-based dashboard, a Python/FastAPI backend, Pandas-based data preparation, and Groq-hosted language-model analysis to produce sentiment labels, recurring topics, praise, complaints, recommendations, and natural-language answers about the supplied reviews.

> **Implementation note:** This README describes the code in this repository ZIP. The backend currently imports `Groq` and reads `GROQ_API_KEY` / `GROQ_MODEL`. Older README text mentioning Gemini does not match the current analyzer implementation.

## Features

- Upload a CSV containing customer reviews.
- Detect a likely review-text column using column-name hints and text-column heuristics.
- Clean review rows and calculate basic statistics, including review count, average review length, and rating distribution when a rating column exists.
- Send reviews to a Groq-hosted LLM for sentiment and topic analysis.
- Process reviews in batches of 50.
- Show positive/neutral/negative sentiment, positive and negative topics, common praise, common complaints, recommendations, summary, and individual review labels.
- Ask a natural-language question using the review texts supplied by the frontend.
- Provide a dark, animated dashboard built with HTML, CSS, and JavaScript.

## Technology stack

| Area | Technology in the repository |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript |
| Backend/API | Python, FastAPI, Uvicorn |
| CSV/data handling | Pandas |
| LLM provider | Groq API through the `groq` Python package |
| Configuration | `python-dotenv` and environment variables |
| Upload handling | FastAPI `UploadFile`, `python-multipart` |
| Hosting used in the project workflow | Vercel for the API; static hosting can serve the frontend separately |

## Architecture and data flow

1. A user selects a `.csv` file in the browser.
2. `frontend/script.js` sends the file as `multipart/form-data` to `POST /analyze`.
3. `backend/main.py` reads the uploaded bytes and calls `ReviewAnalyzer.process_reviews(...)`.
4. `backend/analyzer.py` parses the CSV with Pandas, identifies and cleans the review column, calculates basic statistics, and splits the reviews into groups of 50.
5. Each group is sent to the Groq chat-completions API. The code asks for structured analysis and normalizes sentiment labels.
6. Batch results are combined and returned as JSON.
7. The frontend renders the returned values in the dashboard.
8. For Ask AI, the browser sends a question plus review texts to `POST /ask`; the backend constructs a prompt and calls Groq again.

### Embeddings, chunking, and vector storage

- **Embeddings:** No embedding model or embedding-generation pipeline is present in the reviewed code.
- **Vector database:** No vector database integration is present in the reviewed code.
- **Chunking:** `ReviewAnalyzer._chunk_reviews()` divides the review list into batches of 50 reviews. This is fixed-size batching, not semantic/token-based document chunking.
- **Retrieval/RAG:** The reviewed implementation does not implement vector retrieval or a RAG pipeline. The Ask AI endpoint passes review text in the request and includes it directly in the prompt.
- **Persistent database:** No application database integration is present in the reviewed files. The analyzed data is returned in the API response; this does not by itself establish a permanent database record. Hosting logs, request handling, or temporary runtime behavior should be assessed separately.

## Repository structure

```text
neuroforge-review-analyzer/
├── frontend/
│   ├── index.html          # Dashboard markup
│   ├── style.css           # Visual design and animations
│   └── script.js           # UI state, upload requests, API calls, rendering, visuals
├── backend/
│   ├── main.py             # FastAPI app and endpoints
│   ├── analyzer.py         # CSV processing, Groq prompts, analysis aggregation
│   └── requirements.txt    # Python dependencies
├── data/
│   └── sample_reviews.csv  # Sample data
├── sample_reviews_real.csv # Additional sample dataset
├── pyproject.toml          # Vercel Python entrypoint configuration
├── requirements.txt        # Root-level dependency list
├── .gitignore
├── LICENSE
└── README.md
```

## Requirements

- Python 3.10+ is a sensible starting point; use a Python version supported by the installed dependencies and your hosting platform.
- A Groq API key.
- Internet access for calls to the hosted LLM.
- A modern browser.

## Local setup

Run these commands from the repository root.

### 1. Create and activate a virtual environment (recommended)

**Windows PowerShell**
```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, you can use the environment's Python directly, or follow your local Python execution-policy guidance rather than changing security settings blindly.

### 2. Install dependencies

```powershell
python -m pip install -r backend/requirements.txt
```

### 3. Configure the Groq API key

Create `backend/.env` manually. Do not commit this file.

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b
```

The analyzer loads `backend/.env` and defaults `GROQ_MODEL` to `openai/gpt-oss-20b` when the model variable is absent. Use a model name currently available to your Groq account. Keep the key on the backend only; never put it in frontend JavaScript or a public repository.

### 4. Start the backend

```powershell
python -m uvicorn backend.main:app --reload
```

The API should be available locally at `http://127.0.0.1:8000`.

- API status: `http://127.0.0.1:8000/api`
- Health check: `http://127.0.0.1:8000/health`
- Interactive API docs: `http://127.0.0.1:8000/docs`

The backend code also mounts the `frontend/` directory at `/` when that directory is found, so the dashboard may be served from the same local FastAPI process.

## API endpoints

| Method | Path | Purpose | Input | Output |
|---|---|---|---|---|
| `GET` | `/api` | API status | None | JSON message and status |
| `GET` | `/health` | Health check | None | JSON health status |
| `POST` | `/analyze` | Analyze an uploaded CSV | `multipart/form-data`, field name `file` | JSON stats, sentiment, topics, recommendations, summary, reviews |
| `POST` | `/ask` | Answer a question using supplied reviews | JSON `{ "question": "...", "reviews": ["..."] }` | JSON question and answer |

### Example Ask AI request

```json
{
  "question": "What do customers complain about most?",
  "reviews": [
    "The battery life is too short.",
    "Delivery was fast and packaging was excellent."
  ]
}
```

## CSV expectations

- The upload endpoint checks that the filename ends in `.csv`.
- The analyzer tries UTF-8 first and falls back to Latin-1 if decoding fails.
- Review-column detection looks for names containing terms such as `review`, `text`, `comment`, `feedback`, or `body`, then falls back to non-empty text-like columns.
- Optional customer/name and rating columns are detected using common names such as `name`, `customer`, `user`, `author`, `rating`, `score`, and `stars`.
- Use a clear review-text column header for best results.

## Deployment notes

### Backend

The repository includes `pyproject.toml` with the Vercel Python entrypoint `backend.main:app`. Configure `GROQ_API_KEY` and optionally `GROQ_MODEL` as Vercel environment variables in the backend project's settings. Do not rely on a local `.env` file being deployed.

### Frontend

The frontend is static and can be hosted by a static hosting provider. `frontend/script.js` defines `CONFIG.API_BASE`. On localhost it targets the local backend; on a non-local host its default is an empty string, which means requests go to the same origin as the frontend. If frontend and backend are hosted on different domains, configure the frontend API base to the backend URL and configure backend CORS to allow the exact frontend origin.

**CORS security note:** `backend/main.py` currently uses `allow_origins=["*"]` together with `allow_credentials=True`. For production, restrict allowed origins to the actual frontend domains and review credential requirements.

## Limitations and future improvements

- No persistent application database is wired into the reviewed code.
- No embeddings, vector store, semantic retrieval, or RAG pipeline is wired in.
- Reviews are sent to an external LLM provider for analysis; do not upload sensitive or confidential data without checking the provider's current terms and your organization's requirements.
- Fixed batches of 50 reviews may still create large prompts if individual reviews are very long.
- The Ask AI endpoint places all supplied reviews into one prompt; large review collections may exceed model context or hosting limits.
- Add stronger file-size, content, and CSV validation on the backend; the frontend's `MAX_FILE_MB` setting alone is not a security boundary.
- Add tests, structured logging, rate limiting, authentication if needed, and clearer handling of upstream API errors.
- Consider persistent storage only if the product needs saved projects, history, or multi-user access.

## Security

- Keep `GROQ_API_KEY` secret and server-side.
- Keep `.env` out of Git; `.gitignore` excludes `.env`.
- Restrict production CORS origins.
- Treat uploaded CSV content as untrusted input.
- Avoid logging raw customer reviews or secrets.
- Review the privacy and retention policies of any external AI service before processing customer data.

## License

See [LICENSE](LICENSE) for the repository's license.
