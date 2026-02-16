from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uuid
import json
import asyncio
import threading
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

# Registry to share detector instances between /stream and /detections
active_detectors = {}

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
        
        # Store detector so /detections endpoint can access it
        active_detectors[job_id] = detector
        
        # Return MJPEG stream
        def stream_and_cleanup():
            try:
                yield from detector.generate_frames()
            finally:
                active_detectors.pop(job_id, None)
        
        return StreamingResponse(
            stream_and_cleanup(),
            media_type="multipart/x-mixed-replace; boundary=frame"
        )
        
    except Exception as e:
        print(f"Error streaming job {job_id}: {e}")
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

@app.get("/detections/{job_id}")
async def stream_detections(job_id: str):
    """
    SSE endpoint that streams wrong-way detection events in real-time.
    Frontend connects via EventSource to receive detection IDs.
    """
    async def event_generator():
        # Wait briefly for the detector to be registered by /stream
        for _ in range(20):  # up to 2 seconds
            if job_id in active_detectors:
                break
            await asyncio.sleep(0.1)
        
        detector = active_detectors.get(job_id)
        if not detector:
            yield f"data: {json.dumps({'error': 'Job not found or not started'})}\n\n"
            return
        
        # Poll for new wrong-way events while detector is active
        while job_id in active_detectors:
            events = detector.get_new_wrong_way_events()
            for event in events:
                yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(0.3)  # poll every 300ms
        
        # Flush any remaining events
        if detector:
            events = detector.get_new_wrong_way_events()
            for event in events:
                yield f"data: {json.dumps(event)}\n\n"
        
        # Signal completion
        yield f"data: {json.dumps({'status': 'completed', 'stats': detector.stats if detector else {}})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
