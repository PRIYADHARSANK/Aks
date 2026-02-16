# 🚗 Smart Wrong-Way Vehicle Detection System

A real-time wrong-way vehicle detection system using **YOLOv8** for object detection, **lane direction analysis**, and a modern **React** frontend with live video streaming capabilities.

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)
![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-purple)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Technologies Used](#technologies-used)

---

## 🔍 Overview

This system analyzes highway/road surveillance video to detect vehicles traveling in the **wrong direction** on a divided road. It uses:

- **YOLOv8** for real-time vehicle detection (cars, trucks, buses, motorcycles)
- **Automatic center-line detection** to determine lane boundaries
- **Vehicle tracking** with IoU-based matching across frames
- **Direction analysis** based on lane position and movement trajectory
- **Server-Sent Events (SSE)** for real-time wrong-way detection alerts

---

## ✨ Features

### 🎯 Detection & Analysis
- Real-time vehicle detection using YOLOv8s
- Automatic road center-line detection (red divider line)
- Lane-based direction validation
- Wrong-way vehicle identification with tracking IDs

### 📡 Real-Time Streaming
- **MJPEG video stream** with annotated detection overlays
- **SSE (Server-Sent Events)** for wrong-way detection alerts
- 0.9-second delayed display for accurate confirmation

### 📊 Reporting & Export
- **Export JSON** — Download wrong-way detection data as structured JSON
- **Export PDF** — Generate professional PDF reports with detection summaries
- Live statistics dashboard (total vehicles, wrong-way count, accuracy, FPS)

### 🖥️ Modern Frontend
- Dark-themed responsive UI built with React + Tailwind CSS
- Upload Video tab with drag-and-drop support
- Wrong-Way Detection IDs table with slide-in animations
- Real-time statistics cards and progress indicators

---

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│   React Frontend │◄────│   FastAPI Backend     │◄────│  YOLOv8 Model    │
│   (Port 3001)    │     │   (Port 8000)         │     │  (yolov8s.pt)    │
│                  │     │                       │     │                  │
│  • Upload Video  │────►│  POST /upload         │     │  • Vehicle Det.  │
│  • MJPEG Stream  │◄────│  GET  /stream/{id}    │     │  • Tracking      │
│  • SSE Events    │◄────│  GET  /detections/{id}│     │  • Direction     │
│  • Export JSON   │     │                       │     │                  │
│  • Export PDF    │     │  active_detectors{}   │     │                  │
└──────────────────┘     └──────────────────────┘     └──────────────────┘
```

---

## 📁 Project Structure

```
Aks/
├── ml2/                                # Backend (Python)
│   ├── server.py                       # FastAPI server with SSE endpoints
│   ├── vehicle_direction_detector.py   # Core detection & tracking engine
│   ├── wrong_way_detection.py          # Alternative detection module
│   ├── main.py                         # CLI entry point
│   ├── requirements.txt                # Python dependencies
│   ├── yolov8s.pt                      # YOLOv8 model weights
│   └── uploads/                        # Uploaded video files
│
├── Vehicle-Wrong-Way-Detection/        # Frontend (React)
│   ├── src/
│   │   ├── App.js                      # Main application component
│   │   ├── index.css                   # Global styles + animations
│   │   ├── models/Vehicle.js           # Vehicle data model
│   │   └── utils/
│   │       ├── pdfExport.js            # PDF report generation
│   │       └── helpers.js              # Utility functions
│   ├── public/index.html               # HTML template
│   ├── package.json                    # Node.js dependencies
│   └── tailwind.config.js              # Tailwind CSS configuration
│
├── start_system.sh                     # One-command startup script
├── Documentation.md                    # System documentation
└── README.md                           # This file
```

---

## 🚀 Setup & Installation

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/PRIYADHARSANK/Aks.git
cd Aks
```

### 2. Backend Setup

```bash
cd ml2
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd Vehicle-Wrong-Way-Detection
npm install
```

### 4. Run the System

Use the one-command startup script:

```bash
chmod +x start_system.sh
./start_system.sh
```

Or run manually:

```bash
# Terminal 1 - Backend
cd ml2
python server.py

# Terminal 2 - Frontend
cd Vehicle-Wrong-Way-Detection
npm start
```

The frontend will be available at `http://localhost:3001` and the backend API at `http://localhost:8000`.

---

## 🎮 Usage

1. **Open** `http://localhost:3001` in your browser
2. **Switch** to the "Upload Video" tab
3. **Upload** a road surveillance video file
4. **Watch** the real-time MJPEG stream with detection overlays
5. **View** wrong-way vehicle IDs appearing in the detection table below
6. **Export** results as JSON or PDF using the export buttons

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/upload` | Upload a video file, returns `job_id` |
| `GET` | `/stream/{job_id}` | MJPEG video stream with detection overlays |
| `GET` | `/detections/{job_id}` | SSE stream of wrong-way detection events |
| `POST` | `/detect` | Process full video and return results (batch) |

### SSE Event Format

```json
{
  "track_id": 5,
  "lane": "Left Lane",
  "direction": "Top to Bottom",
  "frame_number": 245,
  "timestamp": 8.17
}
```

---

## 🛠️ Technologies Used

| Component | Technology |
|-----------|------------|
| **Object Detection** | YOLOv8s (Ultralytics) |
| **Video Processing** | OpenCV |
| **Backend Framework** | FastAPI |
| **Frontend Framework** | React 18 |
| **Styling** | Tailwind CSS |
| **Icons** | Lucide React |
| **Real-time Communication** | Server-Sent Events (SSE) |
| **PDF Generation** | jsPDF |
| **Language** | Python 3.10+, JavaScript (ES6+) |

---

## 📄 License

This project is for educational and research purposes.

---

## 👤 Author

**PRIYADHARSANK**

- GitHub: [@PRIYADHARSANK](https://github.com/PRIYADHARSANK)
