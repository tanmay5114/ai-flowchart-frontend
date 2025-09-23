// src/components/VisualizationCanvas.tsx

import React, { useRef, useEffect, useCallback } from 'react';
import type { AnimationState, VisualizationData } from '../types';

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
    }

    // Draw based on object type
    switch (obj.type) {
      case 'circle':
        if (props.radius || props.r) {
          const radius = props.radius || props.r;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, 2 * Math.PI);
          if (props.color || props.fill) ctx.fill();
          if (props.stroke) ctx.stroke();
        }
        break;

      case 'rectangle':
      case 'rect':
        if (props.width && props.height) {
          ctx.beginPath();
          ctx.rect(-props.width / 2, -props.height / 2, props.width, props.height);
          if (props.color || props.fill) ctx.fill();
          if (props.stroke) ctx.stroke();
        }
        break;

      case 'text':
        if (props.text) {
          ctx.font = `${props.fontSize || 16}px ${props.fontFamily || 'Arial'}`;
          ctx.textAlign = props.textAlign || 'center';
          ctx.textBaseline = props.textBaseline || 'middle';
          if (props.color || props.fill) {
            ctx.fillText(props.text, 0, 0);
          }
          if (props.stroke) {
            ctx.strokeText(props.text, 0, 0);
          }
        }
        break;

      case 'line':
        ctx.beginPath();
        const startX = props.startX || -50;
        const startY = props.startY || 0;
        const endX = props.endX || 50;
        const endY = props.endY || 0;
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        if (props.stroke || props.color) {
          ctx.strokeStyle = props.stroke || props.color;
          ctx.stroke();
        }
        break;

      case 'arrow':
        // Simple arrow implementation
        const arrowStartX = props.startX || -30;
        const arrowStartY = props.startY || 0;
        const arrowEndX = props.endX || 20;
        const arrowEndY = props.endY || 0;
        const headSize = props.headSize || 10;
        
        ctx.beginPath();
        // Arrow shaft
        ctx.moveTo(arrowStartX, arrowStartY);
        ctx.lineTo(arrowEndX, arrowEndY);
        
        // Arrow head
        const angle = Math.atan2(arrowEndY - arrowStartY, arrowEndX - arrowStartX);
        ctx.lineTo(
          arrowEndX - headSize * Math.cos(angle - Math.PI / 6),
          arrowEndY - headSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(arrowEndX, arrowEndY);
        ctx.lineTo(
          arrowEndX - headSize * Math.cos(angle + Math.PI / 6),
          arrowEndY - headSize * Math.sin(angle + Math.PI / 6)
        );
        
        if (props.stroke || props.color) {
          ctx.strokeStyle = props.stroke || props.color;
          ctx.stroke();
        }
        break;

      case 'path':
        if (props.pathData) {
          // Simple path implementation - you might want to use Path2D for complex paths
          ctx.beginPath();
          // This is a simplified implementation
          if (props.color || props.fill) ctx.fill();
          if (props.stroke) ctx.stroke();
        }
        break;

      default:
        console.warn(`Unknown object type: ${obj.type}`);
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