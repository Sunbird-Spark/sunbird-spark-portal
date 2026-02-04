# PDF Player Service

This directory contains a simplified service-based architecture for handling PDF content using the Sunbird PDF Player.

## Architecture Overview

### Core Components

1. **PdfPlayerService** (`pdf/PdfPlayerService.ts`)
   - Handles PDF content using Sunbird PDF Player web component
   - Manages player lifecycle and event handling
   - Converts between service and Sunbird player configurations

2. **Type Definitions** (`types.ts` and `pdf/types.ts`)
   - `PdfPlayerConfig` - Configuration for PDF content
   - `PdfPlayerOptions` - Player UI options (share, download, print, etc.)
   - `SunbirdPdfPlayerConfig` - Internal Sunbird player configuration

### Usage

#### Basic Usage with PdfPlayer Component

```tsx
import PdfPlayer from '../components/PdfPlayer';

<PdfPlayer
  pdfUrl="https://example.com/document.pdf"
  contentName="My Document"
  contentId="doc-123"
  showShare={true}
  showDownload={true}
  showPrint={true}
  onPlayerEvent={(event) => console.log('Player event:', event)}
  onTelemetryEvent={(event) => console.log('Telemetry:', event)}
/>
```

#### Direct Service Usage

```tsx
import { PdfPlayerService } from '../services/players';

const pdfService = new PdfPlayerService();

const config = {
  contentId: 'pdf-123',
  contentName: 'My PDF',
  contentUrl: 'https://example.com/document.pdf',
  userId: 'user-123'
};

const options = {
  showShare: true,
  showDownload: false,
  showPrint: true
};

const element = pdfService.createElement(config, options);
pdfService.attachEventListeners(element, onPlayerEvent, onTelemetryEvent);
```

### Configuration Options

- **showShare**: Enable/disable share functionality
- **showDownload**: Enable/disable download functionality  
- **showPrint**: Enable/disable print functionality
- **showReplay**: Enable/disable replay functionality
- **showExit**: Enable/disable exit functionality

### Event Handling

The service provides two types of events:
- **Player Events**: User interactions, navigation, etc.
- **Telemetry Events**: Analytics and tracking data

### Benefits

- **Clean API**: Simple, focused interface for PDF content
- **Type Safety**: Full TypeScript support
- **Event Handling**: Standardized event system
- **Backward Compatible**: Works with existing PdfPlayer component
- **Error Handling**: Graceful error handling and validation