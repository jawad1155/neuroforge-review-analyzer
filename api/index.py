import sys
import os
from pathlib import Path

# Add repository root to Python path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Mark serverless environment
os.environ["VERCEL"] = "1"

# Expose ASGI application for Vercel Python runtime
from backend.main import app
