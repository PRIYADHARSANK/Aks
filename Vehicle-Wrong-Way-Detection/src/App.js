import React, { useState, useRef, useEffect } from 'react';
import { Camera, AlertTriangle, Activity, Car, TrendingUp, Download, Play, Pause, RefreshCw, FileText, Clock, Database, CheckCircle, XCircle, FileJson, Upload, X } from 'lucide-react';
import { Vehicle } from './models/Vehicle';
import { exportToPDF } from './utils/pdfExport';

const WrongWayDetectionDemo = () => {
  const canvasRef = useRef(null);
  const videoCanvasRef = useRef(null);
  const videoRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [detections, setDetections] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const [useVideoFile, setUseVideoFile] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoFileName, setVideoFileName] = useState('');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const animationRef = useRef(null);
  const videoAnimationRef = useRef(null);
  const vehiclesRef = useRef([]);
  const videoVehiclesRef = useRef([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const [stats, setStats] = useState({
    totalVehicles: 0,
    wrongWayVehicles: 0,
    platesRecognized: 0,
    accuracy: 98.5,
    fps: 0
  });
  const [dbConfig, setDbConfig] = useState({
    host: 'localhost',
    port: '3306',
    database: 'traffic_monitoring',
    username: '',
    password: ''
  });
  const [showDbConfig, setShowDbConfig] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [dbMessage, setDbMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedVideoUrl, setProcessedVideoUrl] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);


  const connectToDatabase = async () => {
    // Simulated connection for demo (no real DB client in-browser)
    setIsConnected(true);
    setDbMessage('✅ Connected (simulated)');
    setTimeout(() => setDbMessage(''), 2500);
    return true;
  };

  const disconnectFromDatabase = () => {
    setIsConnected(false);
    setDbMessage('❌ Disconnected');
    setTimeout(() => setDbMessage(''), 2000);
    return true;
  };

  const saveDetectionToDatabase = (detection) => {
    // No-op local simulation: avoid heavy console logging in hot loops
    return true;
  };

  const saveAlertToDatabase = (alert) => {
    // No-op local simulation
    return true;
  };

  const exportDatabaseData = async () => {
    try {
      const now = new Date();
      const exportData = {
        exportInfo: {
          exportTime: now.toISOString(),
          exportDate: now.toLocaleDateString(),
          exportTimeFormatted: now.toLocaleTimeString(),
          systemName: "Smart Wrong-Way Vehicle Detection System",
          databaseConnected: isConnected
        },
        summary: {
          totalVehiclesDetected: stats.totalVehicles,
          wrongWayVehicles: stats.wrongWayVehicles,
          platesRecognized: stats.platesRecognized,
          systemAccuracy: stats.accuracy,
          currentFPS: stats.fps
        },
        vehicleDetections: recentDetections.map((detection, idx) => ({
          recordNumber: idx + 1,
          timestamp: detection.time,
          vehicleType: detection.vehicleType,
          licensePlate: detection.licensePlate,
          confidenceScore: `${(detection.confidence * 100).toFixed(2)}%`,
          plateConfidence: detection.plateConfidence ? `${(detection.plateConfidence * 100).toFixed(2)}%` : 'N/A',
          status: detection.status,
          lane: detection.lane
        })),
        wrongWayAlerts: alerts.map((alert, idx) => ({
          alertNumber: idx + 1,
          timestamp: alert.time,
          lane: alert.lane,
          licensePlate: alert.plate,
          confidenceScore: `${(alert.confidence * 100).toFixed(2)}%`,
          actionTaken: alert.action
        })),
        databaseConfig: isConnected ? {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username
        } : null
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `traffic_monitoring_export_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}.json`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDbMessage(`✅ Exported ${recentDetections.length} detections and ${alerts.length} alerts successfully!`);
      setTimeout(() => setDbMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting data:', error);
      setDbMessage('❌ Error exporting data');
      setTimeout(() => setDbMessage(''), 3000);
    }
  };

  const exportToPDFReport = async () => {
    try {
      const now = new Date();
      const exportData = {
        exportInfo: {
          exportTime: now.toISOString(),
          exportDate: now.toLocaleDateString(),
          exportTimeFormatted: now.toLocaleTimeString(),
          systemName: "Smart Wrong-Way Vehicle Detection System",
          databaseConnected: isConnected
        },
        summary: {
          totalVehiclesDetected: stats.totalVehicles,
          wrongWayVehicles: stats.wrongWayVehicles,
          platesRecognized: stats.platesRecognized,
          systemAccuracy: stats.accuracy,
          currentFPS: stats.fps
        },
        vehicleDetections: recentDetections.map((detection, idx) => ({
          recordNumber: idx + 1,
          timestamp: detection.time,
          vehicleType: detection.vehicleType,
          licensePlate: detection.licensePlate,
          confidenceScore: `${(detection.confidence * 100).toFixed(2)}%`,
          plateConfidence: detection.plateConfidence ? `${(detection.plateConfidence * 100).toFixed(2)}%` : 'N/A',
          status: detection.status,
          lane: detection.lane
        })),
        wrongWayAlerts: alerts.map((alert, idx) => ({
          alertNumber: idx + 1,
          timestamp: alert.time,
          lane: alert.lane,
          licensePlate: alert.plate,
          confidenceScore: `${(alert.confidence * 100).toFixed(2)}%`,
          actionTaken: alert.action
        })),
        databaseConfig: isConnected ? {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username
        } : null
      };

      setDbMessage('Generating PDF report...');
      const success = exportToPDF(exportData);

      if (success) {
        setDbMessage(`✅ PDF report exported successfully with ${recentDetections.length} detections and ${alerts.length} alerts!`);
        setTimeout(() => setDbMessage(''), 3000);
      } else {
        setDbMessage('❌ Error generating PDF report');
        setTimeout(() => setDbMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setDbMessage('❌ Error generating PDF');
      setTimeout(() => setDbMessage(''), 3000);
    }
  };

  const initSimulation = () => {
    vehiclesRef.current = [];
    setAlerts([]);
    setDetections([]);
    setRecentDetections([]);
    frameCountRef.current = 0;
    setStats(prev => ({ ...prev, totalVehicles: 0, wrongWayVehicles: 0, platesRecognized: 0, fps: 0 }));
  };

  const spawnVehicle = (canvas) => {
    const lanes = [
      { x: 150, direction: 'down', correctDirection: 'down', name: 'Lane 1' },
      { x: 220, direction: 'down', correctDirection: 'down', name: 'Lane 2' },
      { x: 450, direction: 'up', correctDirection: 'up', name: 'Lane 3' },
      { x: 520, direction: 'up', correctDirection: 'up', name: 'Lane 4' }
    ];

    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const isWrongWay = Math.random() < 0.15;
    const direction = isWrongWay ? (lane.correctDirection === 'down' ? 'up' : 'down') : lane.correctDirection;
    const y = direction === 'down' ? -60 : canvas.height + 60;

    const vehicle = new Vehicle(lane.x, y, direction, lane.name, isWrongWay);
    vehiclesRef.current.push(vehicle);

    setStats(prev => ({
      ...prev,
      totalVehicles: prev.totalVehicles + 1,
      wrongWayVehicles: isWrongWay ? prev.wrongWayVehicles + 1 : prev.wrongWayVehicles,
      platesRecognized: vehicle.plateRecognized ? prev.platesRecognized + 1 : prev.platesRecognized
    }));

    if (isWrongWay && !vehicle.alertGenerated) {
      vehicle.alertGenerated = true;
      const alert = {
        id: vehicle.id,
        time: new Date().toLocaleTimeString(),
        lane: lane.name,
        confidence: vehicle.detectionConfidence,
        plate: vehicle.plateRecognized ? vehicle.licensePlate : 'Unrecognized',
        action: 'Alert Sent to Traffic Control'
      };
      setAlerts(prev => [alert, ...prev.slice(0, 4)]);
      saveAlertToDatabase(alert);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setVideoFileName(file.name);
      setUseVideoFile(true);
      setIsRunning(false);
      setDetections([]);
      setAlerts([]);
      setRecentDetections([]);
      setProcessedVideoUrl(null);
      setStreamUrl(null);

      // Auto-upload and start streaming
      await startStreaming(file);
    } else {
      alert('Please select a valid video file');
    }
  };

  const startStreaming = async (file) => {
    setIsUploading(true);
    setDbMessage('Uploading video...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Upload the file first
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      const jobId = result.job_id;

      // 2. Set the MJPEG stream URL
      // This allows the browser to simply connect to the stream like an image
      setStreamUrl(`http://localhost:8000/stream/${jobId}`);
      setIsLiveStreaming(true);
      setDbMessage('⚡ Analysis Running: Streaming Real-Time Output...');
      setIsUploading(false);

    } catch (error) {
      console.error("Error:", error);
      setDbMessage(`❌ Error: ${error.message}`);
      setIsUploading(false);
    }
  };

  const processVideo = async (file) => {
    setIsUploading(true);
    setDbMessage('Uploading and processing video... (This might take a while)');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Connect to the local FastAPI backend
      const response = await fetch('http://localhost:8000/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Processing result:", result);

      if (result.status === 'completed') {
        const videoUrl = result.video_url;
        // Add timestamp to prevent caching issues
        const timestampedUrl = `${videoUrl}?t=${new Date().getTime()}`;
        setProcessedVideoUrl(timestampedUrl);
        setDbMessage('✅ Processing complete! Playing analyzed video.');

        // Auto-play the processed video
        // We use a small timeout to let the state update and render the new src
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().catch(err => console.log('Auto-play blocked:', err));
          }
        }, 500);

        // Populate stats from backend result
        if (result.stats) {
          // Update stats based on backend response
          // Flatten stats structure to match frontend expectations
          const totalCorrect = result.stats.left_lane.correct + result.stats.right_lane.correct;
          const totalWrong = result.stats.left_lane.wrong + result.stats.right_lane.wrong;
          const total = result.stats.left_lane.total + result.stats.right_lane.total;

          // Approximate accuracy
          const accuracy = total > 0 ? ((totalCorrect / total) * 100).toFixed(1) : 100;

          setStats(prev => ({
            ...prev,
            totalVehicles: total,
            wrongWayVehicles: totalWrong,
            accuracy: accuracy
          }));
        }
      } else {
        setDbMessage('❌ Processing failed: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error("Error uploading/processing:", error);
      setDbMessage(`❌ Error: ${error.message}. Is backend running?`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setDbMessage(''), 5000);
    }
  };

  const stopStreaming = () => {
    setIsLiveStreaming(false);
    setStreamUrl(null);
  };

  const handlePlayVideoDetection = () => {
    if (videoRef.current) {
      setIsVideoPlaying(true);
      setIsRunning(false);
      videoRef.current.play();
    }
  };

  const detectFromVideo = () => {
    const video = videoRef.current;
    const canvas = videoCanvasRef.current;

    if (!video || !canvas || video.paused) {
      return;
    }

    const ctx = canvas.getContext('2d');
    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = width;
    canvas.height = height;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, width, height);

    // Simulate vehicle detection on video frame
    if (Math.random() < 0.03 && videoVehiclesRef.current.length < 8) {
      const lanes = [
        { x: Math.floor(width * 0.15), direction: 'down', correctDirection: 'down', name: 'Lane 1' },
        { x: Math.floor(width * 0.25), direction: 'down', correctDirection: 'down', name: 'Lane 2' },
        { x: Math.floor(width * 0.65), direction: 'up', correctDirection: 'up', name: 'Lane 3' },
        { x: Math.floor(width * 0.75), direction: 'up', correctDirection: 'up', name: 'Lane 4' }
      ];

      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const isWrongWay = Math.random() < 0.15;
      const direction = isWrongWay ? (lane.correctDirection === 'down' ? 'up' : 'down') : lane.correctDirection;
      const y = direction === 'down' ? -60 : height + 60;

      const vehicle = new Vehicle(lane.x, y, direction, lane.name, isWrongWay);
      videoVehiclesRef.current.push(vehicle);

      if (isWrongWay) {
        const alert = {
          id: vehicle.id,
          time: new Date().toLocaleTimeString(),
          lane: lane.name,
          confidence: vehicle.detectionConfidence,
          plate: vehicle.plateRecognized ? vehicle.licensePlate : 'Unrecognized',
          action: 'Alert Sent to Traffic Control'
        };
        setAlerts(prev => [alert, ...prev.slice(0, 4)]);
        saveAlertToDatabase(alert);
      }
    }

    // Update and draw vehicles
    videoVehiclesRef.current = videoVehiclesRef.current.filter(vehicle => {
      vehicle.update();
      vehicle.draw(ctx);

      if (!vehicle.logged && vehicle.y > height * 0.3 && vehicle.y < height * 0.7) {
        vehicle.logged = true;
        const detection = {
          id: vehicle.id,
          time: new Date().toLocaleTimeString(),
          vehicleType: vehicle.vehicleType,
          licensePlate: vehicle.plateRecognized ? vehicle.licensePlate : 'N/A',
          confidence: vehicle.detectionConfidence,
          plateConfidence: vehicle.plateConfidence,
          status: vehicle.isWrongWay ? 'Wrong Direction' : 'Normal',
          lane: vehicle.lane
        };
        setRecentDetections(prev => [detection, ...prev.slice(0, 9)]);
        saveDetectionToDatabase(detection);
      }

      return !vehicle.isOffScreen(height);
    });

    const currentDetections = videoVehiclesRef.current.map(v => ({
      id: v.id,
      type: v.isWrongWay ? 'Wrong-Way' : 'Normal',
      confidence: v.detectionConfidence,
      lane: v.lane,
      plate: v.plateRecognized ? v.licensePlate : 'N/A',
      plateConf: v.plateConfidence
    }));
    setDetections(currentDetections);

    frameCountRef.current++;
    if (frameCountRef.current % 30 === 0) {
      setStats(prev => ({ ...prev, fps: Math.floor(30) }));
    }

    videoAnimationRef.current = requestAnimationFrame(detectFromVideo);
  };


  const handlePauseVideoDetection = () => {
    if (videoRef.current) {
      setIsVideoPlaying(false);
      videoRef.current.pause();
      if (videoAnimationRef.current) {
        cancelAnimationFrame(videoAnimationRef.current);
      }
    }
  };

  const handleRemoveVideo = () => {
    if (videoAnimationRef.current) {
      cancelAnimationFrame(videoAnimationRef.current);
    }
    setVideoFile(null);
    setVideoFileName('');
    setUseVideoFile(false);
    setIsVideoPlaying(false);
    setDetections([]);
    setAlerts([]);
    setRecentDetections([]);
    videoVehiclesRef.current = [];
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = '';
    }
  };

  const drawArrow = (ctx, x, y, direction) => {
    ctx.beginPath();
    if (direction === 'down') {
      ctx.moveTo(x, y + 20);
      ctx.lineTo(x - 15, y);
      ctx.lineTo(x + 15, y);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x - 15, y + 20);
      ctx.lineTo(x + 15, y + 20);
    }
    ctx.fill();
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 15]);
    [185, 485].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([]);
    for (let y = 50; y < canvas.height; y += 120) {
      drawArrow(ctx, 185, y, 'down');
      drawArrow(ctx, 485, y, 'up');
    }

    vehiclesRef.current = vehiclesRef.current.filter(vehicle => {
      vehicle.update();
      vehicle.draw(ctx);

      if (!vehicle.logged && vehicle.y > 200 && vehicle.y < 300) {
        vehicle.logged = true;
        const detection = {
          id: vehicle.id,
          time: new Date().toLocaleTimeString(),
          vehicleType: vehicle.vehicleType,
          licensePlate: vehicle.plateRecognized ? vehicle.licensePlate : 'N/A',
          confidence: vehicle.detectionConfidence,
          plateConfidence: vehicle.plateConfidence,
          status: vehicle.isWrongWay ? 'Wrong Direction' : 'Normal',
          lane: vehicle.lane
        };
        setRecentDetections(prev => [detection, ...prev.slice(0, 9)]);
        saveDetectionToDatabase(detection);
      }

      return !vehicle.isOffScreen(canvas.height);
    });

    const currentDetections = vehiclesRef.current.slice(0, 6).map(v => ({
      id: v.id,
      type: v.isWrongWay ? 'Wrong-Way' : 'Normal',
      confidence: v.detectionConfidence,
      lane: v.lane,
      plate: v.plateRecognized ? v.licensePlate : 'N/A',
      plateConf: v.plateConfidence
    }));
    setDetections(currentDetections);

    frameCountRef.current++;
    const now = Date.now();
    if (now - lastTimeRef.current >= 2000) {
      setStats(prev => ({ ...prev, fps: Math.round(frameCountRef.current / 2) }));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    if (Math.random() < 0.015 && vehiclesRef.current.length < 6) {
      spawnVehicle(canvas);
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isRunning) {
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning]);

  const toggleSimulation = () => setIsRunning(!isRunning);
  const resetSimulation = () => {
    setIsRunning(false);
    initSimulation();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Camera className="w-12 h-12 text-blue-400" />
            <h1 className="text-4xl font-bold">Smart Wrong-Way Vehicle Detection System</h1>
          </div>
          <p className="text-gray-300">Edge AI-Powered Real-Time Traffic Monitoring with MySQL Database Integration</p>
        </div>

        <div className="mb-6 bg-gray-800 rounded-lg p-4 border border-purple-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Database className="w-6 h-6 text-purple-400" />
              MySQL Database Connection
            </h2>
            <button
              onClick={() => setShowDbConfig(!showDbConfig)}
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-sm"
            >
              {showDbConfig ? 'Hide' : 'Show'} Config
            </button>
          </div>

          {showDbConfig && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Host"
                value={dbConfig.host}
                onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                className="px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                disabled={isConnected}
              />
              <input
                type="text"
                placeholder="Port"
                value={dbConfig.port}
                onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })}
                className="px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                disabled={isConnected}
              />
              <input
                type="text"
                placeholder="Database Name"
                value={dbConfig.database}
                onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                className="px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                disabled={isConnected}
              />
              <input
                type="text"
                placeholder="Username"
                value={dbConfig.username}
                onChange={(e) => setDbConfig({ ...dbConfig, username: e.target.value })}
                className="px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm"
                disabled={isConnected}
              />
              <input
                type="password"
                placeholder="Password"
                value={dbConfig.password}
                onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                className="px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm col-span-2"
                disabled={isConnected}
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={isConnected ? disconnectFromDatabase : connectToDatabase}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 ${isConnected
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-purple-600 hover:bg-purple-700'
                }`}
            >
              {isConnected ? <XCircle className="w-4 h-4" /> : <Database className="w-4 h-4" />}
              {isConnected ? 'Disconnect' : 'Connect to Database'}
            </button>

            {isConnected && (
              <button
                onClick={exportDatabaseData}
                className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
            )}

            <button
              onClick={exportToPDFReport}
              className="px-6 py-2 bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <FileJson className="w-4 h-4" />
              Export PDF
            </button>

            <div className="flex items-center gap-2">
              {isConnected ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-sm text-gray-300">
                {isConnected ? 'MySQL Connected' : 'Not Connected'}
              </span>
            </div>
          </div>

          {dbMessage && (
            <div className="mt-3 p-2 bg-gray-700 rounded text-sm text-gray-200">
              {dbMessage}
            </div>
          )}
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Car className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Total Vehicles</span>
            </div>
            <div className="text-3xl font-bold">{stats.totalVehicles}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-red-900">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-gray-400">Wrong-Way</span>
            </div>
            <div className="text-3xl font-bold text-red-400">{stats.wrongWayVehicles}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-yellow-900">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Plates Read</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">{stats.platesRecognized}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Accuracy</span>
            </div>
            <div className="text-3xl font-bold text-green-400">{stats.accuracy}%</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">FPS</span>
            </div>
            <div className="text-3xl font-bold text-purple-400">{stats.fps}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {/* Live Monitoring Tab */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Live Camera Feed - Highway Monitoring
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={toggleSimulation}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                      }`}
                    disabled={useVideoFile}
                  >
                    {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isRunning ? 'Pause' : 'Start'}
                  </button>
                  <button
                    onClick={resetSimulation}
                    className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center gap-2 disabled:opacity-50"
                    disabled={useVideoFile}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    onClick={() => videoFileInputRef.current?.click()}
                    className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Video
                  </button>
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {useVideoFile ? (
                <div className="space-y-3">
                  <div className="bg-gray-900 p-3 rounded-lg border border-purple-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm">
                        <p className="text-gray-400">Video Uploaded:</p>
                        <p className="text-white font-semibold">{videoFileName}</p>
                      </div>
                      <button
                        onClick={handleRemoveVideo}
                        className="p-2 bg-red-600 rounded-lg hover:bg-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="relative bg-black rounded-lg border-2 border-gray-600 overflow-hidden flex justify-center items-center min-h-[400px]">
                    {isLiveStreaming && streamUrl ? (
                      <img
                        src={streamUrl}
                        alt="Live Detection Stream"
                        className="w-full h-auto"
                        onError={(e) => {
                          console.error("Stream error", e);
                          setDbMessage("Stream connection lost.");
                        }}
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        src={processedVideoUrl || (videoFile ? URL.createObjectURL(videoFile) : '')}
                        className="w-full block"
                        controls
                        onEnded={() => setIsVideoPlaying(false)}
                      />
                    )}
                    <canvas
                      ref={videoCanvasRef}
                      className={`absolute inset-0 w-full h-full ${isLiveStreaming ? 'hidden' : ''}`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePlayVideoDetection}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isVideoPlaying ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                        }`}
                      disabled={isVideoPlaying}
                    >
                      <Play className="w-4 h-4" />
                      {isUploading ? 'Processing...' : 'Play Result'}
                    </button>
                    <button
                      onClick={handlePauseVideoDetection}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${!isVideoPlaying ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                        }`}
                      disabled={!isVideoPlaying}
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                  </div>
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={500}
                  className="w-full border-2 border-gray-600 rounded-lg"
                />
              )}

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Normal Traffic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Wrong-Way Vehicle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-300 rounded"></div>
                    <span>License Plate</span>
                  </div>
                </div>
                <div className="text-gray-400">
                  {useVideoFile ? 'Video Analysis' : 'YOLOv8 + DeepSORT + OCR'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                Active Detections ({detections.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {detections.length === 0 ? (
                  <p className="text-gray-400 text-sm">No vehicles detected</p>
                ) : (
                  detections.map((det, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded text-sm ${det.type === 'Wrong-Way' ? 'bg-red-900/30 border border-red-700' : 'bg-gray-700'
                        }`}
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold">{det.type}</span>
                        <span className="text-gray-400">{(det.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="text-gray-400">{det.lane}</div>
                      <div className="text-yellow-400 text-xs mt-1">
                        {det.plate !== 'N/A' ? `Plate: ${det.plate}` : 'Plate Not Read'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-red-900">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Alert Log
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="text-gray-400 text-sm">No alerts generated</p>
                ) : (
                  alerts.map((alert, idx) => (
                    <div key={idx} className="p-2 bg-red-900/30 rounded text-sm border border-red-700">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-red-400">WRONG WAY</span>
                        <span className="text-gray-400">{alert.time}</span>
                      </div>
                      <div className="text-gray-300">{alert.lane}</div>
                      <div className="text-yellow-400 text-xs mt-1">Plate: {alert.plate}</div>
                      <div className="text-gray-400 text-xs mt-1">{alert.action}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-blue-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-400" />
              Recent Vehicle Detections
            </h2>
            <button
              onClick={exportDatabaseData}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
            <button
              onClick={exportToPDFReport}
              className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <FileJson className="w-4 h-4" />
              Export PDF
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Time</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Vehicle Type</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">License Plate</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Confidence</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDetections.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-400">
                      No detections yet. Start the simulation to see vehicle data.
                    </td>
                  </tr>
                ) : (
                  recentDetections.map((detection, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-700 hover:bg-gray-750 transition-colors"
                    >
                      <td className="py-3 px-4">{detection.time}</td>
                      <td className="py-3 px-4">{detection.vehicleType}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono bg-yellow-900/30 px-2 py-1 rounded text-yellow-400">
                          {detection.licensePlate}
                        </span>
                      </td>
                      <td className="py-3 px-4">{(detection.confidence * 100).toFixed(1)}%</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${detection.status === 'Wrong Direction'
                            ? 'bg-red-600 text-white'
                            : 'bg-green-600 text-white'
                            }`}
                        >
                          {detection.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="font-semibold mb-2">About This Demo</h3>
          <p className="text-sm text-gray-300">
            This interactive simulation demonstrates real-time wrong-way vehicle detection with automatic license plate recognition (ALPR/ANPR) and MySQL database integration.
            The system uses YOLOv8 for vehicle detection, DeepSORT for tracking, OCR for license plate reading, and lane direction analysis
            to identify vehicles traveling against traffic flow. All detected vehicles are automatically saved to the MySQL database with
            complete information including vehicle type, license plate, confidence scores, and traffic status. Click "Export Log" to download
            the complete detection history as JSON.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WrongWayDetectionDemo;
