# Chatbot Arena Lite

A lightweight version of the Chatbot Arena for comparing model outputs.

## Project Structure

- `frontend/`: React frontend application
- `backend/`: FastAPI backend server
- `backend_env/`: Python virtual environment for the backend

## Setup and Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment using UV:
```bash
python -m venv backend_env
source backend_env/bin/activate  # On Linux/Mac
# OR
backend_env\Scripts\activate  # On Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Start the Backend Server

1. Activate the virtual environment if not already activated:
```bash
source backend_env/bin/activate  # On Linux/Mac
# OR
backend_env\Scripts\activate  # On Windows
```

2. Start the backend server:
```bash
cd backend
python main.py
```

The backend server will run on http://localhost:8000.

### Start the Frontend Application

1. In a new terminal, navigate to the frontend directory:
```bash
cd frontend
```

2. Start the frontend application:
```bash
npm start
```

The frontend application will run on http://localhost:3000.

## Features

- Compare outputs from different language models
- Vote for preferred responses
- Dashboard to view voting results (accessible at `/dashboard`)
- Database management (flush database with Ctrl+Alt+F on the dashboard)

## API Endpoints

- `GET /api/prompt?language={language}`: Get a random prompt with model responses
- `POST /api/vote`: Submit a vote
- `GET /api/languages`: Get available languages
- `GET /api/results`: Get all voting results
- `DELETE /api/flush-database`: Flush the database (remove all votes) 