// Enhanced drawing functions for all shape types
function drawCircle(ctx: CanvasRenderingContext2D, props: any) {
  const radius = props.radius || props.r || 20;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, 2 * Math.PI);
  if (props.color || props.fill) ctx.fill();
  if (props.stroke) ctx.stroke();
}

function drawRectangle(ctx: CanvasRenderingContext2D, props: any) {
  if (props.width && props.height) {
    const x = -props.width / 2;
    const y = -props.height / 2;
    
    if (props.cornerRadius) {
      // Rounded rectangle
      const radius = Math.min(props.cornerRadius, props.width / 2, props.height / 2);
      ctx.beginPath();
      ctx.roundRect(x, y, props.width, props.height, radius);
    } else {
      ctx.beginPath();
      ctx.rect(x, y, props.width, props.height);
    }
    
    if (props.color || props.fill) ctx.fill();
    if (props.stroke) ctx.stroke();
  }
}

function drawText(ctx: CanvasRenderingContext2D, props: any) {
  if (props.text) {
    const fontSize = props.fontSize || 16;
    const fontFamily = props.fontFamily || 'Arial';
    const fontWeight = props.fontWeight || 'normal';
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = props.textAlign || 'center';
    ctx.textBaseline = props.textBaseline || 'middle';
    
    if (props.color || props.fill) {
      ctx.fillText(props.text, 0, 0);
    }
    if (props.stroke) {
      ctx.strokeText(props.text, 0, 0);
    }
  }
}

function drawLine(ctx: CanvasRenderingContext2D, props: any) {
  const startX = props.startX || -50;
  const startY = props.startY || 0;
  const endX = props.endX || props.x2 || 50;
  const endY = props.endY || props.y2 || 0;
  
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  
  if (props.stroke || props.color) {
    ctx.strokeStyle = props.stroke || props.color;
    ctx.stroke();
  }
}

function drawArrow(ctx: CanvasRenderingContext2D, props: any) {
  const startX = props.startX || props.dx ? -props.dx/2 : -30;
  const startY = props.startY || props.dy ? -props.dy/2 : 0;
  const endX = props.endX || props.dx || 30;
  const endY = props.endY || props.dy || 0;
  const headSize = props.headSize || props.headlen || 10;
  const headAngle = props.headAngle || Math.PI / 6;
  
  ctx.beginPath();
  // Arrow shaft
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  
  // Arrow head
  const angle = Math.atan2(endY - startY, endX - startX);
  ctx.lineTo(
    endX - headSize * Math.cos(angle - headAngle),
    endY - headSize * Math.sin(angle - headAngle)
  );
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headSize * Math.cos(angle + headAngle),
    endY - headSize * Math.sin(angle + headAngle)
  );
  
  if (props.stroke || props.color) {
    ctx.strokeStyle = props.stroke || props.color;
    ctx.stroke();
  }
}

function drawEllipse(ctx: CanvasRenderingContext2D, props: any) {
  const rx = props.rx || props.r || 30;
  const ry = props.ry || props.r || 20;
  
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, 2 * Math.PI);
  if (props.color || props.fill) ctx.fill();
  if (props.stroke) ctx.stroke();
}

function drawTriangle(ctx: CanvasRenderingContext2D, props: any) {
  const size = props.radius || props.r || props.size || 30;
  
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(-size * Math.sin(2 * Math.PI / 3), size * Math.cos(2 * Math.PI / 3));
  ctx.lineTo(size * Math.sin(2 * Math.PI / 3), size * Math.cos(2 * Math.PI / 3));
  ctx.closePath();
  
  if (props.color || props.fill) ctx.fill();
  if (props.stroke) ctx.stroke();
}

function drawStar(ctx: CanvasRenderingContext2D, props: any) {
  const outerRadius = props.radius || props.r || 30;
  const innerRadius = props.innerRadius || outerRadius / 2;
  const points = props.sides || props.points || 5;
  
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  
  if (props.color || props.fill) ctx.fill();
  if (props.stroke) ctx.stroke();
}

