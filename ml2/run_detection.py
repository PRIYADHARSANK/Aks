"""
Simple script to run wrong-way detection with custom configurations
"""

from wrong_way_detection import WrongWayDetector

# ============= CONFIGURATION =============

# Model configuration
MODEL_PATH = "yolov8s.pt"  # Will auto-download if not present
VIDEO_PATH = "WhatsApp Video 2026-02-04 at 22.10.11.mp4"
OUTPUT_PATH = "wrong_way_detected.mp4"

# Detection parameters
DIVIDING_LINE_X = None  # Set to specific pixel value or None for auto-detect
CONFIDENCE_THRESHOLD = 0.5  # Adjust between 0.1 (more detections) to 0.9 (fewer, more confident)

# Tracking parameters
MIN_TRACK_LENGTH = 10  # Minimum frames before determining direction
DIRECTION_THRESHOLD = 20  # Minimum pixel movement to count as moving

# Display options
SHOW_LIVE_PREVIEW = False  # Set to True to see processing in real-time

# ============= RUN DETECTION =============

def run_detection():
    print("="*60)
    print("Wrong-Way Vehicle Detection System")
    print("="*60)
    print(f"\nConfiguration:")
    print(f"  Model: {MODEL_PATH}")
    print(f"  Input Video: {VIDEO_PATH}")
    print(f"  Output Video: {OUTPUT_PATH}")
    print(f"  Confidence Threshold: {CONFIDENCE_THRESHOLD}")
    print(f"  Dividing Line: {'Auto-detect' if DIVIDING_LINE_X is None else DIVIDING_LINE_X}")
    print(f"\n{'='*60}\n")
    
    # Initialize detector
    detector = WrongWayDetector(
        model_path=MODEL_PATH,
        dividing_line_x=DIVIDING_LINE_X,
        confidence_threshold=CONFIDENCE_THRESHOLD
    )
    
    # Override default parameters if needed
    detector.min_track_length = MIN_TRACK_LENGTH
    detector.direction_threshold = DIRECTION_THRESHOLD
    
    # Process video
    violations = detector.process_video(
        video_path=VIDEO_PATH,
        output_path=OUTPUT_PATH,
        show_preview=SHOW_LIVE_PREVIEW
    )
    
    # Save violation report
    if violations:
        report_path = "violation_report.txt"
        with open(report_path, 'w') as f:
            f.write("Wrong-Way Vehicle Detection Report\n")
            f.write("="*60 + "\n\n")
            f.write(f"Total Violations: {len(violations)}\n")
            f.write(f"Unique Vehicles: {len(set(v['track_id'] for v in violations))}\n\n")
            f.write("-"*60 + "\n")
            f.write(f"{'Frame':<10} {'Track ID':<12} {'Lane':<10} {'Confidence':<12}\n")
            f.write("-"*60 + "\n")
            
            for v in violations:
                f.write(f"{v['frame']:<10} {v['track_id']:<12} {v['lane']:<10} {v['confidence']:.2f}\n")
        
        print(f"\nViolation report saved to: {report_path}")
    
    return violations


if __name__ == "__main__":
    violations = run_detection()
    
    print("\n" + "="*60)
    print("Processing Complete!")
    print("="*60)
    
    if violations:
        print(f"\n⚠️  {len(violations)} violations detected")
        print(f"📊 {len(set(v['track_id'] for v in violations))} unique wrong-way vehicles")
    else:
        print("\n✓ No violations detected")
