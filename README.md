# NewsGenAI — Bangla News Title & Summarizer

Smart, fast, and privacy-conscious Bangla news title generation and summarization with a modern web UI built on Flask.

- Language: Bangla (Bengali)
- Stack: Python (Flask), HTML/CSS/JS (Bootstrap/AOS), Vanilla JS frontend
- License: MIT

> Note: The current codebase includes a working UI and Flask API with mock output for demonstration. Below you’ll find detailed, production-ready guidance and code snippets to integrate real NLP models (Hugging Face Transformers) for Bangla title generation and summarization.

---

## Contents

- Features
- Demo (UX overview)
- Architecture
- Project structure
- Quick start
- API
- Model details (recommended + how to integrate)
- Dataset and preprocessing
- Quality, performance, and deployment notes
- Roadmap
- License
- Acknowledgments

---

## Features

- Generate Bangla news titles or summaries from input content
- Clean, responsive UI with smooth animations and instant feedback
- Privacy-first: input is processed in-memory; no storage (see About modal)
- Extensible back end to plug in real NLP models
- Ready-to-run Flask server for local use

---

## Demo (UX overview)

- Paste Bangla news content into the text area
- Choose “Generate Title” or “Generate Summary”
- Click Generate
- The app displays the result with a typing animation and processing time

UI routes and interactions:
- GET / — renders the interface
- POST /predict — processes requests and returns the generated text

---

## Architecture

- Backend: Flask app exposing endpoints, ready to host model inference
- Frontend: Bootstrap-based page with animated sections and a simple form
- Static assets: CSS for theme and JS for interaction, fetch to backend API
- Model integration: Plug-in architecture (replace mock logic in `app.py` with Transformers-based inference)

---

## Project structure

```
BanglaNews-Tittle-and-Summarizer/
├─ app.py                   # Flask app (replace mock with real model inference)
├─ utils/
│  └─ preprocessing.py      # Placeholder preprocessing (replace with real cleaning/tokenization if needed)
├─ templates/
│  └─ index.html            # Main UI
├─ static/
│  ├─ css/
│  │  └─ style.css          # Styles and theme
│  └─ js/
│     └─ script.js          # Frontend logic, fetch to /predict
├─ LICENSE                  # MIT License
└─ README.md                # You are here
```

---

## Quick start

Requirements:
- Python 3.9+ (recommended 3.10/3.11)
- pip

Install dependencies (baseline UI-only):
```bash
pip install flask
```

Run the app:
```bash
python app.py
# App runs at http://127.0.0.1:5000
```

Optional (for real model integration — see “Model details” below):
```bash
pip install "transformers>=4.36" "torch>=2.1" sentencepiece accelerate
# If you plan to run on CPU-only machines:
# pip install torch --index-url https://download.pytorch.org/whl/cpu
```

---

## API

Endpoint:
- POST /predict

Request JSON:
```json
{
  "text": "আপনার বাংলা নিউজ কনটেন্ট এখানে দিন ...",
  "type": "title"   // or "summary"
}
```

Response JSON:
```json
{
  "result": "জেনারেটেড টেক্সট",
  "type": "Title" or "Summary",
  "time": "0.42s"
}
```

Error codes:
- 400 for invalid input
- 500 for unexpected server errors

---

## Model details (recommended + integration)

The codebase ships with a mock generator so you can run the full UI immediately. To enable real AI, plug in one of the following Hugging Face models (Bangla-capable) and replace the mock logic in `app.py`.

Supported approaches:
- Title generation: treat as a very-short abstractive summary (e.g., T5-style models with short `max_length`)
- Summarization: standard abstractive summarization with controllable length

Recommended models:

1) mT5 (fine-tuned on XLSum, supports Bengali)
- Model: csebuetnlp/mT5_multilingual_XLSum
- Task: summarization (works well on Bangla)
- Pros: robust multilingual summarizer backed by XLSum
- Tokenizer: SentencePiece

2) BanglaT5
- Model: csebuetnlp/banglat5
- Task: general seq2seq; can be fine-tuned for summarization or title generation
- Prompt style: T5-like; optionally prefix input with task tokens (e.g., "summarize:", "title:")

3) mT5-base or mT5-small (generic) + your fine-tuning
- If you have a custom dataset (news body → title/summary), you can fine-tune and deploy

Notes on tokenization
- T5/mT5 models use SentencePiece; ensure `sentencepiece` is installed
- For Bangla texts, keep normalization (NFC) consistent and avoid unnecessary whitespace changes

Inference tips
- Title generation: set shorter `max_length` (e.g., 12–24 tokens)
- Summarization: `max_length` 60–160 tokens, `min_length` 20–40
- Use `no_repeat_ngram_size=2` to reduce repetition
- Use `num_beams=4`–6 for quality, or `do_sample=True` for more variability

### Plug-in integration example (replace mock in app.py)

