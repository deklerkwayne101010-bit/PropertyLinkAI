# Construction Materials Management

A modern React/TypeScript application for managing construction materials inventory, tracking purchases, and monitoring material usage on construction sites.

## 🚀 Features

- **Materials Inventory**: Track construction materials and supplies
- **Purchase Management**: Record and monitor material purchases
- **Usage Tracking**: Monitor material consumption on construction sites
- **Supplier Management**: Manage relationships with construction suppliers
- **Location Tracking**: Track materials across warehouses and construction sites
- **Reports & Analytics**: Generate insights on material usage and inventory levels
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Webpack 5
- **State Management**: React Query for server state
- **Routing**: React Router v6
- **Development**: Hot reload, source maps, and optimized builds

## 📁 Project Structure

```
Construction Materials Management/
├── public/
│   └── index.html              # Main HTML template
├── src/
│   ├── components/             # React components
│   │   ├── Layout.tsx         # Main layout component
│   │   ├── Dashboard.tsx      # Dashboard page
│   │   ├── StockTracker.tsx   # Materials management interface
│   │   ├── Inventory.tsx      # Materials inventory
│   │   ├── Purchases.tsx      # Purchase tracking
│   │   ├── Usage.tsx          # Material usage tracking
│   │   ├── Reports.tsx        # Reports and analytics
│   │   └── Settings.tsx       # User settings
│   ├── data/                   # Mock data and constants
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Utility functions
│   ├── styles/
│   │   └── index.css          # Global styles and Tailwind imports
│   ├── App.tsx                # Main App component
│   └── index.tsx              # Application entry point
├── package.json               # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── webpack.config.js         # Webpack bundler configuration
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000` to see the application.

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint code linting

## 🎨 Design System

The application uses a custom design system with:

- **Colors**: Primary blue palette with semantic colors for success, warning, and danger states
- **Typography**: Inter font family for clean, modern text
- **Components**: Reusable UI components with consistent styling
- **Responsive**: Mobile-first design that works on all screen sizes

## 🔧 Development

### Adding New Components

1. Create your component in `src/components/`
2. Import and use in the appropriate page component
3. Add any necessary types to `src/types/`
4. Style with Tailwind classes or custom CSS

### State Management

- Use React Query for server state (API calls, caching)
- Use React useState/useReducer for local component state
- Consider Zustand for global client state if needed

### API Integration

The app is ready for API integration. Add your API calls using React Query:

```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading, error } = useQuery({
  queryKey: ['stocks'],
  queryFn: fetchStocks,
});
```

## 📝 Next Steps

This is a basic project structure ready for development. Next steps include:

1. **API Integration**: Connect to stock data providers
2. **Authentication**: Add user login/signup functionality
3. **Database**: Set up data persistence
4. **Real-time Updates**: Implement WebSocket connections for live data
5. **Testing**: Add unit and integration tests
6. **Deployment**: Configure production builds and hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the package.json file for details.

---

**Built with ❤️ for Construction Materials Management**