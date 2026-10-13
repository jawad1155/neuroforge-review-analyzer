import httpx
import socket
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse

class ReviewProvider:
    """Base class for review scraping providers."""
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }

    def scrape(self, url: str) -> List[Dict[str, Any]]:
        raise NotImplementedError("Providers must implement scrape method")

    def is_supported(self, url: str) -> bool:
        raise NotImplementedError("Providers must implement is_supported method")

class AmazonProvider(ReviewProvider):
    def is_supported(self, url: str) -> bool:
        return "amazon" in urlparse(url).netloc.lower()

    def scrape(self, url: str) -> List[Dict[str, Any]]:
        reviews = []
        try:
            with httpx.Client(headers=self.headers, follow_redirects=True, timeout=10.0) as client:
                response = client.get(url)
                response.raise_for_status()
                soup = BeautifulSoup(response.text, "html.parser")

                # Note: Amazon selectors change frequently. These are common patterns.
                review_elements = soup.select(".review") or soup.select("[data-hook='review']")

                for el in review_elements:
                    text = el.select_one(".review-text-content") or el.select_one("[data-hook='review-body']")
                    rating = el.select_one(".review-rating") or el.select_one("[data-hook='review-star-rating']")
                    user = el.select_one(".a-profile-name")

                    if text:
                        reviews.append({
                            "name": user.text.strip() if user else "Anonymous",
                            "text": text.text.strip(),
                            "rating": self._parse_rating(rating.text) if rating else 0,
                        })
        except Exception as e:
            print(f"Amazon scrape error: {e}")
        return reviews

    def _parse_rating(self, text: str) -> float:
        try:
            # Matches "4.5 out of 5 stars" or similar
            import re
            match = re.search(r"(\d+(\.\d+)?)", text)
            return float(match.group(1)) if match else 0.0
        except:
            return 0.0

class TrustpilotProvider(ReviewProvider):
    def is_supported(self, url: str) -> bool:
        return "trustpilot" in urlparse(url).netloc.lower()

    def scrape(self, url: str) -> List[Dict[str, Any]]:
        reviews = []
        try:
            with httpx.Client(headers=self.headers, follow_redirects=True, timeout=10.0) as client:
                response = client.get(url)
                response.raise_for_status()
                soup = BeautifulSoup(response.text, "html.parser")

                review_elements = soup.select("article")

                for el in review_elements:
                    text = el.select_one(".typography--body-m") or el.select_one(".review-text")
                    rating = el.select_one(".star-rating")
                    user = el.select_one(".typography--body-s")

                    if text:
                        reviews.append({
                            "name": user.text.strip() if user else "Anonymous",
                            "text": text.text.strip(),
                            "rating": self._parse_rating(rating) if rating else 0,
                        })
        except Exception as e:
            print(f"Trustpilot scrape error: {e}")
        return reviews

    def _parse_rating(self, el) -> float:
        if not el: return 0.0
        try:
            # Trustpilot often uses data-rating attribute or number of filled stars
            rating = el.get("data-rating")
            if rating: return float(rating)
            stars = len(el.select(".star--filled"))
            return float(stars)
        except:
            return 0.0

class ReviewScraper:
    """Main entry point for URL imports with security safeguards."""
    def __init__(self):
        self.providers = [AmazonProvider(), TrustpilotProvider()]
        self.allowed_domains = ["amazon.com", "amazon.co.uk", "amazon.ca", "trustpilot.com", "uk.trustpilot.com", "us.trustpilot.com"]

    def _is_safe_url(self, url: str) -> bool:
        try:
            parsed = urlparse(url)
            if parsed.scheme not in ("http", "https"):
                return False

            hostname = parsed.hostname
            if not hostname:
                return False

            # 1. Domain Allow-list check
            if not any(domain in hostname.lower() for domain in self.allowed_domains):
                return False

            # 2. SSRF Prevention: Resolve IP and check for private ranges
            ip = socket.gethostbyname(hostname)
            if self._is_private_ip(ip):
                return False

            return True
        except Exception:
            return False

    def _is_private_ip(self, ip: str) -> bool:
        import ipaddress
        addr = ipaddress.ip_address(ip)
        return addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_multicast

    def fetch_reviews(self, url: str) -> List[Dict[str, Any]]:
        if not self._is_safe_url(url):
            raise ValueError("URL is not supported or security check failed.")

        for provider in self.providers:
            if provider.is_supported(url):
                return provider.scrape(url)

        raise ValueError("No supported scraping provider found for this URL.")
