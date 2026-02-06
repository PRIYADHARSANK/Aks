#!/usr/bin/env python3
"""
Vehicle Direction Detection System
Analyzes highway video to detect vehicles and validate their direction of travel
based on lane position relative to a center axis.
"""

import cv2
import numpy as np
from collections import defaultdict
import json
from datetime import datetime

class VehicleDirectionDetector:
    """
    Detects vehicles and validates their direction based on lane position.
    
    Rules:
    - Left side of center line: Vehicles should move BOTTOM to TOP (correct)
    - Right side of center line: Vehicles should move BOTTOM to TOP (correct)
    """
    
    def __init__(self, video_path, center_x=640, min_movement=20, confidence_threshold=0.3):
        """
        Initialize the detector.
        
        Args:
            video_path: Path to the input video
            center_x: X-coordinate of the center dividing line (fallback)
            min_movement: Minimum Y-axis movement to detect direction
            confidence_threshold: Minimum confidence for vehicle detection
        """
        self.video_path = video_path
        self.center_x = center_x
        self.min_movement = min_movement
        self.confidence_threshold = confidence_threshold
        
        # Diagonal center line - defined by two points (start and end)
        # These will be auto-detected or can be manually set
        # Line goes from bottom-left to top-right based on the provided image
        self.center_line_start = None  # (x1, y1) - bottom point
        self.center_line_end = None    # (x2, y2) - top point
        self.use_diagonal_line = True  # Use diagonal line detection
        
        # Vehicle tracking
        self.vehicle_tracks = defaultdict(list)
        self.next_vehicle_id = 0
        self.max_track_age = 30  # frames
        
        # Statistics
        self.stats = {
            'left_lane': {'correct': 0, 'wrong': 0, 'total': 0},
            'right_lane': {'correct': 0, 'wrong': 0, 'total': 0},
            'frame_count': 0
        }
        
        # Initialize YOLO model
        from ultralytics import YOLO
        print("Loading YOLOv8 model...")
        self.model = YOLO('yolov8s.pt')
        print("Model loaded successfully.")
    
    def is_point_left_of_line(self, point_x, point_y):
        """
        Determine if a point is on the left side of the diagonal center line.
        
        Uses the cross product to determine which side of the line the point is on.
        For a line from (x1, y1) to (x2, y2), if the cross product of 
        (line vector) x (point - line_start) is negative, the point is on the left.
        
        Returns:
            True if point is on left side, False if on right side
        """
        if self.center_line_start is None or self.center_line_end is None:
            # Fallback to vertical line
            return point_x < self.center_x
        
        x1, y1 = self.center_line_start
        x2, y2 = self.center_line_end
        
        # Cross product: (x2-x1)*(py-y1) - (y2-y1)*(px-x1)
        # Negative = left side, Positive = right side
        cross = (x2 - x1) * (point_y - y1) - (y2 - y1) * (point_x - x1)
        
        return cross < 0
        
    def detect_center_line(self, frame):
        """
        Detect the red diagonal center line in the frame.
        
        Returns the center line as two points for diagonal line detection.
        """
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        height, width = frame.shape[:2]
        
        # Red color range (wider range for better detection)
        lower_red1 = np.array([0, 80, 80])
        upper_red1 = np.array([15, 255, 255])
        lower_red2 = np.array([155, 80, 80])
        upper_red2 = np.array([180, 255, 255])
        
        mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
        mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
        red_mask = cv2.bitwise_or(mask1, mask2)
        
        # Apply morphological operations to clean up the mask
        kernel = np.ones((3, 3), np.uint8)
        red_mask = cv2.morphologyEx(red_mask, cv2.MORPH_CLOSE, kernel)
        red_mask = cv2.morphologyEx(red_mask, cv2.MORPH_OPEN, kernel)
        
        # Use Hough Line Transform to detect the diagonal line
        lines = cv2.HoughLinesP(red_mask, 1, np.pi/180, threshold=50, 
                                 minLineLength=100, maxLineGap=20)
        
        if lines is not None and len(lines) > 0:
            # Find the longest line (most likely the center divider)
            longest_line = None
            max_length = 0
            
            for line in lines:
                x1, y1, x2, y2 = line[0]
                length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
                if length > max_length:
                    max_length = length
                    longest_line = (x1, y1, x2, y2)
            
            if longest_line is not None:
                x1, y1, x2, y2 = longest_line
                # Ensure start is the bottom point and end is the top point
                if y1 < y2:
                    self.center_line_start = (x2, y2)  # Bottom point
                    self.center_line_end = (x1, y1)    # Top point
                else:
                    self.center_line_start = (x1, y1)  # Bottom point
                    self.center_line_end = (x2, y2)    # Top point
                
                print(f"Detected diagonal center line: {self.center_line_start} -> {self.center_line_end}")
                
                # Also set center_x as average for fallback
                self.center_x = (self.center_line_start[0] + self.center_line_end[0]) // 2
                return self.center_x
        
        # Fallback: Try contour-based detection
        contours, _ = cv2.findContours(red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            largest_contour = max(contours, key=cv2.contourArea)
            
            # Fit a line to the contour
            if len(largest_contour) >= 5:
                [vx, vy, cx, cy] = cv2.fitLine(largest_contour, cv2.DIST_L2, 0, 0.01, 0.01)
                
                # Calculate line endpoints that span the frame
                t = max(height, width)
                x1 = int(cx - t * vx)
                y1 = int(cy - t * vy)
                x2 = int(cx + t * vx)
                y2 = int(cy + t * vy)
                
                # Clip to frame boundaries
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(width-1, x2), min(height-1, y2)
                
                # Ensure start is bottom point
                if y1 < y2:
                    self.center_line_start = (x2, y2)
                    self.center_line_end = (x1, y1)
                else:
                    self.center_line_start = (x1, y1)
                    self.center_line_end = (x2, y2)
                
                print(f"Detected center line from contour: {self.center_line_start} -> {self.center_line_end}")
                self.center_x = (x1 + x2) // 2
                return self.center_x
            
            # Simple bounding box fallback
            x, y, w, h = cv2.boundingRect(largest_contour)
            self.center_x = x + w // 2
            
            # Set diagonal approximation
            self.center_line_start = (x + w // 2, y + h)  # Bottom
            self.center_line_end = (x + w // 2, y)        # Top
        
        return self.center_x
    
    def detect_vehicles_yolo(self, frame):
        """Detect vehicles using YOLOv8."""
        results = self.model(frame, verbose=False)[0]
        detections = []
        
        # YOLO classes for vehicles (COCO dataset)
        # 2: car, 3: motorcycle, 5: bus, 7: truck
        vehicle_classes = [2, 3, 5, 7]
        
        for box in results.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            
            if cls in vehicle_classes and conf > self.confidence_threshold:
                # Get box coordinates
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                w, h = x2 - x1, y2 - y1
                
                # Center point
                center_x = x1 + w // 2
                center_y = y1 + h // 2
                
                detections.append({
                    'bbox': (x1, y1, w, h),
                    'center': (center_x, center_y),
                    'confidence': conf,
                    'class_id': cls
                })
        
        return detections
    
    def track_vehicles(self, detections, frame_idx):
        """
        Simple vehicle tracking using IoU matching.
        """
        current_tracks = {}
        matched_track_ids = set()
        
        # Match detections with existing tracks
        for detection in detections:
            det_center = detection['center']
            best_match_id = None
            best_distance = float('inf')
            
            for track_id, track_history in self.vehicle_tracks.items():
                if not track_history:
                    continue
                    
                # Get last known position
                last_pos = track_history[-1]['center']
                last_frame = track_history[-1]['frame']
                
                # Skip old tracks
                if frame_idx - last_frame > self.max_track_age:
                    continue
                
                # Calculate distance
                distance = np.sqrt((det_center[0] - last_pos[0])**2 + 
                                 (det_center[1] - last_pos[1])**2)
                
                # Match if within threshold
                if distance < 100 and distance < best_distance:
                    best_distance = distance
                    best_match_id = track_id
            
            # Assign to existing track or create new one
            if best_match_id is not None:
                track_id = best_match_id
                matched_track_ids.add(track_id)
            else:
                track_id = self.next_vehicle_id
                self.next_vehicle_id += 1
            
            # Add to track history
            self.vehicle_tracks[track_id].append({
                'center': det_center,
                'bbox': detection['bbox'],
                'frame': frame_idx,
                'confidence': detection['confidence']
            })
            
            current_tracks[track_id] = detection
        
        # Clean up old tracks
        track_ids_to_remove = []
        for track_id, track_history in self.vehicle_tracks.items():
            if track_history and frame_idx - track_history[-1]['frame'] > self.max_track_age:
                track_ids_to_remove.append(track_id)
        
        for track_id in track_ids_to_remove:
            del self.vehicle_tracks[track_id]
        
        return current_tracks
    
    def analyze_direction(self, track_id):
        """
        Analyze vehicle direction and validate if it's correct.
        
        Returns:
            tuple: (is_left_lane, direction, is_correct)
        """
        track_history = self.vehicle_tracks[track_id]
        
        if len(track_history) < 2:
            return None, None, None
        
        # Get first and last positions
        first_pos = track_history[0]['center']
        last_pos = track_history[-1]['center']
        
        # Calculate movement
        dx = last_pos[0] - first_pos[0]
        dy = last_pos[1] - first_pos[1]
        
        # Need minimum vertical movement to determine direction
        if abs(dy) < self.min_movement:
            return None, None, None
        
        # Determine which lane using diagonal line detection
        # Use average position for more stable lane detection
        avg_x = np.mean([pos['center'][0] for pos in track_history])
        avg_y = np.mean([pos['center'][1] for pos in track_history])
        
        # Use the diagonal line method if available
        is_left_lane = self.is_point_left_of_line(avg_x, avg_y)
        
        # Determine direction
        # Positive dy = moving down (top to bottom)
        # Negative dy = moving up (bottom to top)
        direction = "DOWN" if dy > 0 else "UP"
        
        # Validate correctness
        # Left lane: should move UP (bottom to top) - dy < 0
        # Right lane: should move UP (bottom to top) - dy < 0
        is_correct = dy < 0  # Should move UP
        
        return is_left_lane, direction, is_correct
    
    def process_video(self, output_path=None, save_summary=True, show_preview=True):
        """
        Process the entire video and analyze vehicle directions.
        
        Args:
            output_path: Path to save annotated video (optional)
            save_summary: Save analysis summary to JSON
            show_preview: Whether to show the OpenCV preview window
        """
        cap = cv2.VideoCapture(self.video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {self.video_path}")
        
        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        print(f"Video properties: {width}x{height} @ {fps} FPS, {total_frames} frames")
        
        # Update center_x if not specified
        if self.center_x == 640:
            self.center_x = width // 2
        
        # Detect center line from first frame
        ret, first_frame = cap.read()
        if ret:
            detected_center = self.detect_center_line(first_frame)
            if detected_center:
                self.center_x = detected_center
                print(f"Detected center line at X={self.center_x}")
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # Reset to start
        
        # Setup video writer if output path specified
        out = None
        if output_path:
            # Use avc1 (H.264) for better browser compatibility
            fourcc = cv2.VideoWriter_fourcc(*'avc1')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        frame_idx = 0
        analyzed_vehicles = set()  # Track vehicles we've already counted
        
        print("\nProcessing video...")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            self.stats['frame_count'] = frame_idx + 1
            
            # Detect vehicles
            detections = self.detect_vehicles_yolo(frame)
            
            # Track vehicles
            current_tracks = self.track_vehicles(detections, frame_idx)
            
            # Create annotated frame
            annotated_frame = frame.copy()
            
            # Draw center line (diagonal if detected, otherwise vertical)
            if self.center_line_start is not None and self.center_line_end is not None:
                # Draw the diagonal center line
                cv2.line(annotated_frame, self.center_line_start, self.center_line_end, 
                        (0, 0, 255), 3)
                
                # Draw lane labels positioned relative to the diagonal line
                # Left side label (closer to left of center line)
                left_label_x = max(30, self.center_line_end[0] - 200)
                cv2.putText(annotated_frame, "LEFT LANE", (left_label_x, 50), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                cv2.putText(annotated_frame, "(BOTTOM->TOP)", (left_label_x, 80), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
                
                # Right side label
                right_label_x = min(width - 200, self.center_line_end[0] + 30)
                cv2.putText(annotated_frame, "RIGHT LANE", (right_label_x, 50), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                cv2.putText(annotated_frame, "(BOTTOM->TOP)", (right_label_x, 80), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            else:
                # Fallback: Draw vertical center line
                cv2.line(annotated_frame, (self.center_x, 0), (self.center_x, height), 
                        (0, 0, 255), 3)
                
                # Draw lane labels
                cv2.putText(annotated_frame, "LEFT LANE", (50, 50), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                cv2.putText(annotated_frame, "(BOTTOM->TOP)", (50, 80), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
                
                cv2.putText(annotated_frame, "RIGHT LANE", (self.center_x + 50, 50), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                cv2.putText(annotated_frame, "(BOTTOM->TOP)", (self.center_x + 50, 80), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            
            # Analyze and draw tracked vehicles
            for track_id, detection in current_tracks.items():
                x, y, w, h = detection['bbox']
                center_x, center_y = detection['center']
                
                # Analyze direction
                is_left_lane, direction, is_correct = self.analyze_direction(track_id)
                
                # Update statistics (only once per vehicle when direction is determined)
                if is_correct is not None and track_id not in analyzed_vehicles:
                    analyzed_vehicles.add(track_id)
                    
                    lane = 'left_lane' if is_left_lane else 'right_lane'
                    self.stats[lane]['total'] += 1
                    
                    if is_correct:
                        self.stats[lane]['correct'] += 1
                    else:
                        self.stats[lane]['wrong'] += 1
                
                # Draw bounding box
                if is_correct is None:
                    color = (200, 200, 200)  # Gray for unknown
                    label = f"ID:{track_id}"
                elif is_correct:
                    color = (0, 255, 0)  # Green for correct
                    label = f"ID:{track_id} {direction} ✓"
                else:
                    color = (0, 0, 255)  # Red for wrong direction
                    label = f"ID:{track_id} {direction} ✗ WRONG!"
                
                cv2.rectangle(annotated_frame, (x, y), (x + w, y + h), color, 2)
                cv2.circle(annotated_frame, (center_x, center_y), 4, color, -1)
                
                # Draw label
                label_y = max(y - 10, 20)
                cv2.putText(annotated_frame, label, (x, label_y), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
            # Draw statistics
            stats_y = height - 120
            # Semi-transparent background for stats
            overlay = annotated_frame.copy()
            cv2.rectangle(overlay, (10, stats_y - 30), (400, height - 10), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.6, annotated_frame, 0.4, 0, annotated_frame)
            
            cv2.rectangle(annotated_frame, (10, stats_y - 30), (400, height - 10), 
                         (255, 255, 255), 2)
            
            cv2.putText(annotated_frame, f"Frame: {frame_idx + 1}/{total_frames}", 
                       (20, stats_y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            cv2.putText(annotated_frame, 
                       f"Left: {self.stats['left_lane']['correct']}✓ {self.stats['left_lane']['wrong']}✗", 
                       (20, stats_y + 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            cv2.putText(annotated_frame, 
                       f"Right: {self.stats['right_lane']['correct']}✓ {self.stats['right_lane']['wrong']}✗", 
                       (20, stats_y + 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            # Write frame
            if out:
                out.write(annotated_frame)
            
            # Show frame in real-time if requested
            if show_preview:
                cv2.imshow('Vehicle Direction Detector', annotated_frame)
                # Press 'q' to quit
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    print("\nUser interrupted execution.")
                    break
            
            # Yield frame for streaming
            yield annotated_frame
            
            # Progress indicator
            if frame_idx % 30 == 0:
                progress = (frame_idx + 1) / total_frames * 100
                print(f"Progress: {progress:.1f}% ({frame_idx + 1}/{total_frames} frames)")
            
            frame_idx += 1
        
        # Cleanup
        cap.release()
        if out:
            out.release()
        if show_preview:
            cv2.destroyAllWindows()
        
        print("\n" + "="*60)
        print("ANALYSIS COMPLETE")
        print("="*60)
        self.print_summary()
        
        # Save summary
        if save_summary:
            summary_path = 'analysis_summary.json'
            self.save_summary(summary_path)
            print(f"\nSummary saved to: {summary_path}")
        
        return self.stats
        
    def generate_frames(self):
        """Generator that processes video and yields JPEG bytes."""
        # Wrap process_video but yield JPEG encoded bytes
        for frame in self.process_video(output_path=None, save_summary=False, show_preview=False):
            # Encode frame as JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    def print_summary(self):
        """Print analysis summary."""
        print("\n📊 VEHICLE DIRECTION ANALYSIS SUMMARY")
        print("="*60)
        
        print(f"\n🎥 Total Frames Analyzed: {self.stats['frame_count']}")
        print(f"📏 Center Line Position: X = {self.center_x}")
        
        print("\n⬅️  LEFT LANE (Should move BOTTOM→TOP):")
        print(f"   Total Vehicles: {self.stats['left_lane']['total']}")
        print(f"   ✅ Correct Direction: {self.stats['left_lane']['correct']}")
        print(f"   ❌ Wrong Direction: {self.stats['left_lane']['wrong']}")
        if self.stats['left_lane']['total'] > 0:
            accuracy = (self.stats['left_lane']['correct'] / self.stats['left_lane']['total']) * 100
            print(f"   📈 Accuracy: {accuracy:.1f}%")
        
        print("\n➡️  RIGHT LANE (Should move BOTTOM→TOP):")
        print(f"   Total Vehicles: {self.stats['right_lane']['total']}")
        print(f"   ✅ Correct Direction: {self.stats['right_lane']['correct']}")
        print(f"   ❌ Wrong Direction: {self.stats['right_lane']['wrong']}")
        if self.stats['right_lane']['total'] > 0:
            accuracy = (self.stats['right_lane']['correct'] / self.stats['right_lane']['total']) * 100
            print(f"   📈 Accuracy: {accuracy:.1f}%")
        
        total_vehicles = self.stats['left_lane']['total'] + self.stats['right_lane']['total']
        total_correct = self.stats['left_lane']['correct'] + self.stats['right_lane']['correct']
        total_wrong = self.stats['left_lane']['wrong'] + self.stats['right_lane']['wrong']
        
        print("\n📊 OVERALL STATISTICS:")
        print(f"   Total Vehicles Detected: {total_vehicles}")
        print(f"   ✅ Correct Direction: {total_correct}")
        print(f"   ❌ Wrong Direction: {total_wrong}")
        if total_vehicles > 0:
            overall_accuracy = (total_correct / total_vehicles) * 100
            print(f"   📈 Overall Accuracy: {overall_accuracy:.1f}%")
        
        print("="*60)
    
    def save_summary(self, output_path):
        """Save analysis summary to JSON file."""
        # Convert numpy types to Python native types for JSON serialization
        center_line_info = None
        if self.center_line_start is not None and self.center_line_end is not None:
            center_line_info = {
                'start': (int(self.center_line_start[0]), int(self.center_line_start[1])),
                'end': (int(self.center_line_end[0]), int(self.center_line_end[1]))
            }
        
        summary = {
            'timestamp': datetime.now().isoformat(),
            'video_path': self.video_path,
            'center_x': int(self.center_x),
            'center_line': center_line_info,
            'statistics': self.stats,
            'rules': {
                'left_lane': 'Vehicles should move BOTTOM to TOP',
                'right_lane': 'Vehicles should move BOTTOM to TOP'
            }
        }
        
        with open(output_path, 'w') as f:
            json.dump(summary, f, indent=2)


def main():
    """Main function to run the vehicle direction detector."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Vehicle Direction Detection System'
    )
    parser.add_argument('--video', type=str, required=True,
                       help='Path to input video')
    parser.add_argument('--output', type=str, default=None,
                       help='Path to save annotated video (optional)')
    parser.add_argument('--center-x', type=int, default=640,
                       help='X-coordinate of center line (auto-detected if not specified)')
    parser.add_argument('--min-movement', type=int, default=20,
                       help='Minimum Y-axis movement to detect direction')
    
    args = parser.parse_args()
    
    # Create detector
    detector = VehicleDirectionDetector(
        video_path=args.video,
        center_x=args.center_x,
        min_movement=args.min_movement
    )
    
    # Process video
    detector.process_video(output_path=args.output)


if __name__ == "__main__":
    main()