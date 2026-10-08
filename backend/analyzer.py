import os
import pandas as pd
import json
import time
import random
from typing import List, Dict, Any, Optional
from google import genai
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from backend/.env
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

class ReviewAnalyzer:
    """
    Handles the processing of customer reviews, including cleaning,
    basic statistics, and AI-powered analysis using Google Gemini.
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

        if not self.api_key:
            # We don't raise an error here to allow the server to start,
            # but AI methods will fail if the key is missing.
            self.client = None
        else:
            self.client = genai.Client(api_key=self.api_key)

    def detect_review_column(self, df: pd.DataFrame) -> str:
        """
        Identifies the column containing review text based on common keywords.
        """
        keywords = ['review', 'text', 'comment', 'feedback', 'body']
        for col in df.columns:
            if any(kw in col.lower() for kw in keywords):
                return col
        raise ValueError("CSV must contain a review column (e.g., 'review', 'text', 'comment', 'feedback').")

    def clean_data(self, df: pd.DataFrame, column_name: str) -> pd.DataFrame:
        """
        Cleans the review data by removing NaNs, duplicates, and extra whitespace.
        """
        # Drop rows where review text is missing
        df = df.dropna(subset=[column_name])

        # Remove duplicate reviews
        df = df.drop_duplicates(subset=[column_name])

        # Strip whitespace
        df[column_name] = df[column_name].astype(str).str.strip()

        # Remove empty strings after stripping
        df = df[df[column_name] != ""]

        return df

    def calculate_basic_stats(self, df: pd.DataFrame, column_name: str) -> Dict[str, Any]:
        """
        Calculates basic statistics from the cleaned review data.
        """
        total_reviews = len(df)
        if total_reviews == 0:
            return {
                "total_reviews": 0,
                "average_length": 0,
                "review_count_by_rating": {}
            }

        avg_length = df[column_name].str.len().mean()

        # If rating column exists, calculate distribution
        rating_dist = {}
        rating_col = next((col for col in df.columns if 'rating' in col.lower()), None)
        if rating_col:
            rating_dist = df[rating_col].value_counts(normalize=True).to_dict()
            # Convert keys to string for JSON serialization
            rating_dist = {str(k): f"{v*100:.1f}%" for k, v in rating_dist.items()}

        return {
            "total_reviews": total_reviews,
            "average_length": round(avg_length, 2),
            "rating_distribution": rating_dist
        }

    def _call_gemini_with_retry(self, contents: str, config: Optional[genai.types.GenerateContentConfig] = None, max_retries: int = 5) -> Any:
        """
        Helper to call Gemini API with exponential backoff for 503 errors.
        """
        for attempt in range(max_retries):
            try:
                return self.client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=config
                )
            except Exception as e:
                error_msg = str(e).lower()
                # Retry only on 503 UNAVAILABLE or high demand errors
                if "503" in error_msg or "unavailable" in error_msg or "high demand" in error_msg:
                    if attempt == max_retries - 1:
                        raise e

                    # Exponential backoff: 2^attempt + random jitter
                    wait_time = (2 ** attempt) + random.uniform(0, 1)
                    print(f"Gemini API 503 encountered. Retrying in {wait_time:.2f}s... (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                else:
                    # Fail immediately for other errors (e.g. 400, 401, 403)
                    raise e
        return None

    def analyze_with_gemini(self, reviews: List[str]) -> Dict[str, Any]:
        """
        Sends a batch of reviews to Gemini and returns a structured analysis.
        """
        if not self.client:
            raise RuntimeError("GEMINI_API_KEY is not configured.")

        prompt = f"""
        Analyze the following customer reviews and provide a structured JSON response.

        Required JSON format:
        {{
          "sentiment": {{
            "positive": count,
            "neutral": count,
            "negative": count
          }},
          "positive_topics": [
            {{"topic": "Topic Name", "percentage": value}},
            ...
          ],
          "negative_topics": [
            {{"topic": "Topic Name", "percentage": value}},
            ...
          ],
          "common_praise": ["praise 1", "praise 2"],
          "common_complaints": ["complaint 1", "complaint 2"],
          "recommendations": ["recommendation 1", "recommendation 2"],
          "summary": "A concise overall summary of the reviews."
        }}

        Constraint: Return ONLY the raw JSON object. Do not include markdown formatting, explanations, or introductory text.

        Reviews:
        {chr(10).join(reviews)}
        """

        try:
            response = self._call_gemini_with_retry(
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            raise RuntimeError(f"AI analysis failed: {str(e)}")

    def combine_analysis_results(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Aggregates results from multiple AI batches into a single final analysis.
        """
        if not results:
            return {}

        final = {
            "sentiment": {"positive": 0, "neutral": 0, "negative": 0},
            "positive_topics": [],
            "negative_topics": [],
            "common_praise": [],
            "common_complaints": [],
            "recommendations": [],
            "summary": ""
        }

        for res in results:
            # Aggregate sentiment
            s = res.get("sentiment", {})
            final["sentiment"]["positive"] += s.get("positive", 0)
            final["sentiment"]["neutral"] += s.get("neutral", 0)
            final["sentiment"]["negative"] += s.get("negative", 0)

            # Collect topics (merging as unique lists for simplicity in this version)
            final["positive_topics"].extend(res.get("positive_topics", []))
            final["negative_topics"].extend(res.get("negative_topics", []))

            # Collect praise/complaints
            final["common_praise"].extend(res.get("common_praise", []))
            final["common_complaints"].extend(res.get("common_complaints", []))
            final["recommendations"].extend(res.get("recommendations", []))

        # Deduplicate lists and limit size
        final["common_praise"] = list(set(final["common_praise"]))[:5]
        final["common_complaints"] = list(set(final["common_complaints"]))[:5]
        final["recommendations"] = list(set(final["recommendations"]))[:5]

        # For a simple aggregation, we take the summary from the first batch
        # or we could ask Gemini to summarize the summaries.
        final["summary"] = results[0].get("summary", "No summary available.")

        # Simplify topics for aggregation (just list unique ones)
        final["positive_topics"] = list(set([t['topic'] for t in final["positive_topics"]]))[:5]
        final["negative_topics"] = list(set([t['topic'] for t in final["negative_topics"]]))[:5]

        return final

    def _chunk_reviews(self, reviews: List[str], chunk_size: int = 50) -> List[List[str]]:
        """
        Splits the list of reviews into smaller batches to avoid API token limits.
        """
        return [reviews[i : i + chunk_size] for i in range(0, len(reviews), chunk_size)]

    def process_reviews(self, file_content: bytes) -> Dict[str, Any]:
        """
        The main orchestration flow: CSV -> Clean -> Stats -> AI Analysis -> Response.
        """
        try:
            # Read CSV - try UTF-8 first, fallback to latin-1 for Excel/legacy files
            from io import BytesIO
            try:
                df = pd.read_csv(BytesIO(file_content), encoding='utf-8')
            except UnicodeDecodeError:
                df = pd.read_csv(BytesIO(file_content), encoding='latin-1')

            # 1. Validate and Detect Column
            review_col = self.detect_review_column(df)

            # 2. Clean Data
            df_cleaned = self.clean_data(df, review_col)

            # 3. Calculate Local Stats
            stats = self.calculate_basic_stats(df_cleaned, review_col)

            # 4. AI Analysis with Batching
            reviews_list = df_cleaned[review_col].tolist()
            batches = self._chunk_reviews(reviews_list)

            batch_results = []
            for batch in batches:
                batch_results.append(self.analyze_with_gemini(batch))

            # 5. Combine Results
            ai_analysis = self.combine_analysis_results(batch_results)

            # Calculate sentiment percentages for the response
            total_sentiment = sum(ai_analysis["sentiment"].values())
            sentiment_pct = {
                k: round((v / total_sentiment * 100), 2) if total_sentiment > 0 else 0
                for k, v in ai_analysis["sentiment"].items()
            }

            return {
                "success": True,
                "stats": {
                    "total_reviews": stats["total_reviews"],
                    "average_length": stats["average_length"],
                    "rating_distribution": stats["rating_distribution"]
                },
                "sentiment": sentiment_pct,
                "positive_topics": ai_analysis["positive_topics"],
                "negative_topics": ai_analysis["negative_topics"],
                "common_praise": ai_analysis["common_praise"],
                "common_complaints": ai_analysis["common_complaints"],
                "recommendations": ai_analysis["recommendations"],
                "summary": ai_analysis["summary"]
            }
        except ValueError as ve:
            return {"success": False, "error": str(ve)}
        except Exception as e:
            print(f"Internal Error in process_reviews: {e}")
            return {"success": False, "error": "An unexpected error occurred while processing the file."}

    def answer_question(self, reviews: List[str], question: str) -> str:
        """
        Uses Gemini to answer a natural language question about the provided reviews.
        """
        if not self.client:
            raise RuntimeError("GEMINI_API_KEY is not configured.")

        # Concatenate reviews into a single block of text
        context = "\n".join(reviews)

        prompt = f"""
        You are an expert customer experience analyst. Based on the provided reviews,
        answer the user's question accurately and concisely.

        Context (Customer Reviews):
        {context}

        User Question: {question}

        Answer:
        """

        try:
            response = self._call_gemini_with_retry(contents=prompt)
            return response.text
        except Exception as e:
            print(f"Error calling Gemini API for Q&A: {e}")
            raise RuntimeError(f"AI analysis failed: {str(e)}")
