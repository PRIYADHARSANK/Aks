# Vehicle Wrong-Way Detection System - Documentation

## 1. Introduction
Welcome to the documentation for the **Vehicle Wrong-Way Detection System**. 

This system is designed to automatically detect vehicles traveling in the wrong direction on a road. Using a camera and Artificial Intelligence (AI), it monitors traffic in real-time and identifies if a car, truck, or motorcycle is moving against the allowed flow of traffic. This kind of system is crucial for preventing accidents on highways and one-way streets.

**Key Features:**
*   **Real-time Monitoring:** Watches traffic live.
*   **Automatic Detection:** Uses AI to recognize vehicles and their direction.
*   **Visual Alerts:** Shows safe drivers in Green and wrong-way drivers in Red.

---

## 2. System Overview
Think of the system as having three main parts:

1.  **The Eyes (Camera):** Captures video of the road.
2.  **The Brain (Raspberry Pi & AI):** A small but powerful computer (Raspberry Pi) processes the video. It uses a smart program (YOLOv8) to "see" vehicles and track where they are going.
3.  **The Display (Dashboard):** A web page that shows the live video feed and statistics, so a human operator can see what's happening.

**How it flows:**
`Camera` -> sends video to -> `Raspberry Pi (AI Software)` -> sends results to -> `Screen (Web Dashboard)`

---

## 3. Hardware Components
To run this system, you need the following hardware:

1.  **Raspberry Pi (The Computer):**
    *   Ideally a **Raspberry Pi 4 or 5** (4GB or 8GB RAM recommended).
    *   This acts as the brain of the operation.
2.  **Camera:**
    *   A **USB Webcam** OR a **Raspberry Pi Camera Module**.
    *   It needs to be positioned effectively to see the road lanes clearly.
3.  **Power Supply:**
    *   Official USB-C Power Supply for the Raspberry Pi.
4.  **Cooling (Important):**
    *   A **Case with a Fan** or **Heatsinks**. The AI software works the processor hard, so it needs to stay cool!
5.  **MicroSD Card:**
    *   (32GB or larger) To hold the operating system and our software.

---

## 4. Hardware Wiring & Connections
Setting this up is very similar to plugging in a desktop computer:

1.  **Connect the Camera:**
    *   If using a **USB Webcam**: Plug it into one of the Blue USB 3.0 ports on the Raspberry Pi.
    *   If using a **Pi Camera Module**: Connect the ribbon cable to the camera port on the board (carefully!).
2.  **Connect to Network:**
    *   Plug in an **Ethernet cable** or connect to **WiFi** so you can see the dashboard on your laptop/phone.
3.  **Power Up:**
    *   Plug the **USB-C Power Supply** into the Raspberry Pi. This turns it on.

*Note: There are no complex loose wires or breadboards required for the basic version of this system.*

---

## 5. Software Explanation (How it Works)
This section explains the magic inside the code, simplified:

### A. The Master Switch: `start_system.sh`
This is a simple script that acts like the "ON" button for the whole system. When you run this file, it automatically starts the AI Brain and the Web Dashboard at the same time. You don't need to type multiple commands; just this one.

### B. The AI Brain: `ml2` Folder
Inside the `ml2` folder is the Python code that does the heavy lifting.
*   **`vehicle_direction_detector.py`**: This is the core intelligence.
    *   It draws a "virtual line" on the road video.
    *   It knows that **Left Lane traffic should move Up** (or away) and **Right Lane traffic should move Down** (or differently, depending on calibration).
    *   If a car moves in the opposite direction of what is expected, it flags it as **"WRONG WAY"**.
*   **`server.py`**: This acts as a messenger. It takes the video analysis and sends it out so the website can show it.

### C. The Visual Dashboard: `Vehicle-Wrong-Way-Detection` Folder
This is a **React Web Application**. It takes the data from the "AI Brain" and displays it beautifully on your screen. It shows the live video with boxes around cars and counters for "Correct" vs "Wrong" drivers.

---

## 6. How to Run the System

**Step 1: Open the Terminal**
On your Raspberry Pi or computer, open the command terminal.

**Step 2: Start the System**
Navigate to the project folder and run the start script:
```bash
./start_system.sh
```
*You will see messages like "Starting Backend..." and "Starting React Application...".*

**Step 3: View the Dashboard**
Open a web browser (like Chrome or Firefox) and go to:
`http://localhost:3000`

**Step 4: Stopping the System**
To stop everything, go back to the terminal window and press **Ctrl+C**. The script will automatically clean up and close all the programs.
