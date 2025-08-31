# Social Media Content Analyzer

A full-stack web application designed to help content creators, marketers, and social media managers optimize their posts for higher engagement. Upload a screenshot or PDF of your content, and the tool will extract the text and provide instant, actionable feedback based on key social media best practices.

## Features

-   **Multi-Format Support:** Extract text from uploaded PNG/JPEG images (using OCR) and PDF documents.
-   **Heuristic Analysis:** Get instant feedback on key engagement metrics:
    -   **Post Length:** Suggests optimal content length for maintaining audience attention.
    -   **Emoji Count:** Analyzes visual appeal and suggests effective emoji usage.
    -   **Hashtag Analysis:** Evaluates the number of hashtags and recommends an optimal count for better reach.
-   **Engagement Score:** Receive a simple, overall score (0-100) for your content's potential.
-   **Clean & Responsive UI:** An intuitive React interface that works seamlessly on desktop and mobile.

## Live Demo

The application is deployed on Render and can be accessed at:  
**[Live Demo](https://social-media-analyzer-frontend-omsr.onrender.com/)**

> **Note:** The server may take 20-30 seconds to respond on the first request due to free tier limitations.

## Technology Stack

### Frontend
-   **React:** A JavaScript library for building user interfaces.
-   **Axios:** A promise-based HTTP client for making API requests.
-   **CSS3:** For styling and responsive design.

### Backend
-   **Node.js:** A JavaScript runtime built on Chrome's V8 engine.
-   **Express.js:** A minimal and flexible Node.js web application framework.

### Key Libraries & Services
-   **Tesseract.js:** A powerful OCR engine used to extract text from images.
-   **pdf-parse:** A lightweight library to extract text from PDF files.
-   **Jest:** A delightful JavaScript testing framework used to validate the analysis logic.

## Project Structure

```
social-media-content-analyzer/
│
├── 📁 backend/
│ ├── 📁 services/
│ │ ├── ocrService.js
│ │ └── pdfParser.js
│ ├── 📁 tests/
│ │ └── analyzer.test.js
│ ├── 📁 uploads/
│ ├── package.json
│ └── server.js
│
├── 📁 frontend/ 
│ ├── 📁 public/
│ │ └── index.html
│ ├── 📁 src/
│ │ ├── index.js
│ │ ├── index.css
│ │ ├── Dashboard.js
│ │ ├── Dashboard.css
│ │ ├── MediaUpload.js
│ │ └── MediaUpload.css
│ ├── .env
│ ├── .env.production
│ └── package.json
│
└── README.md
```

## Local Development

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the development server
npm start
```

Server runs on http://localhost:5000

### Frontend Setup

Open a new terminal window in the project root directory

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

Frontend application will automatically open on http://localhost:3000

### Environment Setup

Ensure your environment variables are configured:

Backend (backend/.env):
```env
PORT=5000
```

Frontend (frontend/.env):
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_NAME=Social Media Analyzer
REACT_APP_VERSION=1.0.0
```

### Running Tests

```bash
cd backend
npm test
```
