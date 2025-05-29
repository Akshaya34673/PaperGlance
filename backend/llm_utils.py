import requests
import re
import logging
import uuid
import time
from collections import deque
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Model for Google AI Studio
MODEL = "gemini-1.5-flash"

from api_keys import API_KEYS

# Initialize a deque to cycle through API keys
USED_KEYS = deque(API_KEYS, maxlen=len(API_KEYS))

def clean_summary(summary):
    """
    Clean the raw summary by removing markdown, bullets, and irrelevant content.
    """
    # Remove markdown headers
    summary = re.sub(r"#+", "", summary)

    # Remove bold and italic markers
    summary = re.sub(r"\*\*(.*?)\*\*", r"\1", summary)
    summary = re.sub(r"\*(.*?)\*", r"\1", summary)

    # Normalize bullet points
    summary = re.sub(r"^\s*[\*•-]\s*", "- ", summary, flags=re.MULTILINE)

    # Remove HTML tags and chatty phrases
    summary = re.sub(r"I hope this summary.|<\s*/?\s*(p|h[1-6]|li|ul)\s*>", "", summary, flags=re.IGNORECASE)
    summary = re.sub(r"(?i)(here is a summary|this summary provides|in summary|please note)", "", summary)

    # Normalize whitespace
    summary = re.sub(r"\n{2,}", "\n\n", summary)
    return summary.strip()

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(requests.exceptions.RequestException),
    before_sleep=lambda retry_state: logger.info(f"Retrying request... Attempt {retry_state.attempt_number}")
)
def make_gemini_request(prompt, api_key, timeout=30):
    """Make a request to the Gemini API with a given prompt, with retry logic."""
    url = f"https://generativelanguage.googleapis.com/v1/models/{MODEL}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": f"You are an expert academic summarizer. Strictly adhere to the word count and structure specified. {prompt}"
                    }
                ]
            }
        ]
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=timeout)
        response.raise_for_status()
        raw_result = response.json()
        if "candidates" in raw_result and raw_result["candidates"]:
            return raw_result["candidates"][0]["content"]["parts"][0]["text"]
        else:
            raise ValueError("No valid candidates in response")
    except requests.exceptions.RequestException as e:
        logger.warning(f"Request failed with key {api_key[:8]}...: {str(e)}")
        raise
    except (KeyError, IndexError, ValueError) as e:
        logger.warning(f"Invalid response format with key {api_key[:8]}...: {str(e)}")
        raise

def summarize_with_llm(chunks, summary_length="medium"):
    """
    Summarize a research paper using Google AI Studio's Gemini API, rotating keys on failure.
    """
    logger.debug(f"Number of chunks for summary: {len(chunks)}")
    logger.debug(f"Summarizing with length: {summary_length}")

    if summary_length.lower() == "short":
        prompt = (
            "Provide a concise summary of the following research paper in 1-2 sentences, focusing on the main findings:\n\n"
            + "\n---\n".join(chunks[:5])
        )
    elif summary_length.lower() == "medium":
        prompt = (
            "Summarize the following research paper in 2-3 short paragraphs (150-250 words), highlighting key findings and contributions:\n\n"
            + "\n---\n".join(chunks[:10])
        )
    elif summary_length.lower() == "long":
        chunk_limit = min(len(chunks), 30)
        prompt = (
            "Summarize the following research paper in 6-8 detailed paragraphs (600-800 words total), with headings: Introduction, Methodology, Results, Discussion, Implications, Conclusion, Limitations, and Future Work. "
            "Provide comprehensive details, elaborate on each section, and avoid repetition. Use all available excerpts to generate a thorough summary:\n\n"
            + "\n---\n".join(chunks[:chunk_limit])
        )
    else:
        logger.warning(f"Invalid summary_length '{summary_length}', defaulting to medium")
        prompt = (
            "Summarize the following research paper in 2-3 short paragraphs, focusing on key findings:\n\n"
            + "\n---\n".join(chunks[:5])
        )

    # Try each API key until one succeeds
    for i in range(len(USED_KEYS)):
        api_key = USED_KEYS[0]
        logger.debug(f"Attempting summary with API key: {api_key[:8]}...")
        try:
            raw_summary = make_gemini_request(prompt, api_key)
            logger.debug(f"Raw summary for length {summary_length} (full length: {len(raw_summary)} chars): {raw_summary[:300]}...")
            cleaned = clean_summary(raw_summary)
            return format_summary(cleaned, summary_length=summary_length)
        except Exception as e:
            logger.warning(f"Request failed with key {api_key[:8]}...: {str(e)}")
            USED_KEYS.rotate(-1)  # Rotate to the next key
            if i == len(USED_KEYS) - 1:  # If this was the last key
                logger.error("All API keys failed.")
                raise Exception("All API keys failed after trying all available keys.")
            time.sleep(1)  # Small delay before retrying with the next key
            continue

