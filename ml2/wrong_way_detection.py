"""
Wrong-Way Vehicle Detection System using YOLOv8
Detects vehicles moving in the wrong direction on divided lanes
"""

import cv2
import numpy as np
from ultralytics import YOLO
from collections import defaultdict, deque
import time

class WrongWayDetector:
    def __init__(self, model_path, dividing_line_x=None, confidence_threshold=0.5):
        """
        Initialize the wrong-way detector
        
        Args:
            model_path: Path to YOLOv8 model
            dividing_line_x: X-coordinate of the dividing line (auto-detect if None)
            confidence_threshold: Detection confidence threshold
        """
        self.model = YOLO(model_path)
        self.dividing_line_x = dividing_line_x
        self.confidence_threshold = confidence_threshold
        
        # Track vehicle positions over time
        self.vehicle_tracks = defaultdict(lambda: deque(maxlen=30))  # Store last 30 positions
        self.vehicle_directions = {}  # Store computed direction for each vehicle
        self.wrong_way_vehicles = set()  # Set of vehicle IDs going wrong way
        
        # Vehicle classes to detect (COCO dataset)
        self.vehicle_classes = [2, 3, 5, 7]  # car, motorcycle, bus, truck
        
        # Direction detection parameters
        self.min_track_length = 10  # Minimum frames to determine direction
        self.direction_threshold = 20  # Minimum pixel movement to count as moving
        
    def detect_dividing_line(self, frame):
        """
        Auto-detect the dividing line (red line) in the frame
        Returns the X-coordinate of the dividing line
        """
        # Convert to HSV for better red detection
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        # Define range for red color
        lower_red1 = np.array([0, 100, 100])
        upper_red1 = np.array([10, 255, 255])
        lower_red2 = np.array([160, 100, 100])
        upper_red2 = np.array([180, 255, 255])
        
        # Create masks for red color
        mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
        mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
        red_mask = mask1 + mask2
        
        # Find contours
        contours, _ = cv2.findContours(red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            # Find the longest vertical line
            max_height = 0
            best_x = None
            
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                if h > max_height and w < 20:  # Vertical line should be thin
                    max_height = h
                    best_x = x + w // 2
            
            if best_x:
                return best_x
        
        # Default to center if no line detected
        return frame.shape[1] // 2
    
    def get_vehicle_center(self, bbox):
        """Get the center point of a bounding box"""
        x1, y1, x2, y2 = bbox
        return ((x1 + x2) // 2, (y1 + y2) // 2)
    
    def determine_direction(self, track):
        """
        Determine if vehicle is moving bottom-to-top (correct) or top-to-bottom (wrong)
        
        Returns:
            1: Moving bottom-to-top (correct direction)
            -1: Moving top-to-bottom (wrong direction)
            0: Direction unclear or stationary
        """
        if len(track) < self.min_track_length:
            return 0
        
        # Get first and last positions
        first_pos = track[0]
        last_pos = track[-1]
        
        # Calculate Y-axis movement (negative Y means moving up/top)
        y_movement = last_pos[1] - first_pos[1]
        
        # Check if movement is significant
        if abs(y_movement) < self.direction_threshold:
            return 0  # Not moving significantly
        
        # Bottom-to-top movement (Y decreases) = Correct = 1
        # Top-to-bottom movement (Y increases) = Wrong = -1
        return 1 if y_movement < 0 else -1
    
    def is_wrong_way(self, center_x, direction):
        """
        Determine if a vehicle is going the wrong way based on its lane and direction
        
        Args:
            center_x: X-coordinate of vehicle center
            direction: 1 (bottom-to-top), -1 (top-to-bottom), 0 (unclear)
        
        Returns:
            True if wrong way, False otherwise
        """
        if direction == 0:
            return False  # Cannot determine
        
        # Left lane (x < dividing_line_x): Correct = bottom-to-top (direction = 1)
        # Right lane (x >= dividing_line_x): Correct = bottom-to-top (direction = 1)
        # Both lanes should have vehicles moving bottom-to-top
        
        # Wrong way = top-to-bottom movement (direction = -1)
        return direction == -1
    
    def process_frame(self, frame, frame_number):
        """
        Process a single frame and detect wrong-way vehicles
        
        Returns:
            annotated_frame: Frame with detections and annotations
            violations: List of violation information
        """
        # Auto-detect dividing line on first frame
        if self.dividing_line_x is None:
            self.dividing_line_x = self.detect_dividing_line(frame)
        
        # Run YOLOv8 detection with tracking
        results = self.model.track(frame, persist=True, classes=self.vehicle_classes, 
                                   conf=self.confidence_threshold, verbose=False)
        
        violations = []
        annotated_frame = frame.copy()
        
        # Draw dividing line
        cv2.line(annotated_frame, (self.dividing_line_x, 0), 
                (self.dividing_line_x, frame.shape[0]), (0, 0, 255), 2)
        
        # Process detections
        if results[0].boxes is not None and results[0].boxes.id is not None:
            boxes = results[0].boxes.xyxy.cpu().numpy()
            track_ids = results[0].boxes.id.cpu().numpy().astype(int)
            confidences = results[0].boxes.conf.cpu().numpy()
            classes = results[0].boxes.cls.cpu().numpy().astype(int)
            
            for box, track_id, conf, cls in zip(boxes, track_ids, confidences, classes):
                center = self.get_vehicle_center(box)
                
                # Update vehicle track
                self.vehicle_tracks[track_id].append(center)
                
                # Determine direction
                direction = self.determine_direction(self.vehicle_tracks[track_id])
                self.vehicle_directions[track_id] = direction
                
                # Check if wrong way
                is_wrong = self.is_wrong_way(center[0], direction)
                
                # Determine lane
                lane = "LEFT" if center[0] < self.dividing_line_x else "RIGHT"
                
                # Color coding
                if is_wrong:
                    color = (0, 0, 255)  # Red for wrong way
                    self.wrong_way_vehicles.add(track_id)
                    violations.append({
                        'track_id': track_id,
                        'lane': lane,
                        'position': center,
                        'frame': frame_number,
                        'confidence': conf
                    })
                else:
                    color = (0, 255, 0)  # Green for correct way
                    if track_id in self.wrong_way_vehicles:
                        self.wrong_way_vehicles.remove(track_id)
                
                # Draw bounding box
                x1, y1, x2, y2 = map(int, box)
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
                
                # Direction arrow
                direction_text = ""
                if direction == 1:
                    direction_text = "↑ CORRECT"
                elif direction == -1:
                    direction_text = "↓ WRONG WAY!"
                else:
                    direction_text = "? DETECTING"
                
                # Label
                label = f"ID:{track_id} {lane} {direction_text}"
                cv2.putText(annotated_frame, label, (x1, y1 - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                
                # Draw track history
                if len(self.vehicle_tracks[track_id]) > 1:
                    points = list(self.vehicle_tracks[track_id])
                    for i in range(1, len(points)):
                        cv2.line(annotated_frame, points[i-1], points[i], color, 2)
        
        # Add statistics
        stats_text = [
            f"Frame: {frame_number}",
            f"Dividing Line: {self.dividing_line_x}",
            f"Active Vehicles: {len(self.vehicle_tracks)}",
            f"Wrong Way Count: {len(self.wrong_way_vehicles)}",
            f"Violations This Frame: {len(violations)}"
        ]
        
        y_offset = 30
        for text in stats_text:
            cv2.putText(annotated_frame, text, (10, y_offset),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            y_offset += 25
        
        return annotated_frame, violations
    
    def process_video(self, video_path, output_path=None, show_preview=True):
        """
        Process entire video and detect wrong-way vehicles
        
        Args:
            video_path: Path to input video
            output_path: Path to save output video (optional)
            show_preview: Whether to show live preview
        """
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")
        
        # Get video properties
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Video writer
        writer = None
        if output_path:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        print(f"Processing video: {video_path}")
        print(f"Resolution: {width}x{height}, FPS: {fps}, Total Frames: {total_frames}")
        
        all_violations = []
        frame_number = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_number += 1
            
            # Process frame
            annotated_frame, violations = self.process_frame(frame, frame_number)
            all_violations.extend(violations)
            
            # Write output
            if writer:
                writer.write(annotated_frame)
            
            # Show preview
            if show_preview:
                display_frame = cv2.resize(annotated_frame, (1280, 720))
                cv2.imshow('Wrong Way Detection', display_frame)
                
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
            
            # Progress
            if frame_number % 30 == 0:
                progress = (frame_number / total_frames) * 100
                print(f"Progress: {progress:.1f}% - Violations: {len(all_violations)}")
        
        # Cleanup
        cap.release()
        if writer:
            writer.release()
        cv2.destroyAllWindows()
        
        # Print summary
        print(f"\n{'='*50}")
        print(f"Processing Complete!")
        print(f"{'='*50}")
        print(f"Total Frames Processed: {frame_number}")
        print(f"Total Violations Detected: {len(all_violations)}")
        print(f"Unique Wrong-Way Vehicles: {len(set(v['track_id'] for v in all_violations))}")
        
        if all_violations:
            print(f"\nViolation Summary:")
            for i, violation in enumerate(all_violations[:10], 1):
                print(f"{i}. Track ID: {violation['track_id']}, "
                      f"Lane: {violation['lane']}, "
                      f"Frame: {violation['frame']}")
            if len(all_violations) > 10:
                print(f"... and {len(all_violations) - 10} more violations")
        
        return all_violations


def main():
    """Main function to run the wrong-way detection system"""
    
    # Configuration
    MODEL_PATH = "yolov8s.pt"  # Will auto-download if not present
    VIDEO_PATH = "WhatsApp Video 2026-02-04 at 20.03.04.mp4"
    OUTPUT_PATH = "wrong_way_output.mp4"
    
    # Initialize detector
    detector = WrongWayDetector(
        model_path=MODEL_PATH,
        dividing_line_x=None,  # Auto-detect
        confidence_threshold=0.5
    )
    
    # Process video
    violations = detector.process_video(
        video_path=VIDEO_PATH,
        output_path=OUTPUT_PATH,
        show_preview=False  # Set to True for live preview
    )
    
    print(f"\nOutput saved to: {OUTPUT_PATH}")
    
    return violations


if __name__ == "__main__":
    main()
