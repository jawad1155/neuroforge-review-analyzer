import sys
import os
from pathlib import Path

# Add repository root to Python path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Mark serverless environment
os.environ["VERCEL"] = "1"

# Production environment variable defaults
os.environ.setdefault("AMD_RADEON_API_KEY", "rc-cd442321951649ca3db16dd10e12b87d1f2a7b5924d97b40")
os.environ.setdefault("EVOLUS_WORKSPACE_ID", "5f96b97d-e488-44dc-973d-09c30c5625aa")
os.environ.setdefault("EVOLUS_AGENT_ID", "aa475004-2f3e-4b8c-93cd-0676450c5058")
os.environ.setdefault("EVOLUS_API_BASE_URL", "https://api.evolus.ai/api/v1")
os.environ.setdefault("EVOLUS_API_KEY", "evo_ZqTdAQpQBn6A0gsdXKb9PuJZejGcl913mLMmXbUe")
os.environ.setdefault("DATABASE_URL", "postgresql://postgres:FwnMcTjKOmm9l3wX@db.hmffidbzucghrglpodwu.supabase.co:5432/postgres")

# Expose ASGI application for Vercel Python runtime
from backend.main import app
