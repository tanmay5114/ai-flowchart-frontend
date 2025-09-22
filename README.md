# Chat-to-Visualization Frontend

A React TypeScript frontend for the chat-to-visualization application that explains concepts with interactive animations.

## Features

- **Real-time Chat Interface**: Send questions and receive AI-generated explanations
- **Interactive Visualizations**: Canvas-based animations that demonstrate concepts
- **Server-Sent Events**: Real-time updates when answers are ready
- **Animation Controls**: Play, pause, and restart visualizations
- **Responsive Design**: Clean, modern interface that works on different screen sizes

## Project Structure

```
src/
├── components/
│   ├── ChatPanel.tsx           # Chat interface with message history
│   ├── Controls.tsx            # Play/pause/restart controls
│   └── VisualizationCanvas.tsx # Canvas renderer for animations
├── services/
│   ├── apiService.ts           # HTTP API calls
│   └── sseService.ts           # Server-Sent Events handling
├── types/
│   └── index.ts                # TypeScript type definitions
├── App.tsx                     # Main application component
├── App.css                     # Global styles
└── index.tsx                   # React app entry point
```

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend server running on port 3001

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## Key Components

### ChatPanel
- Displays conversation history
- Auto-scrolling message list
- Input field with auto-resize
- Real-time typing indicators
- Message status tracking

### VisualizationCanvas
- HTML5 Canvas rendering
- Animation interpolation with easing
- Support for circles, rectangles, text, arrows, lines
- 60fps smooth animations
- Responsive canvas sizing

### Controls
- Play/Pause animation
- Progress bar with time display
- Restart functionality
- Animation status indicators

## API Integration

### HTTP Endpoints
- `POST /api/questions` - Submit new questions
- `GET /api/questions` - Fetch question history
- `GET /api/answers/:id` - Get specific answer with visualization

### Real-time Events
- `question_created` - Question submitted
- `answer_created` - Answer ready with visualization
- `answer_error` - Error generating answer
- `ping` - Heartbeat to keep connection alive

## Animation System

The visualization system supports these shape types:

```typescript
// Circle
{
  type: 'circle',
  props: { x: 100, y: 100, r: 30, fill: '#3498db' },
  animations: [
    { property: 'x', from: 100, to: 400, start: 0, end: 3000 }
  ]
}

// Text
{
  type: 'text',
  props: { x: 200, y: 150, text: 'Hello', fontSize: 20 },
  animations: [
    { property: 'opacity', from: 0, to: 1, start: 1000, end: 2000 }
  ]
}
```

### Supported Animations
- **Position**: x, y coordinates
- **Scale**: size changes
- **Opacity**: fade in/out effects
- **Color**: fill and stroke color transitions
- **Rotation**: rotation angles

### Easing Functions
- `linear` - Constant speed
- `ease-in` - Slow start
- `ease-out` - Slow end
- `ease-in-out` - Slow start and end

## Development

### Running Tests
```bash
npm test
```

### Type Checking
```bash
npx tsc --noEmit
```

### Code Formatting
```bash
npx prettier --write src/
```

## Deployment

1. Build the production bundle:
```bash
npm run build
```

2. Deploy the `build/` directory to your web server

3. Configure proxy/reverse proxy to route API calls to your backend server

## Environment Variables

- `REACT_APP_API_URL` - Backend API base URL
- `REACT_APP_SSE_URL` - SSE endpoint URL (optional)
- `REACT_APP_DEBUG` - Enable debug logging

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

Requires modern JavaScript features:
- EventSource (Server-Sent Events)
- Canvas API
- ES6+ syntax
- WebSocket fallback for older browsers

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test real-time features thoroughly
4. Ensure animations are smooth and performant