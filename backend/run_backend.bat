@echo off
REM Start the FastAPI backend on Windows.
REM Run this from the backend\ folder.

IF NOT EXIST venv (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

IF NOT EXIST .env (
    echo Creating .env from .env.example ...
    copy .env.example .env
)

echo Starting backend on http://localhost:8000 ...
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