1) Add model loader (lazy init) near the top of `app.py`:
```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

MODEL_NAME_SUM = "csebuetnlp/mT5_multilingual_XLSum"  # summarization
MODEL_NAME_TITLE = "csebuetnlp/mT5_multilingual_XLSum"  # also usable for titles

_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

_tokenizer_sum = None
_model_sum = None
_tokenizer_title = None
_model_title = None

def load_models():
    global _tokenizer_sum, _model_sum, _tokenizer_title, _model_title
    if _tokenizer_sum is None or _model_sum is None:
        _tokenizer_sum = AutoTokenizer.from_pretrained(MODEL_NAME_SUM)
        _model_sum = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME_SUM).to(_device)
        _model_sum.eval()

    if _tokenizer_title is None or _model_title is None:
        _tokenizer_title = AutoTokenizer.from_pretrained(MODEL_NAME_TITLE)
        _model_title = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME_TITLE).to(_device)
        _model_title.eval()
```

2) Add a generation helper:
```python
def generate_text(model, tokenizer, text, max_length=64, min_length=12, task_prefix=None):
    # Optional: T5-style prefixes like "summarize: " or "title: "
    prompt = f"{task_prefix} {text}".strip() if task_prefix else text

    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=512  # cap input length
    ).to(_device)

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_length=max_length,
            min_length=min_length,
            num_beams=4,
            no_repeat_ngram_size=2
        )

    return tokenizer.decode(output_ids[0], skip_special_tokens=True)
```

3) Replace the mock logic in `/predict`:
```python
@app.route('/predict', methods=['POST'])
def predict():
    start_time = time.time()
    data = request.get_json(force=True)
    text = (data or {}).get('text', '').strip()
    output_type = (data or {}).get('type', '').strip().lower()

    if not text or output_type not in {'title', 'summary'}:
        return jsonify({"error": "Invalid input"}), 400

    load_models()

    if output_type == 'title':
        # Short, headline-like output
        result = generate_text(
            _model_title, _tokenizer_title, text,
            max_length=24, min_length=6, task_prefix="title:"
        )
    else:
        # Longer abstractive summary
        result = generate_text(
            _model_sum, _tokenizer_sum, text,
            max_length=120, min_length=30, task_prefix="summarize:"
        )

    return jsonify({
        "result": result,
        "type": output_type.capitalize(),
        "time": f"{(time.time() - start_time):.2f}s"
    })
```

CPU vs GPU:
- On CPU, mT5 can be slow for long inputs; consider shorter inputs, smaller models (mT5-small), or server-side GPU
- For quantization: explore `bitsandbytes` 4-bit loading with Transformers + Accelerate for reduced memory, if you’re comfortable with that stack

Caching:
- Use a simple global or LRU cache keyed by `(hash(text), type)` if repeated content is common

---

## Dataset and preprocessing

Recommended datasets for Bangla summarization:
- XLSum (Bengali split): news articles with abstractive summaries
  - Hugging Face dataset: `csebuetnlp/xlsum` (Bengali: `bn`)
- Custom datasets: scraped Bangla news sources with (title, body, summary) triplets

Preprocessing suggestions:
- Normalize Unicode (NFC) and strip extraneous whitespace
- Remove HTML tags or artifacts
- Optional sentence segmentation to control input length (keep the most informative N sentences)
- For T5-style models, prepend task tokens/prefixes (e.g., `summarize:` / `title:`)

Training (if you fine-tune):
- Start with mT5-small/base or BanglaT5, fine-tune using Hugging Face Trainer
- Hyperparameters (starting point):
  - LR: 3e-5
  - Batch size: 8–16 (gradient accumulation if needed)
  - Max input length: 512
  - Max target length:
    - Title: 12–24
    - Summary: 60–160
  - Early stopping on validation ROUGE-L/BLEU

---

## Quality, performance, and deployment notes

- Length control: set `max_length`/`min_length` carefully per task
- Repetition control: `no_repeat_ngram_size=2` is a good default
- Diversity: add `temperature`/`top_k`/`top_p` for more creative titles
- Safety: avoid storing user content (current app does not store data)
- Deployment:
  - Gunicorn + gevent/uvicorn workers behind Nginx
  - Enable health checks and warm-start model loading
  - Optionally add a `/healthz` endpoint

Example Gunicorn command:
```bash
gunicorn -w 2 -k gthread -t 120 -b 0.0.0.0:8000 app:app
```

---

## Roadmap

- Replace mock inference with real mT5/BanglaT5 integration
- Add requirements.txt and optional GPU Dockerfile
- Add batching and server-side caching
- Add basic rate limiting and request size limits
- Provide example notebooks for fine-tuning on custom datasets
- Add evaluation scripts (ROUGE, BLEU) and sample test data

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Acknowledgments

- Hugging Face Transformers (model hosting and tooling)
- csebuetnlp (BanglaT5, mT5 XLSum fine-tunes)
- XLSum authors and contributors

---

## Maintainer

- Author: Kawshik Ahmed Ornob (@kawshik-ornob8)

Contributions and suggestions are welcome!
