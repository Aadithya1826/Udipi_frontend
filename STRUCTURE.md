# Frontend Project Structure

## Directory Layout

```
Restaurant APP/
│
├── 📄 Configuration Files
│   ├── .eslintrc.json          # ESLint configuration for code quality
│   ├── .gitignore              # Git ignore rules
│   ├── .env.example            # Environment variables template
│   ├── vite.config.js          # Vite build tool configuration
│   └── package.json            # Project dependencies and scripts
│
├── 📄 Entry Point
│   └── index.html              # Main HTML entry point (Vite standard)
│
├── 📁 src/                     # Source code directory
│   │
│   ├── App.jsx                 # Root React component with routing
│   ├── main.jsx                # Application entry point
│   │
│   ├── 📁 components/          # Reusable components
│   │   ├── Header.jsx          # Navigation header component
│   │   └── Footer.jsx          # Footer component with mascot
│   │
│   ├── 📁 pages/               # Page components (routes)
│   │   ├── Home.jsx            # Home/welcome page
│   │   ├── Agent.jsx           # Agent chat interface
│   │   ├── DineIn.jsx          # Dine-in ordering page
│   │   └── TakeAway.jsx        # Takeaway options page
│   │
│   └── 📁 styles/              # Global and component styles
│       ├── globals.css         # Global styles and CSS variables
│       ├── components.css      # Component-specific styles
│       ├── home.css            # Home page styles
│       └── pages.css           # Pages styles
│
├── 📁 public/                  # Static assets (served as-is)
│   ├── chef_mascot.png         # Chef mascot image
│   ├── restaurant_bg.png       # Background image
│   ├── agent-logo.png          # Agent page logo
│   ├── dinein-logo.png         # Dine-in page logo
│   ├── takeaway-logo.png       # Takeaway page logo
│   ├── udupi-banner.png        # Banner image
│   └── Dataudupi-Title.png     # Title/logo image
│
└── 📄 Documentation
    ├── README.md               # Project overview
    ├── SETUP.md                # Setup instructions
    └── STRUCTURE.md            # This file - Project structure guide
```

## File Naming Conventions

- **React Components**: PascalCase (e.g., `Header.jsx`, `Home.jsx`)
- **CSS Files**: lowercase with hyphens (e.g., `components.css`, `globals.css`)
- **CSS Classes**: kebab-case (e.g., `.app-container`, `.glass-button`)
- **Image Files**: lowercase with hyphens (e.g., `chef-mascot.png` - prefer this pattern)

## Key Files Explained

### Configuration Files

- **`.eslintrc.json`** - ESLint rules for code quality checks
- **`.gitignore`** - Files/folders excluded from git (node_modules, dist, etc.)
- **`vite.config.js`** - Vite build configuration (port, plugins, etc.)
- **`package.json`** - Project metadata, dependencies, and npm scripts

### Source Code (`src/`)

- **`main.jsx`** - Bootstrap file that renders App into the DOM
- **`App.jsx`** - Root component that sets up React Router
- **`components/`** - Reusable UI components used across pages
- **`pages/`** - Full-page components for each route
- **`styles/`** - CSS files organized by scope (global, components, pages)

### Static Assets (`public/`)

Files in this directory are served at the root URL:
- Images referenced in code: `/chef_mascot.png` (from public folder)
- Accessible from any component directly via URL path

### Styles Organization

- **`globals.css`** - CSS variables, default element styles, utility classes
- **`components.css`** - Styles for reusable components (Header, Footer, etc.)
- **`home.css`** - Home page specific styles
- **`pages.css`** - Shared styles for page components
- **CSS Variables**: Defined in `:root` for consistent theming

## Import Paths

```javascript
// ✅ Correct import paths
import App from './App'
import { Home } from './pages/Home'
import './styles/globals.css'
import cheifImage from '../../public/chef_mascot.png'

// ✅ Access public assets
<img src="/chef_mascot.png" alt="Chef" />

// CSS imports in React components
import './styles/components.css'
```

## Build Output

When running `npm run build`, Vite generates:
- **`dist/`** - Production-ready build (not in repo, generated locally)
  - Optimized and minified JavaScript, CSS, and assets
  - Deploy contents of `dist/` folder to production

## Development Workflow

```bash
# Install dependencies
npm install

# Start dev server on http://localhost:3000
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run ESLint to check code quality
npm run lint
```

## Key Technologies

- **React 18.2** - UI library
- **React Router 6** - Client-side routing
- **Vite 5** - Fast build tool and dev server
- **CSS3** - Styling with modern features (grid, flexbox, glass-morphism)
- **Font Awesome** - Icon library (via CDN in index.html)
- **Google Fonts** - Typography (Outfit, Roboto)

## Environment Variables

Create `.env` file (based on `.env.example`) for environment-specific configuration:
```env
VITE_API_URL=http://localhost:8000
VITE_ENVIRONMENT=development
```

Access in components:
```javascript
console.log(import.meta.env.VITE_API_URL)
```

## Best Practices

1. **Component Organization** - Keep related logic in the same file
2. **CSS Scope** - Use component-specific CSS files to avoid conflicts
3. **Image Path** - Use `/filename.png` for public assets (not relative paths)
4. **Environment Vars** - Prefix with `VITE_` for client-side access
5. **Git Ignores** - Common patterns already in `.gitignore`:
   - `node_modules/` - Dependencies
   - `dist/` - Build output
   - `.env` - Local environment secrets

## How to Add New Pages

1. Create new file in `src/pages/YourPage.jsx`
2. Add route in `src/App.jsx`:
   ```javascript
   <Route path="/your-path" element={<YourPage />} />
   ```
3. Create styles if needed in `src/styles/pages.css` or dedicated file
4. Link to it from Header component

## How to Add New Components

1. Create new file in `src/components/YourComponent.jsx`
2. Add styles to `src/styles/components.css`
3. Import and use in pages or other components
4. Follow existing component patterns (functional components with hooks)

---

**Last Updated**: April 8, 2026  
**Project**: Data Udipi Restaurant - React Frontend
