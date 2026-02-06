from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uuid
import json
from pathlib import Path
from vehicle_direction_detector import VehicleDirectionDetector

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("processed")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Mount outputs so frontend can access them
app.mount("/processed", StaticFiles(directory="processed"), name="processed")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/detect")
async def detect_vehicle_direction(file: UploadFile = File(...)):
    """
    Original endpoint: Process full video and return result.
    Kept for backward compatibility or batch processing.
    """
    job_id = str(uuid.uuid4())
    input_video_path = UPLOAD_DIR / f"{job_id}_{file.filename}"
    
    with input_video_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    output_video_path = OUTPUT_DIR / f"{job_id}_output.mp4"
    summary_path = OUTPUT_DIR / f"{job_id}_summary.json"
    
    try:
        detector = VehicleDirectionDetector(
            video_path=str(input_video_path),
            center_x=640,
            min_movement=20
        )
        stats = detector.process_video(output_path=str(output_video_path), save_summary=False, show_preview=False)
        detector.save_summary(str(summary_path))
        
        server_url = "http://localhost:8000"
        return JSONResponse(content={
            "job_id": job_id,
            "status": "completed",
            "video_url": f"{server_url}/processed/{output_video_path.name}",
            "stats": stats
        })
    except Exception as e:
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """
    Endpoint for streaming: Just upload and get ID.
    Frontend will then call /stream/{job_id}
    """
    job_id = str(uuid.uuid4())
    input_video_path = UPLOAD_DIR / f"{job_id}_{file.filename}"
    
    with input_video_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return JSONResponse(content={"job_id": job_id, "filename": file.filename})

@app.get("/stream/{job_id}")
async def stream_processing(job_id: str):
    """
    Streams the processing of the video as an MJPEG stream.
    """
    # Find the file associated with this job_id
    # In a real app, use a DB. Here we scan the dir or assume naming convention
    try:
        files = list(UPLOAD_DIR.glob(f"{job_id}_*"))
        if not files:
            raise HTTPException(status_code=404, detail="Job not found")
        
        input_video_path = files[0]
        
        detector = VehicleDirectionDetector(
            video_path=str(input_video_path),
            center_x=640,
            min_movement=20
        )
        
        # Return MJPEG stream
        # This will block a worker until processing is done, but gives real-time feed
        return StreamingResponse(
            detector.generate_frames(),
            media_type="multipart/x-mixed-replace; boundary=frame"
        )
        
    except Exception as e:
        print(f"Error streaming job {job_id}: {e}")
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