def ask_question(question, top_chunks):
    """
    Answer a question based on research paper excerpts using the Gemini API, rotating keys on failure.
    """
    short_prompt_keywords = ["title", "author", "journal", "date", "conference"]
    if any(k in question.lower() for k in short_prompt_keywords):
        prompt = (
            f"Provide a brief and direct answer (max 50 words) to the following question based on the paper excerpts:\n\n"
            f"Question: {question}\n\n"
            f"Excerpts:\n" + "\n---\n".join(top_chunks)
        )
    else:
        prompt = (
            f"Answer the following question based on the provided research paper excerpts. "
            f"Focus on the most critical information, using concise bullet points under clear section headings. "
            f"Limit the response to 100 words and avoid unnecessary elaboration:\n\n"
            f"Question: {question}\n\n"
            f"Excerpts:\n" + "\n---\n".join(top_chunks)
        )

    # Try each API key until one succeeds
    for i in range(len(USED_KEYS)):
        api_key = USED_KEYS[0]
        logger.debug(f"Attempting question with API key: {api_key[:8]}...")
        try:
            raw_answer = make_gemini_request(prompt, api_key)
            logger.debug(f"Raw answer: {raw_answer[:100]}...")
            return format_summary(clean_summary(raw_answer))
        except Exception as e:
            logger.warning(f"Request failed with key {api_key[:8]}...: {str(e)}")
            USED_KEYS.rotate(-1)
            if i == len(USED_KEYS) - 1:
                logger.error("All API keys failed.")
                raise Exception("All API keys failed after trying all available keys.")
            time.sleep(1)
            continue

def format_summary(summary, summary_length="medium"):
    """
    Format the cleaned summary into plain text with structured, concise sections.
    """
    # Don't truncate for medium or long summaries
    if summary_length in ["medium", "long"]:
        return summary.strip()

    # Only truncate for short summary
    words = summary.split()
    if len(words) > 100:
        summary = " ".join(words[:100]) + "..."

    sections = re.split(r"(?<=\):\s)", summary)
    formatted = ""

    for section in sections:
        section = section.strip()
        if not section:
            continue

        match = re.match(r"([A-Za-z\s]+):\s*(.*)", section, re.DOTALL)
        if match:
            key, content = match.groups()
            key = key.strip()
            content = content.strip()
            formatted += f"{key}:\n"
            lines = [line.strip() for line in content.split("\n") if line.strip()]
            for line in lines:
                if line.startswith("-") or line.startswith("•"):
                    formatted += f"- {line[1:].strip()}\n"
                else:
                    formatted += f"{line}\n"
        else:
            lines = [line.strip() for line in section.split("\n") if line.strip()]
            for line in lines:
                if line.startswith("-") or line.startswith("•"):
                    formatted += f"- {line[1:].strip()}\n"
                else:
                    formatted += f"{line}\n"

    return formatted.strip()