function drawPolygon(ctx: CanvasRenderingContext2D, props: any) {
  if (props.points && Array.isArray(props.points)) {
    // Custom polygon from points
    ctx.beginPath();
    props.points.forEach((point: any, index: number) => {
      const x = point.x || 0;
      const y = point.y || 0;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  } else {
    // Regular polygon
    const sides = props.sides || 6;
    const radius = props.radius || props.r || 30;
    
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  
  if (props.color || props.fill) ctx.fill();
  if (props.stroke) ctx.stroke();
}

function drawArc(ctx: CanvasRenderingContext2D, props: any) {
  const radius = props.radius || props.r || 30;
  const startAngle = props.startAngle || 0;
  const endAngle = props.endAngle || Math.PI;
  const clockwise = props.clockwise !== false;
  
  ctx.beginPath();
  ctx.arc(0, 0, radius, startAngle, endAngle, !clockwise);
  
  if (props.color || props.fill) ctx.fill();
  if (props.stroke) ctx.stroke();
}

function drawWave(ctx: CanvasRenderingContext2D, props: any) {
  const amplitude = props.amplitude || 20;
  const frequency = props.frequency || 0.02;
  const phase = props.phase || 0;
  const waveLength = props.waveLength || props.length || 200;
  const startX = -waveLength / 2;
  
  ctx.beginPath();
  ctx.moveTo(startX, 0);
  
  for (let x = 0; x <= waveLength; x += 2) {
    const y = amplitude * Math.sin(frequency * x + phase);
    ctx.lineTo(startX + x, y);
  }
  
  if (props.stroke || props.color) {
    ctx.strokeStyle = props.stroke || props.color;
    ctx.stroke();
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, props: any) {
  const rows = props.rows || 5;
  const cols = props.cols || 5;
  const cellWidth = props.cellWidth || 30;
  const cellHeight = props.cellHeight || 30;
  const totalWidth = cols * cellWidth;
  const totalHeight = rows * cellHeight;
  const startX = -totalWidth / 2;
  const startY = -totalHeight / 2;
  
  ctx.strokeStyle = props.gridStroke || props.stroke || '#ccc';
  ctx.lineWidth = props.strokeWidth || 1;
  ctx.beginPath();
  
  // Vertical lines
  for (let i = 0; i <= cols; i++) {
    const x = startX + i * cellWidth;
    ctx.moveTo(x, startY);
    ctx.lineTo(x, startY + totalHeight);
  }
  
  // Horizontal lines
  for (let i = 0; i <= rows; i++) {
    const y = startY + i * cellHeight;
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + totalWidth, y);
  }
  
  ctx.stroke();
}

function drawVector(ctx: CanvasRenderingContext2D, props: any) {
  const magnitude = props.magnitude || props.length || 50;
  const angle = ((props.angle || 0) * Math.PI) / 180;
  const endX = magnitude * Math.cos(angle);
  const endY = magnitude * Math.sin(angle);
  const headSize = props.headSize || 10;
  
  // Vector line
  ctx.strokeStyle = props.vectorColor || props.color || props.stroke || '#ff6b6b';
  ctx.lineWidth = props.strokeWidth || 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  
  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headSize * Math.cos(angle - Math.PI / 6),
    endY - headSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headSize * Math.cos(angle + Math.PI / 6),
    endY - headSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
  
  // Show components if requested
  if (props.showComponents) {
    ctx.strokeStyle = props.stroke || '#999';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // X component
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(endX, 0);
    ctx.stroke();
    
    // Y component
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    ctx.setLineDash([]);
  }
}

function drawMolecule(ctx: CanvasRenderingContext2D, props: any) {
  const atoms = props.atoms || [];
  const bonds = props.bonds || [];
  
  // Draw bonds first
  bonds.forEach((bond: any) => {
    const atom1 = atoms[bond.from];
    const atom2 = atoms[bond.to];
    if (atom1 && atom2) {
      ctx.strokeStyle = props.bondColor || props.stroke || '#333';
      ctx.lineWidth = bond.type === 'double' ? 3 : bond.type === 'triple' ? 5 : 2;
      ctx.beginPath();
      ctx.moveTo(atom1.x, atom1.y);
      ctx.lineTo(atom2.x, atom2.y);
      ctx.stroke();
    }
  });
  
  // Draw atoms
  atoms.forEach((atom: any) => {
    ctx.fillStyle = getAtomColor(atom.element) || props.fill || '#4ecdc4';
    ctx.beginPath();
    ctx.arc(atom.x, atom.y, atom.radius || 8, 0, 2 * Math.PI);
    ctx.fill();
    
    if (atom.element) {
      ctx.fillStyle = atom.textColor || '#fff';
      ctx.font = `${atom.fontSize || 10}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(atom.element, atom.x, atom.y);
    }
  });
}

function drawBeam(ctx: CanvasRenderingContext2D, props: any) {
  const startX = props.startX || -50;
  const startY = props.startY || 0;
  const endX = props.endX || props.x2 || 50;
  const endY = props.endY || props.y2 || 0;
  const beamWidth = props.beamWidth || props.width || 5;
  const segments = props.segments || 1;
  
  ctx.strokeStyle = props.beamColor || props.color || props.stroke || '#ffd93d';
  ctx.lineWidth = beamWidth;
  ctx.lineCap = 'round';
  
  if (segments === 1) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  } else {
    const segmentLength = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2) / segments;
    ctx.setLineDash([segmentLength / 2, segmentLength / 2]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawParticle(ctx: CanvasRenderingContext2D, props: any) {
  const count = props.particleCount || props.count || 10;
  const size = props.particleSize || props.size || 3;
  const spread = props.spread || 30;
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI + (props.angleOffset || 0);
    const distance = Math.random() * spread + (props.minDistance || 10);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    
    ctx.fillStyle = props.particleColor || props.color || props.fill || '#ff6b6b';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function drawOrbit(ctx: CanvasRenderingContext2D, props: any) {
  const centerX = props.centerX || 0;
  const centerY = props.centerY || 0;
  const radius = props.orbitRadius || props.radius || 50;
  const showPath = props.showPath !== false;
  
  // Draw orbit path
  if (showPath) {
    ctx.strokeStyle = props.pathColor || props.stroke || '#ddd';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  // Draw orbiting object
  ctx.fillStyle = props.color || props.fill || '#4ecdc4';
  ctx.beginPath();
  ctx.arc(0, 0, props.r || props.size || 5, 0, 2 * Math.PI);
  ctx.fill();
}

function drawPendulum(ctx: CanvasRenderingContext2D, props: any) {
  const pivotX = props.pivotX || props.centerX || 0;
  const pivotY = props.pivotY || props.centerY || -100;
  const stringColor = props.stringColor || props.stroke || '#333';
  const bobColor = props.bobColor || props.color || props.fill || '#ff6b6b';
  const bobRadius = props.bobRadius || props.r || 15;
  
  // Draw string
  ctx.strokeStyle = stringColor;
  ctx.lineWidth = props.stringWidth || 2;
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(0, 0);
  ctx.stroke();
  
  // Draw pivot
  ctx.fillStyle = props.pivotColor || '#666';
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, props.pivotRadius || 5, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw bob
  ctx.fillStyle = bobColor;
  ctx.beginPath();
  ctx.arc(0, 0, bobRadius, 0, 2 * Math.PI);
  ctx.fill();
}

function drawSpring(ctx: CanvasRenderingContext2D, props: any) {
  const startX = props.startX || -50;
  const startY = props.startY || 0;
  const endX = props.endX || props.x2 || 50;
  const endY = props.endY || props.y2 || 0;
  const coils = props.coils || props.turns || 8;
  const amplitude = props.amplitude || props.coilSize || 10;
  
  ctx.strokeStyle = props.color || props.stroke || '#666';
  ctx.lineWidth = props.strokeWidth || 2;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  
  const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
  const angle = Math.atan2(endY - startY, endX - startX);
  
  for (let i = 0; i <= coils * 2; i++) {
    const progress = i / (coils * 2);
    const springX = startX + progress * length * Math.cos(angle);
    const springY = startY + progress * length * Math.sin(angle);
    
    const perpX = springX + amplitude * Math.sin(i * Math.PI) * Math.cos(angle + Math.PI / 2);
    const perpY = springY + amplitude * Math.sin(i * Math.PI) * Math.sin(angle + Math.PI / 2);
    
    ctx.lineTo(perpX, perpY);
  }
  
  ctx.stroke();
}

function drawPath(ctx: CanvasRenderingContext2D, props: any) {
  if (props.pathData) {
    // For now, this is a placeholder - you might want to implement SVG path parsing
    // or use Path2D if you need complex paths
    try {
      const path = new Path2D(props.pathData);
      if (props.color || props.fill) {
        ctx.fillStyle = props.color || props.fill;
        ctx.fill(path);
      }
      if (props.stroke) {
        ctx.strokeStyle = props.stroke;
        ctx.stroke(path);
      }
    } catch (error) {
      console.warn('Path2D not supported or invalid path data:', error);
    }
  }
}

function getAtomColor(element: string): string {
  const colors: { [key: string]: string } = {
    H: '#ffffff',
    C: '#404040',
    N: '#3050f8',
    O: '#ff0d0d',
    F: '#90e050',
    P: '#ff8000',
    S: '#ffff30',
    Cl: '#1ff01f',
    Na: '#ab5cf2',
    Ca: '#3dff00',
    Fe: '#e06633',
    Cu: '#c88033',
    Zn: '#7d80b0',
  };
  return colors[element] || '#4ecdc4';
}

export { drawArc, drawArrow, drawBeam, drawCircle, drawEllipse,
    drawGrid, drawLine, drawMolecule, drawOrbit, drawParticle, drawPath, 
    drawPendulum, drawPolygon, drawRectangle, drawSpring, drawStar, getAtomColor,
    drawText, drawTriangle, drawWave, drawVector
}