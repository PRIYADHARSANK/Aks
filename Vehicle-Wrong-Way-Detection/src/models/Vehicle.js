import { generateLicensePlate, getVehicleType } from '../utils/helpers';

export class Vehicle {
  constructor(x, y, direction, lane, isWrongWay = false) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;
    this.direction = direction;
    this.speed = isWrongWay ? 4 + Math.random() * 3 : 3.5 + Math.random() * 3.5;
    this.lane = lane;
    this.isWrongWay = isWrongWay;
    this.color = isWrongWay ? '#ef4444' : '#3b82f6';
    this.id = Math.random().toString(36).substr(2, 9);
    this.detectionConfidence = 0.85 + Math.random() * 0.14;
    this.trajectory = [];
    this.alertGenerated = false;
    this.licensePlate = generateLicensePlate();
    this.plateConfidence = 0.75 + Math.random() * 0.24;
    this.plateRecognized = Math.random() < 0.85;
    this.vehicleType = getVehicleType();
    this.logged = false;
  }

  update() {
    this.trajectory.push({ x: this.x, y: this.y });
    if (this.trajectory.length > 10) this.trajectory.shift();

    if (this.direction === 'down') {
      this.y += this.speed;
    } else {
      this.y -= this.speed;
    }
  }

  draw(ctx) {
    ctx.strokeStyle = this.isWrongWay ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.trajectory.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x + this.width / 2, point.y + this.height / 2);
      else ctx.lineTo(point.x + this.width / 2, point.y + this.height / 2);
    });
    ctx.stroke();

    // Draw realistic vehicle based on type
    this.drawRealisticVehicle(ctx);

    // Draw bounding box
    ctx.strokeStyle = this.isWrongWay ? '#ef4444' : '#10b981';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    const label = `${this.isWrongWay ? 'WRONG WAY' : 'Normal'} ${(this.detectionConfidence * 100).toFixed(1)}%`;
    const plateLabel = this.plateRecognized ? this.licensePlate : 'N/A';
    
    ctx.fillStyle = this.isWrongWay ? '#ef4444' : '#10b981';
    ctx.fillRect(this.x - 5, this.y - 50, 150, 40);
    ctx.fillStyle = 'white';
    ctx.font = '11px Arial';
    ctx.fillText(label, this.x, this.y - 33);
    ctx.font = '10px Arial';
    ctx.fillText(`${this.vehicleType} - ${plateLabel}`, this.x, this.y - 18);
    ctx.fillText(`${(this.plateConfidence * 100).toFixed(0)}% conf`, this.x, this.y - 8);

    ctx.fillStyle = this.isWrongWay ? '#fca5a5' : '#93c5fd';
    ctx.beginPath();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    if (this.direction === 'down') {
      ctx.moveTo(centerX, centerY + 10);
      ctx.lineTo(centerX - 8, centerY - 5);
      ctx.lineTo(centerX + 8, centerY - 5);
    } else {
      ctx.moveTo(centerX, centerY - 10);
      ctx.lineTo(centerX - 8, centerY + 5);
      ctx.lineTo(centerX + 8, centerY + 5);
    }
    ctx.fill();
  }

  drawRealisticVehicle(ctx) {
    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.height;

    switch(this.vehicleType) {
      case 'Car':
        this.drawCar(ctx, x, y, w, h);
        break;
      case 'Truck':
        this.drawTruck(ctx, x, y, w, h);
        break;
      case 'Bus':
        this.drawBus(ctx, x, y, w, h);
        break;
      case 'SUV':
        this.drawSUV(ctx, x, y, w, h);
        break;
      case 'Van':
        this.drawVan(ctx, x, y, w, h);
        break;
      default:
        break;
    }
  }

  drawCar(ctx, x, y, w, h) {
    // Car body
    ctx.fillStyle = this.color;
    ctx.fillRect(x + 5, y + 15, w - 10, h - 20);
    
    // Car roof
    ctx.fillStyle = this.color;
    ctx.fillRect(x + 8, y + 20, w - 16, h - 45);
    
    // Windshield
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(x + 10, y + 22, w - 20, 12);
    ctx.fillRect(x + 10, y + h - 20, w - 20, 12);
    
    // Wheels
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + 2, y + 18, 6, 8);
    ctx.fillRect(x + w - 8, y + 18, 6, 8);
    ctx.fillRect(x + 2, y + h - 26, 6, 8);
    ctx.fillRect(x + w - 8, y + h - 26, 6, 8);
    
    // License plate
    if (this.plateRecognized) {
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(x + 8, y + h - 8, w - 16, 6);
      ctx.fillStyle = '#000000';
      ctx.font = '5px Arial';
      ctx.fillText(this.licensePlate, x + 10, y + h - 3);
    }
  }

  drawTruck(ctx, x, y, w, h) {
    // Truck cabin
    ctx.fillStyle = this.color;
    ctx.fillRect(x + 5, y + h - 30, w - 10, 25);
    
    // Truck cargo area
    ctx.fillStyle = this.isWrongWay ? '#dc2626' : '#2563eb';
    ctx.fillRect(x + 2, y + 5, w - 4, h - 37);
    
    // Cargo lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for(let i = y + 15; i < y + h - 35; i += 10) {
      ctx.beginPath();
      ctx.moveTo(x + 2, i);
      ctx.lineTo(x + w - 2, i);
      ctx.stroke();
    }
    
    // Windshield
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(x + 10, y + h - 28, w - 20, 10);
    
    // Wheels
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + 2, y + h - 16, 7, 10);
    ctx.fillRect(x + w - 9, y + h - 16, 7, 10);
    
    // License plate
    if (this.plateRecognized) {
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(x + 8, y + h - 6, w - 16, 5);
      ctx.fillStyle = '#000000';
      ctx.font = '4px Arial';
      ctx.fillText(this.licensePlate, x + 10, y + h - 2);
    }
  }

  drawBus(ctx, x, y, w, h) {
    // Bus body
    ctx.fillStyle = this.isWrongWay ? '#dc2626' : '#eab308';
    ctx.fillRect(x + 3, y + 8, w - 6, h - 15);
    
    // Windows
    ctx.fillStyle = '#87CEEB';
    const windowCount = 4;
    const windowHeight = 10;
    const windowWidth = (w - 12) / windowCount - 2;
    for(let i = 0; i < windowCount; i++) {
      ctx.fillRect(x + 6 + i * (windowWidth + 2), y + 12, windowWidth, windowHeight);
    }
    
    // Front windshield
    ctx.fillRect(x + 8, y + h - 20, w - 16, 12);
    
    // Wheels
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + 2, y + h - 12, 7, 8);
    ctx.fillRect(x + w - 9, y + h - 12, 7, 8);
    
    // Side stripe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 3, y + 25, w - 6, 2);
    
    // License plate
    if (this.plateRecognized) {
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(x + 8, y + h - 6, w - 16, 5);
      ctx.fillStyle = '#000000';
      ctx.font = '4px Arial';
      ctx.fillText(this.licensePlate, x + 10, y + h - 2);
    }
  }

  drawSUV(ctx, x, y, w, h) {
    // SUV body (larger than car)
    ctx.fillStyle = this.color;
    ctx.fillRect(x + 4, y + 12, w - 8, h - 16);
    
    // SUV roof
    ctx.fillStyle = this.color;
    ctx.fillRect(x + 7, y + 16, w - 14, h - 40);
    
    // Windshield
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(x + 9, y + 18, w - 18, 14);
    ctx.fillRect(x + 9, y + h - 22, w - 18, 14);
    
    // Wheels (larger for SUV)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + 1, y + 16, 7, 10);
    ctx.fillRect(x + w - 8, y + 16, 7, 10);
    ctx.fillRect(x + 1, y + h - 26, 7, 10);
    ctx.fillRect(x + w - 8, y + h - 26, 7, 10);
    
    // Roof rack
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 8, y + 14, w - 16, 3);
    
    // License plate
    if (this.plateRecognized) {
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(x + 8, y + h - 7, w - 16, 6);
      ctx.fillStyle = '#000000';
      ctx.font = '5px Arial';
      ctx.fillText(this.licensePlate, x + 10, y + h - 2);
    }
  }

  drawVan(ctx, x, y, w, h) {
    // Van body (box-like)
    ctx.fillStyle = this.color;
    ctx.fillRect(x + 3, y + 10, w - 6, h - 14);
    
    // Van windows
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(x + 8, y + 14, w - 16, 12);
    ctx.fillRect(x + 8, y + h - 20, w - 16, 10);
    
    // Side panels
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 5, y + 30, w - 10, h - 42);
    
    // Wheels
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + 2, y + h - 12, 7, 8);
    ctx.fillRect(x + w - 9, y + h - 12, 7, 8);
    
    // Side door line
    ctx.strokeStyle = '#888888';
    ctx.beginPath();
    ctx.moveTo(x + w/2, y + 28);
    ctx.lineTo(x + w/2, y + h - 14);
    ctx.stroke();
    
    // License plate
    if (this.plateRecognized) {
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(x + 8, y + h - 6, w - 16, 5);
      ctx.fillStyle = '#000000';
      ctx.font = '4px Arial';
      ctx.fillText(this.licensePlate, x + 10, y + h - 2);
    }
  }

  isOffScreen(height) {
    return this.y > height + 100 || this.y < -100;
  }
}
