# Wrong-Way Vehicle Detection Algorithm

## Overview
This algorithm detects vehicles moving in the wrong direction on a divided road using YOLOv8 object detection and tracking.

## Algorithm Logic

### 1. **Lane Division Detection**
```
IF dividing_line_x is not provided:
    - Convert frame to HSV color space
    - Detect RED color (the dividing line in your image)
    - Find vertical contours
    - Select the longest vertical line as dividing boundary
    - Store X-coordinate of dividing line
ELSE:
    - Use provided X-coordinate
```

### 2. **Vehicle Detection & Tracking**
```
FOR each frame:
    - Run YOLOv8 detection with tracking enabled
    - Filter only vehicle classes (car, motorcycle, bus, truck)
    - Extract bounding boxes and track IDs
    - Calculate center point of each vehicle
```

### 3. **Direction Determination**
```
FOR each tracked vehicle:
    - Store position history (last 30 positions)
    
    IF track_length >= 10 frames:
        - Get first_position and last_position
        - Calculate Y-axis movement: Δy = last_y - first_y
        
        IF |Δy| < threshold (20 pixels):
            direction = 0  (stationary/unclear)
        ELSE IF Δy < 0:
            direction = 1  (moving UP = bottom-to-top = CORRECT)
        ELSE IF Δy > 0:
            direction = -1 (moving DOWN = top-to-bottom = WRONG)
```

### 4. **Wrong-Way Detection**
```
Based on your requirements:
- Left Lane (x < dividing_line_x): CORRECT = bottom-to-top (↑)
- Right Lane (x >= dividing_line_x): CORRECT = bottom-to-top (↑)

Detection Logic:
FOR each vehicle:
    - Get lane: IF center_x < dividing_line_x THEN "LEFT" ELSE "RIGHT"
    - Get direction from step 3
    
    IF direction == -1 (moving top-to-bottom):
        ⚠️ VIOLATION DETECTED - Wrong way vehicle!
        - Mark vehicle as wrong-way
        - Record violation details
        - Draw RED bounding box
    ELSE IF direction == 1 (moving bottom-to-top):
        ✓ CORRECT direction
        - Draw GREEN bounding box
    ELSE:
        ? Still detecting direction
```

## Key Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `min_track_length` | 10 frames | Minimum frames needed to determine direction |
| `direction_threshold` | 20 pixels | Minimum movement to count as "moving" |
| `track_history_length` | 30 frames | Number of positions to remember |
| `confidence_threshold` | 0.5 | YOLOv8 detection confidence |

## Visual Indicators

- **RED box + RED track**: Wrong-way vehicle (moving top-to-bottom ↓)
- **GREEN box + GREEN track**: Correct-way vehicle (moving bottom-to-top ↑)
- **Label format**: `ID:{track_id} {LANE} {DIRECTION}`

## Direction Logic Summary

```
Camera View (Top-down perspective):
═══════════════════════════════════════
        ↑ CORRECT          ↑ CORRECT
        ↑ (direction=1)    ↑ (direction=1)
        │                  │
LEFT    │   DIVIDING      │    RIGHT
LANE    │   LINE (RED)    │    LANE
        │                  │
        ↓ WRONG!           ↓ WRONG!
        ↓ (direction=-1)   ↓ (direction=-1)
═══════════════════════════════════════

Bottom-to-top (Y decreasing) = CORRECT ✓
Top-to-bottom (Y increasing) = WRONG ✗
```

## Output Information

For each violation, the system records:
- Track ID
- Lane (LEFT/RIGHT)
- Position coordinates
- Frame number
- Detection confidence

## Performance Considerations

1. **Track Persistence**: Vehicles are tracked across frames using unique IDs
2. **History Buffer**: Limited to 30 positions to manage memory
3. **Auto-cleanup**: Tracks are automatically removed when vehicles leave the scene
4. **Real-time Processing**: Optimized for video processing

## Usage Example

```python
detector = WrongWayDetector(
    model_path="yolov8s.pt",
    dividing_line_x=None,  # Auto-detect from red line
    confidence_threshold=0.5
)

violations = detector.process_video(
    video_path="input.mp4",
    output_path="output.mp4"
)
```
