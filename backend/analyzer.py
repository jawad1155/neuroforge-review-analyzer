import os
import json
import random
import time
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd
from dotenv import load_dotenv
from groq import Groq


# Load backend/.env
ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)


class ReviewAnalyzer:
    """Customer-review CSV analyzer powered by Groq."""

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.client = Groq(api_key=self.api_key) if self.api_key else None

    # ---------------------------------------------------------
    # CSV / DATA HELPERS
    # ---------------------------------------------------------
    def detect_review_column(self, df: pd.DataFrame) -> str:
        keywords = ("review", "text", "comment", "feedback", "body")
        skip = ("id", "date", "time", "name", "rating", "score", "votes", "type")

        def avg_len(col: str) -> float:
            values = df[col].dropna().astype(str).str.strip()
            values = values[values != ""]
            return float(values.str.len().mean()) if len(values) else 0.0

        candidates = [
            col for col in df.columns
            if isinstance(col, str)
            and any(k in col.lower() for k in keywords)
            and not any(k in col.lower() for k in skip)
            and avg_len(col) > 0
        ]

        if candidates:
            return max(candidates, key=avg_len)

        text_columns = [
            col for col in df.columns
            if df[col].dtype == object
            or pd.api.types.is_string_dtype(df[col].dtype)
        ]

        text_columns = [
            col for col in text_columns
            if avg_len(col) > 0
        ]

        if text_columns:
            best = max(text_columns, key=avg_len)

            if avg_len(best) > 20:
                return best

        raise ValueError(
            "CSV must contain a review column "
            "(e.g. 'review', 'text', 'comment', 'feedback')."
        )

    def clean_data(
        self,
        df: pd.DataFrame,
        column_name: str
    ) -> pd.DataFrame:

        df = df.copy()

        df = df.dropna(subset=[column_name])

        df[column_name] = (
            df[column_name]
            .astype(str)
            .str.strip()
        )

        df = df[df[column_name] != ""]

        df = df.drop_duplicates(
            subset=[column_name]
        )

        return df.reset_index(drop=True)

    def calculate_basic_stats(
        self,
        df: pd.DataFrame,
        column_name: str
    ) -> Dict[str, Any]:

        total = len(df)

        if total == 0:
            return {
                "total_reviews": 0,
                "average_length": 0,
                "rating_distribution": {}
            }

        average_length = round(
            float(df[column_name].str.len().mean()),
            2
        )

        rating_distribution: Dict[str, str] = {}

        rating_col = next(
            (
                c for c in df.columns
                if "rating" in str(c).lower()
            ),
            None
        )

        if rating_col:
            dist = (
                df[rating_col]
                .value_counts(normalize=True)
                .to_dict()
            )

            rating_distribution = {
                str(k): f"{float(v) * 100:.1f}%"
                for k, v in dist.items()
            }

        return {
            "total_reviews": total,
            "average_length": average_length,
            "rating_distribution": rating_distribution,
        }

    @staticmethod
    def _find_column(
        df: pd.DataFrame,
        keywords: tuple
    ) -> str | None:

        for col in df.columns:
            name = str(col).lower().strip()

            if any(k in name for k in keywords):
                return col

        return None

    @staticmethod
    def _parse_rating(value: Any) -> float:

        try:
            number = float(str(value).strip())

            return max(
                0.0,
                min(5.0, number)
            )

        except (TypeError, ValueError):
            return 0.0

    # ---------------------------------------------------------
    # GROQ
    # ---------------------------------------------------------
    def _call_groq_with_retry(
        self,
        contents: str,
        json_mode: bool = False,
        max_retries: int = 5,
    ) -> str:

        if not self.client:
            raise RuntimeError(
                "GROQ_API_KEY is not configured."
            )

        last_error = None

        for attempt in range(max_retries):

            try:

                request_data = {
                    "model": self.model_name,
                    "messages": [
                        {
                            "role": "user",
                            "content": contents
                        }
                    ],
                }

                if json_mode:
                    request_data["response_format"] = {
                        "type": "json_object"
                    }

                response = (
                    self.client
                    .chat
                    .completions
                    .create(**request_data)
                )

                return (
                    response
                    .choices[0]
                    .message
                    .content
                    or ""
                )

            except Exception as error:

                last_error = error

                message = str(error).lower()

                retryable = any(
                    token in message
                    for token in (
                        "429",
                        "500",
                        "503",
                        "rate limit",
                        "unavailable",
                        "timeout"
                    )
                )

                if (
                    not retryable
                    or attempt == max_retries - 1
                ):
                    raise

                wait_time = (
                    (2 ** attempt)
                    + random.uniform(0, 1)
                )

                print(
                    f"Groq temporary error. "
                    f"Retrying in {wait_time:.2f}s..."
                )

                time.sleep(wait_time)

        raise RuntimeError(
            f"Groq API request failed: {last_error}"
        )

    def analyze_with_groq(
        self,
        reviews: List[str]
    ) -> Dict[str, Any]:

        if not self.client:
            raise RuntimeError(
                "GROQ_API_KEY is not configured."
            )

        count = len(reviews)

        numbered = "\n".join(
            f"{i + 1}. {review}"
            for i, review in enumerate(reviews)
        )

        prompt = f"""
You are an expert customer review analyst.

Analyze exactly {count} customer reviews.

Classify EVERY review with exactly one sentiment:
positive, neutral, or negative.

The order of sentiment_labels MUST match the order
of the reviews.

Return ONLY valid JSON in this exact structure:

{{
  "sentiment_labels": [
    "positive",
    "negative",
    "neutral"
  ],

  "positive_topics": [
    {{
      "topic": "Topic Name",
      "percentage": 40
    }}
  ],

  "negative_topics": [
    {{
      "topic": "Topic Name",
      "percentage": 30
    }}
  ],

  "common_praise": [
    "praise 1"
  ],

  "common_complaints": [
    "complaint 1"
  ],

  "recommendations": [
    "recommendation 1"
  ],

  "summary": "A concise overall summary."
}}

Rules:

1. sentiment_labels MUST contain exactly {count} items.
2. Every label must be exactly positive, neutral, or negative.
3. Do not skip or add reviews.
4. Topic percentage values MUST be numbers from 0 to 100.
5. Return JSON only. No markdown.

Reviews:

{numbered}
"""

        for attempt in range(3):

            try:

                raw = self._call_groq_with_retry(
                    prompt,
                    json_mode=True
                )

                result = json.loads(raw)

                labels = result.get(
                    "sentiment_labels"
                )

                if (
                    not isinstance(labels, list)
                    or len(labels) != count
                ):

                    raise ValueError(
                        f"Expected {count} sentiment labels, "
                        f"got "
                        f"{len(labels) if isinstance(labels, list) else 'invalid'}"
                    )

                labels = [
                    str(label)
                    .strip()
                    .lower()
                    for label in labels
                ]

                if any(
                    label not in {
                        "positive",
                        "neutral",
                        "negative"
                    }
                    for label in labels
                ):

                    raise ValueError(
                        "Groq returned an invalid sentiment label."
                    )

                result["sentiment_labels"] = labels

                result["sentiment"] = {
                    "positive": labels.count("positive"),
                    "neutral": labels.count("neutral"),
                    "negative": labels.count("negative"),
                }

                return result

            except Exception as error:

                print(
                    f"Invalid Groq analysis "
                    f"(attempt {attempt + 1}/3): {error}"
                )

                if attempt == 2:
                    raise RuntimeError(
                        "Groq returned an invalid analysis "
                        "after 3 attempts."
                    ) from error

                time.sleep(1)

        raise RuntimeError(
            "AI analysis failed."
        )

    # ---------------------------------------------------------
    # RESULT COMBINATION
    # ---------------------------------------------------------
    @staticmethod
    def _merge_topics(
        results: List[Dict[str, Any]],
        key: str
    ) -> List[Dict[str, Any]]:

        """
        Merge duplicate topics while preserving percentages.

        Groq percentages describe each batch, so duplicate topics
        are combined with a batch-size-weighted average when
        batch sizes are available.
        """

        merged: Dict[str, Dict[str, Any]] = {}
        weights: Dict[str, float] = {}

        for result in results:

            labels = result.get(
                "sentiment_labels"
            ) or []

            weight = max(
                len(labels),
                1
            )

            for raw in result.get(
                key,
                []
            ) or []:

                if isinstance(raw, str):

                    name = raw.strip()
                    percent = 0.0

                elif isinstance(raw, dict):

                    name = str(
                        raw.get(
                            "topic",
                            raw.get(
                                "name",
                                ""
                            )
                        )
                    ).strip()

                    try:

                        percent = float(
                            raw.get(
                                "percentage",
                                raw.get(
                                    "percent",
                                    0
                                )
                            )
                        )

                    except (
                        TypeError,
                        ValueError
                    ):

                        percent = 0.0

                else:
                    continue

                if not name:
                    continue

                percent = max(
                    0.0,
                    min(100.0, percent)
                )

                lookup = name.casefold()

                if lookup not in merged:

                    merged[lookup] = {
                        "name": name,
                        "percent": 0.0
                    }

                    weights[lookup] = 0.0

                merged[lookup]["percent"] += (
                    percent * weight
                )

                weights[lookup] += weight

        topics = []

        for lookup, item in merged.items():

            item["percent"] = (
                round(
                    item["percent"]
                    / weights[lookup],
                    2
                )
                if weights[lookup]
                else 0
            )

            topics.append(item)

        topics.sort(
            key=lambda x: x["percent"],
            reverse=True
        )

        return topics[:5]

    def combine_analysis_results(
        self,
        results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:

        if not results:

            return {
                "sentiment": {
                    "positive": 0,
                    "neutral": 0,
                    "negative": 0
                },
                "positive_topics": [],
                "negative_topics": [],
                "common_praise": [],
                "common_complaints": [],
                "recommendations": [],
                "summary": "",
            }

        final_sentiment = {
            "positive": 0,
            "neutral": 0,
            "negative": 0
        }

        praise: List[str] = []
        complaints: List[str] = []
        recommendations: List[str] = []

        for result in results:

            sentiment = result.get(
                "sentiment",
                {}
            )

            for label in final_sentiment:

                final_sentiment[label] += int(
                    sentiment.get(
                        label,
                        0
                    ) or 0
                )

            praise.extend(
                result.get(
                    "common_praise",
                    []
                ) or []
            )

            complaints.extend(
                result.get(
                    "common_complaints",
                    []
                ) or []
            )

            recommendations.extend(
                result.get(
                    "recommendations",
                    []
                ) or []
            )

        def unique(
            items: List[Any]
        ) -> List[str]:

            seen = set()
            output = []

            for item in items:

                text = str(item).strip()

                if (
                    text
                    and text.casefold()
                    not in seen
                ):

                    seen.add(
                        text.casefold()
                    )

                    output.append(text)

            return output[:5]

        return {
            "sentiment": final_sentiment,

            "positive_topics":
                self._merge_topics(
                    results,
                    "positive_topics"
                ),

            "negative_topics":
                self._merge_topics(
                    results,
                    "negative_topics"
                ),

            "common_praise":
                unique(praise),

            "common_complaints":
                unique(complaints),

            "recommendations":
                unique(recommendations),

            "summary":
                str(
                    results[0].get(
                        "summary",
                        "No summary available."
                    )
                ).strip(),
        }

    @staticmethod
    def _chunk_reviews(
        reviews: List[str],
        chunk_size: int = 50
    ) -> List[List[str]]:

        return [
            reviews[i:i + chunk_size]
            for i in range(
                0,
                len(reviews),
                chunk_size
            )
        ]

    # ---------------------------------------------------------
    # MAIN PIPELINE
    # ---------------------------------------------------------
    def process_reviews(
        self,
        file_content: bytes
    ) -> Dict[str, Any]:

        try:

            try:

                df = pd.read_csv(
                    BytesIO(file_content),
                    encoding="utf-8"
                )

            except UnicodeDecodeError:

                df = pd.read_csv(
                    BytesIO(file_content),
                    encoding="latin-1"
                )

            review_column = (
                self.detect_review_column(df)
            )

            df_cleaned = self.clean_data(
                df,
                review_column
            )

            stats = self.calculate_basic_stats(
                df_cleaned,
                review_column
            )

            reviews_list = (
                df_cleaned[review_column]
                .astype(str)
                .tolist()
            )

            batches = self._chunk_reviews(
                reviews_list,
                50
            )

            batch_results: List[
                Dict[str, Any]
            ] = []

            review_details: List[
                Dict[str, Any]
            ] = []

            name_column = self._find_column(
                df_cleaned,
                (
                    "name",
                    "customer",
                    "user",
                    "author"
                )
            )

            rating_column = self._find_column(
                df_cleaned,
                (
                    "rating",
                    "score",
                    "stars"
                )
            )

            for batch_index, batch in enumerate(
                batches
            ):

                print(
                    f"Analyzing batch "
                    f"{batch_index + 1}/"
                    f"{len(batches)}..."
                )

                result = self.analyze_with_groq(
                    batch
                )

                batch_results.append(result)

                labels = result[
                    "sentiment_labels"
                ]

                start = batch_index * 50

                for row_number, (
                    review_text,
                    label
                ) in enumerate(
                    zip(batch, labels),
                    start=start + 1
                ):

                    row = df_cleaned.iloc[
                        row_number - 1
                    ]

                    name = (
                        str(row[name_column]).strip()
                        if name_column
                        else f"Customer {row_number}"
                    )

                    if (
                        not name
                        or name.lower() == "nan"
                    ):

                        name = (
                            f"Customer {row_number}"
                        )

                    rating = (
                        self._parse_rating(
                            row[rating_column]
                        )
                        if rating_column
                        else 0
                    )

                    review_details.append({
                        "name": name,
                        "text": str(review_text),
                        "rating": rating,
                        "sentiment": label.capitalize(),
                    })

            ai_analysis = (
                self.combine_analysis_results(
                    batch_results
                )
            )

            counts = ai_analysis[
                "sentiment"
            ]

            total_sentiment = sum(
                counts.values()
            )

            sentiment_pct = {
                key: round(
                    (value / total_sentiment) * 100,
                    2
                )
                if total_sentiment
                else 0
                for key, value
                in counts.items()
            }

            return {
                "success": True,

                "stats": {
                    "total_reviews":
                        stats["total_reviews"],

                    "average_length":
                        stats["average_length"],

                    "rating_distribution":
                        stats["rating_distribution"],
                },

                "sentiment":
                    sentiment_pct,

                "positive_topics":
                    ai_analysis[
                        "positive_topics"
                    ],

                "negative_topics":
                    ai_analysis[
                        "negative_topics"
                    ],

                "common_praise":
                    ai_analysis[
                        "common_praise"
                    ],

                "common_complaints":
                    ai_analysis[
                        "common_complaints"
                    ],

                "recommendations":
                    ai_analysis[
                        "recommendations"
                    ],

                "summary":
                    ai_analysis[
                        "summary"
                    ],

                "reviews":
                    review_details,
            }

        except ValueError as error:

            return {
                "success": False,
                "error": str(error)
            }

        except Exception as error:

            print(
                f"Internal Error in process_reviews: "
                f"{error}"
            )

            return {
                "success": False,
                "error": str(error)
            }

    # ---------------------------------------------------------
    # ASK AI
    # ---------------------------------------------------------
    def answer_question(
        self,
        reviews: List[str],
        question: str
    ) -> str:

        if not self.client:
            raise RuntimeError(
                "GROQ_API_KEY is not configured."
            )

        context = "\n".join(
            str(review)
            for review in reviews
            if str(review).strip()
        )

        prompt = f"""
You are an expert customer experience analyst.

Use ONLY the customer reviews below to answer
the user's question.

Do not invent information that is not supported
by the reviews.

Give a clear and practical answer for a business owner.

Customer Reviews:

{context}

User Question:

{question}
"""

        try:

            return self._call_groq_with_retry(
                prompt,
                json_mode=False
            )

        except Exception as error:

            print(
                f"Error calling Groq API for Q&A: "
                f"{error}"
            )

            raise RuntimeError(
                f"AI analysis failed: {str(error)}"
            ) from error