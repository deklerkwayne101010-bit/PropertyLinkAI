# Real Estate AI Frontend

A comprehensive frontend application suite for AI-powered property description generation, featuring both React Native mobile and React web applications.

## 🚀 Project Overview

This project consists of two main applications:

- **Mobile App**: React Native application for iOS and Android
- **Web App**: React web application for desktop and mobile browsers

Both applications share a common design system and connect to the same backend API for AI-powered property description generation.

## 📁 Project Structure

```
real-estate-ai-frontend/
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── components/     # Shared UI components
│   │   ├── screens/        # App screens
│   │   ├── services/       # API integration
│   │   ├── navigation/     # Navigation setup
│   │   ├── utils/          # Helper functions
│   │   └── types/          # TypeScript types
│   ├── App.tsx
│   └── package.json
└── web/                    # React web app
    ├── src/
    │   ├── components/     # Shared UI components
    │   ├── pages/          # Web pages
    │   ├── services/       # API integration
    │   ├── hooks/          # Custom React hooks
    │   ├── utils/          # Helper functions
    │   └── types/          # TypeScript types
    ├── public/
    ├── App.tsx
    └── package.json
```

## 🛠️ Technology Stack

### Mobile App
- **React Native** 0.72.6
- **TypeScript** 4.8.4
- **Redux Toolkit** for state management
- **React Navigation** for navigation
- **Axios** for API calls
- **React Native AsyncStorage** for local storage

### Web App
- **React** 18.2.0
- **TypeScript** 4.8.4
- **Redux Toolkit** for state management
- **React Router** for routing
- **Material-UI (MUI)** for components
- **Axios** for API calls

### Shared
- **Design System**: Comprehensive CSS custom properties and design tokens
- **TypeScript**: Shared type definitions
- **API Integration**: Unified API service layer

## 🔧 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **React Native development environment** (for mobile app)
  - Android Studio (for Android development)
  - Xcode (for iOS development)
  - React Native CLI

## 📦 Installation & Setup

### Backend Setup (Required)

1. **Start the backend server** (make sure it's running on `http://localhost:3000`):
   ```bash
   cd ../real-estate-ai-backend
   npm install
   npm run dev
   ```

### Mobile App Setup

1. **Install dependencies**:
   ```bash
   cd mobile
   npm install
   ```

2. **Install iOS dependencies** (macOS only):
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Configure environment variables**:
   Create `.env` file in mobile directory:
   ```env
   API_BASE_URL=http://localhost:3000/api
   ```

### Web App Setup

1. **Install dependencies**:
   ```bash
   cd web
   npm install
   ```

2. **Configure environment variables**:
   Create `.env` file in web directory:
   ```env
   REACT_APP_API_BASE_URL=http://localhost:3000/api
   ```

## 🚀 Running the Applications

### Mobile App

```bash
# Start Metro bundler
cd mobile
npm start

# In another terminal, run on Android
npm run android

# Or run on iOS (macOS only)
npm run ios
```

### Web App

```bash
cd web
npm start
```

The web app will be available at `http://localhost:3000`.

## 🎨 Design System

The project includes a comprehensive design system with:

- **Color Palette**: Primary blues, success greens, warning oranges, and neutral grays
- **Typography**: Inter font family with consistent sizing scale
- **Spacing**: 4px-based spacing system
- **Breakpoints**: Mobile-first responsive breakpoints
- **Components**: Reusable UI components with consistent styling
- **Accessibility**: WCAG 2.1 AA compliance

## 🔐 Authentication

Both applications support:

- **Email/Password Authentication**
- **Social Login** (Google, Facebook)
- **JWT Token Management**
- **Secure Storage** (AsyncStorage for mobile, localStorage for web)
- **Auto Token Refresh**

## ✨ Key Features

### Property Input Form
- Multi-step form with progress tracking
- Real-time validation
- Auto-save functionality
- Smart field types with validation
- Feature selection with custom options

### Platform Selection
- Visual platform cards (Property24, Facebook, WhatsApp)
- Live preview of content format
- Platform-specific customization options
- Easy switching between platforms

### AI Generation Interface
- Real-time progress indication
- Instant preview area
- Edit mode toggle
- Error handling with retry options
- Alternative generation options

### Results & Sharing
- Clean presentation of generated content
- Copy/share buttons for each platform
- Save to history functionality
- Export options (PDF, DOCX)
- Social media sharing integration

## 🔄 State Management

### Redux Store Structure

```typescript
interface AppState {
  auth: AuthState;
  generation: GenerationState;
  ui: UIState;
}
```

- **Auth Slice**: User authentication, token management
- **Generation Slice**: AI generation progress, results
- **UI Slice**: Theme, language, loading states

## 🌐 API Integration

Both applications connect to the same backend API with:

- **Request/Response Interceptors**
- **Error Handling** and retry logic
- **Token Refresh Mechanism**
- **Offline Support** where possible

## 📱 Mobile-Specific Features

- **Touch-friendly interactions**
- **Responsive design** for different screen sizes
- **Native performance optimizations**
- **Platform-specific UI adaptations**

## 💻 Web-Specific Features

- **Keyboard shortcuts** and hover states
- **PWA capabilities**
- **Responsive CSS** with mobile-first approach
- **Browser compatibility**

## 🚀 Deployment

### Mobile App

1. **Build for production**:
   ```bash
   cd mobile
   npm run build:android  # or build:ios
   ```

2. **Deploy to stores**:
   - Google Play Store for Android
   - App Store for iOS

### Web App

1. **Build for production**:
   ```bash
   cd web
   npm run build
   ```

2. **Deploy to hosting**:
   - Netlify, Vercel, or any static hosting
   - Configure API proxy for backend communication

## 🔧 Development Scripts

### Mobile App Scripts

```bash
npm run android      # Run on Android
npm run ios         # Run on iOS
npm run start       # Start Metro bundler
npm run test        # Run tests
npm run lint        # Run linter
npm run typecheck   # TypeScript type checking
```

### Web App Scripts

```bash
npm start           # Start development server
npm run build       # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App
```

## 📚 Code Organization

### Mobile App Structure

```
src/
├── components/     # Reusable UI components
├── screens/       # Screen components
├── services/      # API and external services
├── navigation/    # Navigation configuration
├── store/         # Redux store and slices
├── types/         # TypeScript definitions
└── utils/         # Utility functions
```

### Web App Structure

```
src/
├── components/    # Reusable UI components
├── pages/         # Page components
├── services/      # API and external services
├── store/         # Redux store and slices
├── styles/        # Styling and theme
├── types/         # TypeScript definitions
└── utils/         # Utility functions
```

## 🔒 Security Features

- **JWT Token Management**
- **Secure Storage** of credentials
- **GDPR Compliance** with consent management
- **Input Validation** and sanitization
- **Error Handling** without information leakage

## 🎯 Performance Optimizations

- **Code Splitting** for faster loading
- **Lazy Loading** of components
- **Image Optimization**
- **Caching Strategies**
- **Bundle Optimization**

## 🧪 Testing

```bash
# Run tests for mobile
cd mobile && npm test

# Run tests for web
cd web && npm test
```

## 📖 Additional Documentation

- [API Documentation](../../real-estate-ai-backend/README.md)
- [Design System Guide](./DESIGN_SYSTEM.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if necessary
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**Happy coding! 🚀**