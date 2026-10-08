# NeuroForge — AI Customer Review Analyzer

AI-powered customer review analyzer that uses sentiment analysis and AI to identify customer opinions, common complaints, positive feedback, and actionable product insights from reviews. Built for the AMD Developer Hackathon: ACT III.

## 🚀 Backend Implementation

The backend is built with **FastAPI**, **Pandas**, and **Google Gemini AI**.

### Installation

1. **Clone the repository** (if not already done).
2. **Install dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. **Environment Setup**:
   - Create a `.env` file in the `backend/` directory:
     ```bash
     cp backend/.env.example backend/.env
     ```
   - Open `backend/.env` and add your Gemini API key:
     ```env
     GEMINI_API_KEY=your_actual_api_key_here
     GEMINI_MODEL=gemini-2.0-flash
     ```

### Running the Backend

From the project root, run:
```bash
uvicorn backend.main:app --reload
```
The API will be available at `http://127.0.0.1:8000`.

### API Endpoints

| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API status check | None |
| `GET` | `/health` | Health check | None |
| `POST` | `/analyze` | Analyze CSV reviews | `multipart/form-data` (field: `file`) |
| `POST` | `/ask` | Ask a question about reviews | `JSON` (`question`, `reviews`) |

### Architecture

- **FastAPI**: Handles routing, validation, and CORS.
- **Pandas**: Cleans the CSV data and calculates basic statistics (count, average length, rating distribution).
- **Google Gemini AI**: Performs deep semantic analysis (sentiment, topic extraction, recommendations) and answers natural language questions.

## 🛠 Future AMD / ROCm Optimization

Current implementation uses the Gemini Cloud API for rapid prototyping. To optimize for AMD hardware:
- **Local LLM**: Replace Gemini API with a local model (e.g., Llama 3 or Mistral) hosted via vLLM or Ollama.
- **ROCm Acceleration**: Use ROCm-compatible PyTorch/TensorFlow to accelerate inference on AMD Instinct or Radeon GPUs.
- **GPU Batching**: Implement custom GPU-accelerated batch processing for larger datasets.
- **AMD Instinct Environment**: Deploy on an AMD-powered cloud instance for maximum throughput.
