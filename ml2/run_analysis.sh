#!/bin/bash
# =============================================================================
# Wrong-Way Vehicle Detection - Run Script
# =============================================================================
# This script runs the vehicle direction detection system step by step.
# 
# Usage: ./run_analysis.sh [options]
# Options:
#   --video <path>    Specify custom video path (default: WhatsApp Video...)
#   --output <path>   Specify output video path (default: output_detected.mp4)
#   --headless        Run without live preview window
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
VIDEO_FILE="WhatsApp Video 2026-02-04 at 22.10.11.mp4"
OUTPUT_FILE="output_detected.mp4"
MODEL_FILE="yolov8s.pt"
HEADLESS=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --video)
            VIDEO_FILE="$2"
            shift 2
            ;;
        --output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --headless)
            HEADLESS=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Navigate to script directory
cd "$(dirname "$0")"

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  Wrong-Way Vehicle Detection System${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# =============================================================================
# STEP 1: Check Python environment
# =============================================================================
echo -e "${YELLOW}[Step 1/5]${NC} Checking Python environment..."

if ! command -v uv &> /dev/null; then
    echo -e "${RED}Error: 'uv' is not installed.${NC}"
    echo "Install it with: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

echo -e "${GREEN}  ✓ uv is installed${NC}"

# =============================================================================
# STEP 2: Check/Install Dependencies
# =============================================================================
echo -e "${YELLOW}[Step 2/5]${NC} Checking dependencies..."

if [ ! -d ".venv" ]; then
    echo "  Creating virtual environment..."
    uv venv
fi

# Sync dependencies
echo "  Syncing dependencies..."
uv sync --quiet

echo -e "${GREEN}  ✓ Dependencies installed${NC}"

# =============================================================================
# STEP 3: Check Model File
# =============================================================================
echo -e "${YELLOW}[Step 3/5]${NC} Checking YOLOv8 model..."

if [ ! -f "$MODEL_FILE" ]; then
    echo "  Downloading YOLOv8s model..."
    uv run python -c "from ultralytics import YOLO; YOLO('yolov8s.pt')"
fi

echo -e "${GREEN}  ✓ Model file: $MODEL_FILE ($(du -h "$MODEL_FILE" | cut -f1))${NC}"

# =============================================================================
# STEP 4: Check Video File
# =============================================================================
echo -e "${YELLOW}[Step 4/5]${NC} Checking input video..."

if [ ! -f "$VIDEO_FILE" ]; then
    echo -e "${RED}Error: Video file not found: $VIDEO_FILE${NC}"
    echo "Available video files:"
    ls -la *.mp4 2>/dev/null || echo "  No .mp4 files found"
    exit 1
fi

echo -e "${GREEN}  ✓ Video file: $VIDEO_FILE ($(du -h "$VIDEO_FILE" | cut -f1))${NC}"

# =============================================================================
# STEP 5: Run Detection
# =============================================================================
echo ""
echo -e "${BLUE}=============================================${NC}"
echo -e "${YELLOW}[Step 5/5]${NC} Running vehicle direction detection..."
echo -e "${BLUE}=============================================${NC}"
echo ""
echo "  Input:  $VIDEO_FILE"
echo "  Output: $OUTPUT_FILE"
echo "  Model:  $MODEL_FILE"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop, or 'q' in the video window to quit.${NC}"
echo ""

# Run the detection script
uv run python vehicle_direction_detector.py \
    --video "$VIDEO_FILE" \
    --output "$OUTPUT_FILE"

# =============================================================================
# Summary
# =============================================================================
echo ""
echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}  Detection Complete!${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

if [ -f "$OUTPUT_FILE" ]; then
    echo -e "  ${GREEN}✓${NC} Output video: $OUTPUT_FILE ($(du -h "$OUTPUT_FILE" | cut -f1))"
fi

if [ -f "analysis_summary.json" ]; then
    echo -e "  ${GREEN}✓${NC} Analysis summary: analysis_summary.json"
fi

echo ""
echo "To view results:"
echo "  open $OUTPUT_FILE"
echo ""
