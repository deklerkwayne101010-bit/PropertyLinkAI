# AI Image Editor Architecture Design

## Overview
This document outlines the comprehensive architecture for the AI-powered image editor feature for real estate agents. The system integrates Hugging Face APIs with natural language processing to enable intuitive image editing through text prompts.

## System Architecture

### High-Level Flow
```
User Input → Prompt Analysis → AI Processing → Result Storage → UI Display
```

### Components
1. **Frontend**: React-based UI with drag-and-drop, canvas manipulation
2. **Backend**: Node.js/Express API with Hugging Face integration
3. **Database**: SQLite with Prisma ORM for data persistence
4. **AI Services**: Hugging Face APIs (Grounding DINO, Stable Diffusion Inpainting, Upscaler)

## Database Schema Design

### AIImageEdit Model
```prisma
model AIImageEdit {
  id              String   @id @default(cuid())
  userId          String?
  sessionId       String?  // For anonymous users

  // Original Image
  originalImage   String   // Base64 encoded
  originalName    String
  originalSize    Int      // File size in bytes
  imageFormat     String   // jpg, png, webp

  // Edited Image
  editedImage     String?  // Base64 encoded result
  editedName      String?

  // Processing Details
  prompt          String   // User's natural language prompt
  detectedAction  String   // remove, enhance, lighting, color
  aiModel         String   // grounding-dino, stable-diffusion-inpainting, upscaler
  processingSteps Json?    // Array of processing steps taken

  // Status & Progress
  status          String   @default("pending") // pending, processing, completed, failed
  progress        Int      @default(0) // 0-100
  errorMessage    String?

  // Metadata
  processingTime  Int?     // Processing time in milliseconds
  apiCalls        Int      @default(0) // Number of API calls made
  cost            Float?   // Estimated cost in USD

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  completedAt     DateTime?

  // Relations
  user            User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  // Indexes
  @@index([userId, createdAt])
  @@index([sessionId, createdAt])
  @@index([status])
  @@index([createdAt])

  @@map("ai_image_edits")
}
```

### AIUsage Extension
Extend existing AIUsage model to track image editing costs:
```prisma
// Add to existing AIUsage model
operation    String   // Add "image_edit" operation type
model        String   // Add "grounding-dino", "stable-diffusion-inpainting", "upscaler"
```

## API Design

### Endpoints

#### POST /api/ai-image-edit/process
Process an image with AI editing
```typescript
Request Body:
{
  image: string,        // Base64 encoded image
  prompt: string,       // Natural language prompt
  imageName?: string,   // Optional filename
  sessionId?: string    // For anonymous users
}

Response:
{
  editId: string,
  status: "processing",
  message: "Image processing started"
}
```

#### GET /api/ai-image-edit/status/:editId
Get processing status
```typescript
Response:
{
  editId: string,
  status: "processing" | "completed" | "failed",
  progress: number,
  result?: {
    editedImage: string,
    processingTime: number,
    apiCalls: number
  },
  error?: string
}
```

#### GET /api/ai-image-edit/history
Get user's edit history (requires authentication)
```typescript
Query Parameters:
- limit: number (default: 20)
- offset: number (default: 0)
- status?: string

Response:
{
  edits: AIImageEdit[],
  total: number,
  hasMore: boolean
}
```

#### DELETE /api/ai-image-edit/:editId
Delete an edit from history

## AI Processing Logic

### Prompt Analysis Engine
```typescript
interface PromptAnalysis {
  action: 'remove' | 'enhance' | 'lighting' | 'color' | 'other';
  target?: string;        // Object to remove/enhance
  parameters?: object;    // Additional processing parameters
}

function analyzePrompt(prompt: string): PromptAnalysis {
  // Keywords mapping
  const removeKeywords = ['remove', 'delete', 'get rid of', 'erase'];
  const lightingKeywords = ['bright', 'dark', 'lighting', 'illuminate'];
  const enhanceKeywords = ['enhance', 'improve', 'quality', 'sharpen'];

  // Return analysis result
}
```

### Processing Pipeline

#### Object Removal Flow
1. **Grounding DINO Detection**: Identify object location
2. **Mask Generation**: Create segmentation mask
3. **Inpainting**: Fill background with AI generation

#### Enhancement Flow
1. **Analysis**: Determine enhancement type
2. **Processing**: Apply appropriate AI model
3. **Quality Check**: Validate result quality

## Frontend Architecture

### Component Structure
```
AIImageEditorPage/
├── AIImageEditor/
│   ├── ImageUpload/
│   │   ├── DragDropZone
│   │   └── FileInput
│   ├── PromptInput/
│   │   ├── TextField
│   │   └── Suggestions
│   ├── ImagePreview/
│   │   ├── BeforeAfterView
│   │   └── ImageCanvas
│   ├── ProcessingStatus/
│   │   ├── ProgressBar
│   │   └── StatusMessages
│   └── ActionButtons/
│       ├── ProcessButton
│       ├── DownloadButton
│       └── ShareButton
├── HistoryPanel/
└── SettingsPanel/
```

### State Management
```typescript
interface AIImageEditState {
  currentEdit: {
    id?: string;
    originalImage?: string;
    editedImage?: string;
    prompt?: string;
    status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
    progress: number;
    error?: string;
  };
  history: AIImageEdit[];
  settings: {
    autoSave: boolean;
    defaultFormat: string;
    quality: number;
  };
}
```

## Error Handling

### Error Types
- **ValidationError**: Invalid input parameters
- **APIError**: Hugging Face API failures
- **NetworkError**: Connectivity issues
- **ProcessingError**: AI processing failures
- **StorageError**: Database/file storage issues

### Error Recovery
- Automatic retry for transient failures
- Fallback processing options
- User-friendly error messages
- Progress preservation on errors

## Security Considerations

### Input Validation
- File type restrictions (images only)
- File size limits
- Base64 validation
- Prompt content filtering

### Rate Limiting
- Per-user API call limits
- Processing queue management
- Cost monitoring and alerts

### Data Privacy
- Secure image storage
- User data isolation
- Audit logging
- GDPR compliance

## Performance Optimization

### Caching Strategy
- Processed image caching
- API response caching
- User session data

### Processing Optimization
- Image resizing before API calls
- Batch processing for multiple edits
- Progressive loading for large images

### Monitoring
- API usage tracking
- Performance metrics
- Error rate monitoring
- Cost analysis

## Deployment Considerations

### Environment Variables
```env
HUGGINGFACE_API_TOKEN=your_token_here
MAX_IMAGE_SIZE=10485760  # 10MB
MAX_API_CALLS_PER_HOUR=100
PROCESSING_TIMEOUT=300000  # 5 minutes
```

### Scaling
- Horizontal scaling for API endpoints
- Queue system for heavy processing
- CDN for image delivery
- Database read replicas

## Testing Strategy

### Unit Tests
- Prompt analysis logic
- API integration
- Error handling
- State management

### Integration Tests
- End-to-end processing flow
- API error scenarios
- Database operations

### Performance Tests
- Large image processing
- Concurrent user load
- API rate limiting

## Success Metrics

### User Experience
- ✅ Processing time < 30 seconds for typical images
- ✅ Success rate > 95% for valid prompts
- ✅ Intuitive prompt-based editing

### Technical Metrics
- ✅ API availability > 99.5%
- ✅ Error rate < 5%
- ✅ Cost per edit < $0.10

### Business Metrics
- ✅ User adoption rate
- ✅ Feature usage frequency
- ✅ Customer satisfaction scores