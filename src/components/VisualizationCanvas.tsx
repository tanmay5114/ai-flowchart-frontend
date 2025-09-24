// src/components/VisualizationCanvas.tsx

import React, { useRef, useEffect, useCallback } from 'react';
import type { AnimationState, VisualizationData } from '../types';
import { drawArc, drawArrow, drawBeam, drawCircle, drawEllipse, drawGrid, drawLine, drawMolecule, drawOrbit, drawParticle, drawPath, drawPendulum, drawPolygon, drawRectangle, drawSpring, drawStar, drawText, drawTriangle, drawVector, drawWave } from '../services/helpers';

interface Props {
  visualization: VisualizationData | null;
  animationState: AnimationState;
  width?: number;
  height?: number;
}

interface VisualizationObject {
  id: string;
  type: string;
  properties: any;
}

interface Frame {
  timestamp: number;
  objects: VisualizationObject[];
}

const VisualizationCanvas: React.FC<Props> = ({ 
  visualization, 
  animationState, 
  width = 800, 
  height = 600 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Find the current frame based on animation time
  const getCurrentFrame = useCallback((currentTime: number): Frame | null => {
    if (!visualization?.frames || visualization.frames.length === 0) {
      return null;
    }

    // Find the frame at or before the current time
    let currentFrame = visualization.frames[0];
    
    for (const frame of visualization.frames) {
      if (frame.timestamp <= currentTime) {
        currentFrame = frame;
      } else {
        break;
      }
    }

    return currentFrame;
  }, [visualization?.frames]);

  const drawObject = useCallback((
    ctx: CanvasRenderingContext2D,
    obj: VisualizationObject
  ) => {
    const props = obj.properties;
    
    ctx.save();
    
    // Apply transformations
    if (props.x !== undefined && props.y !== undefined) {
      ctx.translate(props.x, props.y);
    }
    
    if (props.rotation) {
      ctx.rotate((props.rotation * Math.PI) / 180);
    }

    if(props.scale){
      ctx.scale(props.scale, props.scale);
    }
    
    if (props.opacity !== undefined) {
      ctx.globalAlpha = props.opacity;
    }

    // Set styles
    if (props.color || props.fill) {
      ctx.fillStyle = props.color || props.fill;
    }
    
    if (props.stroke) {
      ctx.strokeStyle = props.stroke;
      ctx.lineWidth = props.strokeWidth || 1;
      ctx.lineCap = props.lineCap || 'butt';
      if (props.dashPattern){
        ctx.setLineDash(props.dashPattern)
      }
    }

    // Draw based on object type
switch (obj.type) {
      case 'circle':
        drawCircle(ctx, props);
        break;
      case 'rectangle':
      case 'rect':
        drawRectangle(ctx, props);
        break;
      case 'text':
        drawText(ctx, props);
        break;
      case 'line':
        drawLine(ctx, props);
        break;
      case 'arrow':
        drawArrow(ctx, props);
        break;
      case 'ellipse':
        drawEllipse(ctx, props);
        break;
      case 'triangle':
        drawTriangle(ctx, props);
        break;
      case 'star':
        drawStar(ctx, props);
        break;
      case 'polygon':
        drawPolygon(ctx, props);
        break;
      case 'arc':
        drawArc(ctx, props);
        break;
      case 'wave':
        drawWave(ctx, props);
        break;
      case 'grid':
        drawGrid(ctx, props);
        break;
      case 'vector':
        drawVector(ctx, props);
        break;
      case 'molecule':
        drawMolecule(ctx, props);
        break;
      case 'beam':
        drawBeam(ctx, props);
        break;
      case 'particle':
        drawParticle(ctx, props);
        break;
      case 'orbit':
        drawOrbit(ctx, props);
        break;
      case 'pendulum':
        drawPendulum(ctx, props);
        break;
      case 'spring':
        drawSpring(ctx, props);
        break;
      case 'path':
        drawPath(ctx, props);
        break;
      default:
        console.warn(`Unknown object type: ${obj.type}`);
    }

        // Reset line dash
    if (props.dashPattern) {
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) {
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Get current frame
    const currentFrame = getCurrentFrame(animationState.currentTime);
    
    if (currentFrame) {
      // Draw all objects in the current frame
      currentFrame.objects.forEach(obj => {
        drawObject(ctx, obj);
      });
    } else {
      // No frame data - show placeholder
      ctx.fillStyle = '#666666';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No visualization data', width / 2, height / 2);
    }
  }, [getCurrentFrame, animationState.currentTime, width, height, drawObject]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render();
      if (animationState.isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationState.isPlaying) {
      animate();
    } else {
      render(); // Render current frame when paused
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationState.isPlaying, render]);

  // Initial render and render on time changes
  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        {visualization ? (
          <>
            <div className="mb-3 text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                {visualization.title}
              </h3>
            </div>
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="w-full h-auto border border-gray-100 rounded-lg"
              style={{ maxWidth: '100%' }}
            />
            <div className="mt-3 text-sm text-gray-600 text-center px-4">
              {visualization.description}
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              Frame: {getCurrentFrame(animationState.currentTime)?.timestamp || 0}ms / {visualization.duration}ms
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">🎬</div>
              <div>Waiting for visualization...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationCanvas;