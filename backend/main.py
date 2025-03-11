import json
import random
import csv
import os
import sqlite3
from datetime import datetime

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global list to hold prompts loaded from the jsonl file
PROMPTS = []

# Default model weights, can be tuned as needed
MODEL_WEIGHTS = {
    "gen_Gemini-Flash-1.5-8B": 1,
    "gen_Llama-3.2-11B-Vision-Instruct": 1,
    "gen_Pixtral-12B": 1,
    "gen_Qwen2-VL-7B-Instruct": 1,
    "gen_Qwen2.5-VL-7B-Instruct": 1,
    "gen_Pangea-7B": 1,
    "gen_Molmo-7B-D": 1
}

# Directory containing JSONL files
JSONL_DIR = "backend/mAyaVisionBench-Qwen2-VL-7B-Instruct-Qwen2.5-VL-7B-Instruct-Gemini-Flash-1.5-8B-Pixtral-12B-Llama-3.2-11B-Vision-Instruct-Llama-3.2-90B-Vision-Instruct-Pangea-7B-Molmo-7B-D-paligemma2-10b-mix-448"

# Load prompts from jsonl file on startup
@app.on_event("startup")
def startup_events():
    # Load prompts for debugging (if needed)
    global PROMPTS
    file_path = os.path.join(os.path.dirname(__file__), "prompts.jsonl")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    record = json.loads(line.strip())
                    PROMPTS.append(record)
                except Exception as e:
                    print(f"Error parsing line: {line} | Error: {e}")
        print(f"Loaded {len(PROMPTS)} prompts.")
    else:
        print(f"Prompt file not found at {file_path}")

    init_db()

# Helper function for weighted random choice without replacement

def weighted_choice(choices):
    # choices: list of tuples (item, weight)
    total = sum(weight for item, weight in choices)
    r = random.uniform(0, total)
    upto = 0
    for item, weight in choices:
        upto += weight
        if upto >= r:
            return item
    # Fallback
    return choices[0][0]


def sample_two_models(record):
    # Get available model keys that start with 'gen_' and have a non-empty value
    models = [key for key in record.keys() if key.startswith("gen_") and record.get(key)]
    if len(models) < 2:
        raise Exception("Not enough models available in the selected prompt.")
    weighted_models = [(m, MODEL_WEIGHTS.get(m, 1)) for m in models]
    # First choice
    first = weighted_choice(weighted_models)
    # Remove the first choice and re-calculate weights
    remaining = [(m, w) for (m, w) in weighted_models if m != first]
    second = weighted_choice(remaining)
    return first, second

# Test prompt data for debugging
TEST_PROMPT = {
    "prompt_id": "test_123",
    "text": "Describe what's happening in this image of a cat sitting on a windowsill.",
    "image": "https://placekitten.com/800/600",  # Placeholder cat image for testing
    "model1": {
        "name": "gen_Gemini-Flash-1.5-8B",
        "response": "In this image, a curious cat is perched on a windowsill, gazing out at the world beyond. The sunlight streaming through the window creates a warm, cozy atmosphere, highlighting the cat's fur and casting gentle shadows. The cat appears relaxed and content in its favorite observation spot."
    },
    "model2": {
        "name": "gen_Llama-3.2-11B-Vision-Instruct",
        "response": "The photograph shows a domestic cat sitting on a wooden windowsill. The cat's posture is alert yet comfortable, with its tail neatly wrapped around its body. Through the window, there appears to be a garden or outdoor scene, which has captured the cat's attention. The natural lighting in the image creates a peaceful, homey atmosphere."
    }
}

# GET endpoint to fetch a random prompt and two model responses
@app.get("/api/prompt")
def get_prompt(language: str = Query(None, description="Language filter for prompt")):
    if language is None:
        raise HTTPException(status_code=400, detail="Language must be specified")

    file_name = f"{language}.jsonl"
    file_path = os.path.join(JSONL_DIR, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Prompt file for language '{language}' not found")

    with open(file_path, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]
    if not lines:
        raise HTTPException(status_code=404, detail="No prompts available in the file")

    random_line = random.choice(lines)
    try:
        prompt_record = json.loads(random_line)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing json prompt: {e}")

    # Use 'index' as prompt_id if available, otherwise generate a random id
    prompt_id = str(prompt_record.get("index", random.randint(1000, 9999)))

    text = prompt_record.get("prompt", "")

    images_val = prompt_record.get("images", "")
    if isinstance(images_val, list) and images_val:
        image = images_val[0]
    elif isinstance(images_val, str):
        image = images_val
    else:
        image = ""

    try:
        model1_key, model2_key = sample_two_models(prompt_record)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sampling models: {e}")

    model1 = {
        "name": model1_key,
        "response": prompt_record.get(model1_key, "")
    }
    model2 = {
        "name": model2_key,
        "response": prompt_record.get(model2_key, "")
    }

    return {
        "prompt_id": prompt_id,
        "text": text,
        "image": image,
        "model1": model1,
        "model2": model2
    }

# Pydantic model for vote submission
class VoteRequest(BaseModel):
    prompt_id: str
    prompt_text: str = None
    timestamp: str
    model1: str
    model2: str
    winner: str  # Expected values: 'model1', 'model2', 'tie', 'both_bad'
    language: str = None

@app.post("/api/vote")
def submit_vote(vote: VoteRequest):
    try:
        # Convert model1/model2 vote to A/B format
        vote_value = vote.winner
        if vote_value == "model1":
            vote_value = "A"
        elif vote_value == "model2":
            vote_value = "B"
        # Keep 'tie' and 'both_bad' as they are
            
        conn = sqlite3.connect("results.db")
        c = conn.cursor()
        c.execute(
            "INSERT INTO votes (prompt_id, timestamp, language, prompt, generation_a, generation_b, vote) VALUES (?,?,?,?,?,?,?)",
            (vote.prompt_id, vote.timestamp, vote.language, vote.prompt_text, vote.model1, vote.model2, vote_value)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record vote: {e}")
    return {"status": "Vote recorded"}

# Initialize the SQLite database
def init_db():
    conn = sqlite3.connect("results.db")
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prompt_id TEXT,
            timestamp TEXT,
            language TEXT,
            prompt TEXT,
            generation_a TEXT,
            generation_b TEXT,
            vote TEXT
        )
    ''')
    conn.commit()
    conn.close()

@app.get("/api/languages")
def get_languages():
    try:
        files = os.listdir(JSONL_DIR)
        languages = [file.split('.')[0] for file in files if file.endswith('.jsonl')]
        # Remove 'aya23' from the list of languages if it exists
        if 'aya23' in languages:
            languages.remove('aya23')
        return {"languages": languages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading languages: {e}")

@app.get("/api/results")
def get_results():
    try:
        conn = sqlite3.connect("results.db")
        c = conn.cursor()
        c.execute("SELECT id, prompt_id, timestamp, language, prompt, generation_a, generation_b, vote FROM votes ORDER BY timestamp DESC")
        rows = c.fetchall()
        conn.close()
        results = []
        for row in rows:
            results.append({
                "id": row[0],
                "prompt_id": row[1],
                "timestamp": row[2],
                "language": row[3],
                "prompt": row[4],
                "generation_a": row[5],
                "generation_b": row[6],
                "vote": row[7]
            })
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve results: {e}")

@app.delete("/api/flush-database")
def flush_database():
    try:
        conn = sqlite3.connect("results.db")
        c = conn.cursor()
        c.execute("DELETE FROM votes")
        conn.commit()
        conn.close()
        return {"message": "Database flushed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to flush database: {e}") 