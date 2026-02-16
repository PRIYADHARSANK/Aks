# Vehicle Wrong-Way Detection Demo

Smart Real-Time Traffic Monitoring System with React and Tailwind CSS

## Features

- 🚗 Real-time vehicle detection and tracking
- 🚨 Automatic wrong-way traffic alerts
- 📋 License plate recognition (ALPR/ANPR)
- 📊 Live statistics dashboard
- 💾 MySQL database integration
- 📥 Export detection data as JSON
- 🎯 Multiple vehicle types (Car, Truck, Bus, SUV, Van)
- 📈 FPS monitoring

## Project Structure

```
├── public/
│   └── index.html
├── src/
│   ├── components/
│   ├── models/
│   │   └── Vehicle.js         # Vehicle class with drawing methods
│   ├── utils/
│   │   └── helpers.js         # Helper functions
│   ├── App.js                 # Main component
│   ├── index.js               # React entry point
│   └── index.css              # Tailwind styles
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## Usage

1. **Start Simulation**: Click the "Start" button to begin vehicle detection
2. **MySQL Connection**: Configure and connect to your MySQL database
3. **Monitor Traffic**: Watch real-time vehicle detection on the canvas
4. **View Alerts**: Wrong-way vehicles trigger immediate alerts
5. **Export Data**: Export all detections and alerts as JSON

## Technology Stack

- **React 18**: UI framework
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Canvas API**: Real-time visualization
- **MySQL**: Database (optional)

## Database Configuration

Default MySQL settings:
- Host: `localhost`
- Port: `3306`
- Database: `traffic_monitoring`
- Username: `root`

## License

MIT License
