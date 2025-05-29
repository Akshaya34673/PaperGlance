import fitz
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from llm_utils import USED_KEYS, logger, ask_question
import io

CHUNK_SIZE = 150
CHUNK_OVERLAP = 25
embedder = SentenceTransformer('all-MiniLM-L6-v2')

def chunk_text(text):
    """
    Split text into overlapping chunks.
    """
    words = text.split()
    return [
        " ".join(words[i:i + CHUNK_SIZE])
        for i in range(0, len(words), CHUNK_SIZE - CHUNK_OVERLAP)
    ]

def process_pdf(file_path):
    """
    Process a PDF from a file path into chunks and create a FAISS index for embeddings.
    Returns chunks and the FAISS index.
    """
    # Open PDF from file path
    doc = fitz.open(file_path)
    full_text = "".join(page.get_text() for page in doc)
    chunks = chunk_text(full_text)
    embeddings = embedder.encode(chunks)

    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(np.array(embeddings))
    doc.close()
    return chunks, index

def process_pdf_from_content(file_content):
    """
    Process a PDF from binary content into chunks and create a FAISS index for embeddings.
    Returns chunks and the FAISS index.
    """
    # Open PDF from binary content
    doc = fitz.open(stream=file_content, filetype="pdf")
    full_text = "".join(page.get_text() for page in doc)
    chunks = chunk_text(full_text)
    embeddings = embedder.encode(chunks)

    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(np.array(embeddings))
    doc.close()
    return chunks, index

def get_top_chunks(query, chunks, index, top_k=5):
    """
    Retrieve the top_k most relevant chunks for a query using FAISS.
    """
    query_vec = embedder.encode([query])
    D, I = index.search(np.array(query_vec), top_k)
    return [chunks[i] for i in I[0]]

def answer_with_rag(query, chunks, index, top_k=5):
    """
    Answer a question using RAG, rotating API keys on failure.
    """
    top_chunks = get_top_chunks(query, chunks, index, top_k)
    logger.debug(f"Retrieved {len(top_chunks)} top chunks for query: {query}")

    # Try each API key until one succeeds
    for i in range(len(USED_KEYS)):
        api_key = USED_KEYS[0]
        logger.debug(f"Attempting answer with API key: {api_key[:8]}...")
        try:
            response = ask_question(query, top_chunks)  # Delegate to llm_utils.ask_question
            logger.debug(f"Answer retrieved successfully with key {api_key[:8]}...")
            return response
        except Exception as e:
            logger.warning(f"Request failed with key {api_key[:8]}...: {str(e)}")
            USED_KEYS.rotate(-1)  # Rotate to the next key
            if i == len(USED_KEYS) - 1:  # If this was the last key
                logger.error("All API keys failed.")
                raise Exception("All API keys failed after trying all available keys.")
            time.sleep(1)  # Small delay before retrying with the next key
            continue