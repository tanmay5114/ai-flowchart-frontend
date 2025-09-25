// src/components/VisualizationCanvas.tsx

import React, { useRef, useEffect } from 'react';
import mermaid from 'mermaid';

interface Props {
  chartDefinition: string;
  title?: string;
  description?: string;
  theme?: 'default' | 'dark' | 'forest' | 'neutral';
}

const sanitizeChartDefinition = (definition: string): string => {
  console.log('🧹 Sanitizing definition (length):', definition.length);
  console.log('🧹 Raw definition:', JSON.stringify(definition));
  
  // Check if definition seems truncated
  if (definition.includes('{') && !definition.includes('}')) {
    console.warn('⚠️ Chart definition appears truncated - missing closing braces');
  }
  
  if (definition.includes('[') && definition.match(/\[/g)?.length !== definition.match(/\]/g)?.length) {
    console.warn('⚠️ Chart definition appears truncated - mismatched brackets');
  }
  
  return definition
    .replace(/;(\s*$)/gm, '$1')
    .replace(/\[([^[\]]*)\(([^)]*)\)([^[\]]*)\]/g, '["$1$2$3"]')
    .replace(/\[([^[\]"]*[,&<>'"()][^[\]"]*)\]/g, '["$1"]')
    .replace(/\[""([^"]*)""]/g, '["$1"]')
    .trim();
};

const VisualizationCanvas: React.FC<Props> = ({ 
  chartDefinition,
  title,
  description,
  theme = 'default'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sanitizedDefinition = sanitizeChartDefinition(chartDefinition);

  useEffect(() => {
    console.log('VisualizationCanvas useEffect triggered');
    console.log('Chart definition received:', sanitizedDefinition);
    console.log('Container ref:', containerRef.current);

    if (!containerRef.current || !sanitizedDefinition) {
      console.log('Missing container or chart definition');
      return;
    }

    mermaid.initialize({
      startOnLoad: false,
      theme,
      securityLevel: 'loose',
      fontFamily: 'Arial, sans-serif',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true
      }
    });

    const renderChart = async () => {
      try {
        console.log('Starting chart render...');
        if (containerRef.current) {
          containerRef.current.innerHTML = 'Rendering...';
          const uniqueId = 'chart-' + Date.now();
          console.log('Rendering with ID:', uniqueId);
          
          const { svg } = await mermaid.render(uniqueId, sanitizedDefinition);
          console.log('Mermaid render successful, SVG length:', svg.length);
          
          containerRef.current.innerHTML = svg;
          console.log('Chart rendered successfully');
        }
      } catch (error) {
        console.error('Mermaid render error:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<div style="color: red; text-align: center; padding: 20px;">Chart Error: ${error}</div>`;
        }
      }
    };

    // Add delay to ensure DOM is ready
    setTimeout(renderChart, 200);
  }, [sanitizedDefinition, theme]);

  return (
    <div style={{ width: '100%', height: '100%', padding: '20px', boxSizing: 'border-box' }}>
      {title && (
        <h3 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
          {title}
        </h3>
      )}
      
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: 'calc(100% - 80px)', 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: 'white',
          overflow: 'auto'
        }}
      >
        {!sanitizedDefinition ? 'Waiting for chart...' : 'Loading chart...'}
      </div>
      
      {description && (
        <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '14px', color: '#666' }}>
          {description}
        </p>
      )}
    </div>
  );
};

export default VisualizationCanvas;