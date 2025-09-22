// src/components/VisualizationCanvas.tsx

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import type { AnimationState, EasingFunction, Shape, VisualizationData } from '../types';

interface Props {
  visualization: VisualizationData | null;
  animationState: AnimationState;
  width?: number;
  height?: number;
}

const VisualizationCanvas: React.FC<Props> = ({ 
  visualization, 
  animationState, 
  width = 800, 
  height = 600 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Easing functions
  const easingFunctions = useMemo(() => ({
    linear: (t: number) => t,
    'ease-in': (t: number) => t * t,
    'ease-out': (t: number) => t * (2 - t),
    'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  }), []);

  const interpolateValue = useCallback((
    from: number | string,
    to: number | string,
    progress: number,
    easing: EasingFunction = 'linear'
  ): number | string => {
    if (typeof from === 'string' || typeof to === 'string') {
      // Handle color interpolation
      return progress < 0.5 ? from : to;
    }

    const easingFn = easingFunctions[easing];
    const easedProgress = easingFn(progress);
    return from + (to - from) * easedProgress;
  }, [easingFunctions]);

  const getAnimatedProps = useCallback((shape: Shape, currentTime: number) => {
    const animatedProps = { ...shape.props };

    shape.animations.forEach(animation => {
      const { property, from, to, start, end, easing } = animation;
      
      if (currentTime >= start && currentTime <= end) {
        const duration = end - start;
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        const animatedValue = interpolateValue(from, to, progress, easing);
        (animatedProps as any)[property] = animatedValue;
      } else if (currentTime > end) {
        (animatedProps as any)[property] = to;
      } else {
        (animatedProps as any)[property] = from;
      }
    });

    return animatedProps;
  }, [interpolateValue]);

  const drawShape = useCallback((
    ctx: CanvasRenderingContext2D,
    shape: Shape,
    currentTime: number
  ) => {
    const props = getAnimatedProps(shape, currentTime);
    
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
    if (props.fill) {
      ctx.fillStyle = props.fill;
    }
    
    if (props.stroke) {
      ctx.strokeStyle = props.stroke;
      ctx.lineWidth = props.strokeWidth || 1;
    }

    // Draw based on shape type
    switch (shape.type) {
      case 'circle':
        if (props.r) {
          ctx.beginPath();
          ctx.arc(0, 0, props.r, 0, 2 * Math.PI);
          if (props.fill) ctx.fill();
          if (props.stroke) ctx.stroke();
        }
        break;

      case 'rectangle':
        if (props.width && props.height) {
          ctx.beginPath();
          ctx.rect(-props.width / 2, -props.height / 2, props.width, props.height);
          if (props.fill) ctx.fill();
          if (props.stroke) ctx.stroke();
        }
        break;

      case 'text':
        if (props.text) {
          ctx.font = `${props.fontSize || 16}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          if (props.fill) {
            ctx.fillText(props.text, 0, 0);
          }
          if (props.stroke) {
            ctx.strokeText(props.text, 0, 0);
          }
        }
        break;

      case 'line':
        ctx.beginPath();
        ctx.moveTo(-50, 0);
        ctx.lineTo(50, 0);
        if (props.stroke) ctx.stroke();
        break;

      case 'arrow':
        // Simple arrow implementation
        ctx.beginPath();
        ctx.moveTo(-30, 0);
        ctx.lineTo(20, 0);
        ctx.lineTo(10, -10);
        ctx.moveTo(20, 0);
        ctx.lineTo(10, 10);
        if (props.stroke) ctx.stroke();
        break;

      default:
        console.warn(`Unknown shape type: ${shape.type}`);
    }

    ctx.restore();
  }, [getAnimatedProps]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx || !visualization) {
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw all shapes
    visualization.shapes.forEach(shape => {
      drawShape(ctx, shape, animationState.currentTime);
    });
  }, [visualization, animationState.currentTime, width, height, drawShape]);

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

  // Initial render
  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-auto border border-gray-100 rounded-lg"
          style={{ maxWidth: '100%' }}
        />
      </div>
      {visualization && (
        <p className="mt-3 text-sm text-gray-600 text-center px-4">
          {visualization.description}
        </p>
      )}
    </div>
  );
};

export default VisualizationCanvas;