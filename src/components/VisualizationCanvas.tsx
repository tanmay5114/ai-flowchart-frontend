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
  
  let sanitized = definition;
  
  // Remove trailing semicolons at end of lines
  sanitized = sanitized.replace(/;(\s*$)/gm, '$1');
  
  // Handle problematic characters that can cause parsing issues
  // Escape or remove characters that Mermaid doesn't handle well
  sanitized = sanitized
    // Remove or escape problematic punctuation in labels
    .replace(/([A-Za-z0-9_]+)\s*\{\s*([^}]*[<>&"'`]+[^}]*)\s*\}/g, (nodeId, label) => {
      // Clean the label by removing/escaping problematic characters
      const cleanLabel = label
        .replace(/["'`]/g, '') // Remove quotes
        .replace(/[<>&]/g, '') // Remove HTML-like characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      return `${nodeId}{${cleanLabel}}`;
    })
    
    // Handle square bracket labels with problematic characters
    .replace(/\[([^[\]]*[<>&"'`]+[^[\]]*)\]/g, (label) => {
      const cleanLabel = label
        .replace(/["'`]/g, '') // Remove quotes
        .replace(/[<>&]/g, '') // Remove HTML-like characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      return `["${cleanLabel}"]`;
    })
    
    // Handle parentheses in labels that aren't properly quoted
    .replace(/\[([^[\]]*)\(([^)]*)\)([^[\]]*)\]/g, '["$1$2$3"]')
    
    // Quote labels with special characters (commas, ampersands, etc.)
    .replace(/\[([^[\]"]*[,&<>'"()]+[^[\]"]*)\]/g, '["$1"]')
    
    // Fix double-quoted labels
    .replace(/\[""([^"]*)""]/g, '["$1"]')
    
    // Handle curly brace labels with special characters
    .replace(/\{([^{}]*[,&<>'"()]+[^{}]*)\}/g, '{"$1"}')
    
    // Remove any stray control characters or non-printable characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    
    // Fix common arrow syntax issues
    .replace(/--+>/g, '-->')
    .replace(/-+>/g, '-->')
    .replace(/=+>/g, '==>')
    
    // Ensure proper spacing around arrows
    .replace(/(\w)\s*-->\s*(\w)/g, '$1 --> $2')
    .replace(/(\w)\s*==>\s*(\w)/g, '$1 ==> $2')
    
    // Handle node definitions that might have syntax issues
    // Fix cases where there might be extra characters after node definitions
    .replace(/([A-Za-z0-9_]+)(\{[^}]*\}|\[[^\]]*\]|\([^)]*\))\s*([^-=\s][^-=\n\r]*?)(\s*(?:-->|==>|\n|\r|$))/g, 
      (match, nodeId, shape, extra, ending) => {
        // If there's extra content that's not a proper connection, remove it
        if (extra.trim() && !extra.match(/^(-->|==>)/)) {
          console.warn(`⚠️ Removing extra content after node ${nodeId}: "${extra.trim()}"`);
          return `${nodeId}${shape}${ending}`;
        }
        return match;
      })
    
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    
    // Remove empty lines and trim
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .trim();
  
  // Additional validation
  const lines = sanitized.split('\n');
  const problematicLines: string[] = [];
  
  lines.forEach((line, index) => {
    // Check for common syntax issues
    if (line.includes('(') && !line.includes(')')) {
      problematicLines.push(`Line ${index + 1}: Unmatched parentheses`);
    }
    if (line.includes('[') && line.match(/\[/g)?.length !== line.match(/\]/g)?.length) {
      problematicLines.push(`Line ${index + 1}: Unmatched brackets`);
    }
    if (line.includes('{') && line.match(/\{/g)?.length !== line.match(/\}/g)?.length) {
      problematicLines.push(`Line ${index + 1}: Unmatched braces`);
    }
  });
  
  if (problematicLines.length > 0) {
    console.warn('⚠️ Potential syntax issues found:', problematicLines);
  }
  
  console.log('✅ Sanitized definition:', JSON.stringify(sanitized));
  return sanitized;
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
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
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