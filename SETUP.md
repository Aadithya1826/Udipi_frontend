# Data Udipi React Frontend - Setup Guide

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Assets
Before running the app, ensure you have the required images:

1. **Chef Mascot Image** (`public/chef_mascot.jpeg`)
   - Place your chef mascot image in the `public/` folder
   - Should be a transparent PNG or JPEG with the chef character
   - Recommended size: 300x300px or larger

2. **Background Image** (`public/restaurant_bg.png`)
   - Place your restaurant background image in the `public/` folder
   - Recommended size: 1920x1080px
   - Should work well with a dark overlay

### Step 3: Run Development Server
```bash
npm run dev
```

The application will automatically open at `http://localhost:3000`

## Project Features

### Pages
1. **Home (/)** - Landing page with ordering options
   - Table number display
   - Logo sign with swing animation
   - Three main action buttons
   - Chef mascot with slogan at footer

2. **Agent (/agent)** - AI Agent chat interface
   - Chat message display
   - Input field for customer queries
   - Real-time date/time display

3. **Dine In (/dine-in)** - Menu browsing for dine-in orders
   - Grid layout of menu items
   - Item details (name, category, price)
   - Add to order functionality

4. **Take Away (/take-away)** - Takeaway package options
   - Pre-built package cards
   - Quick order buttons
   - Package details

### Components

**Header Component**
- Table number indicator
- Logo sign (swinging animation)
- Language selector (English/Tamil)
- Date and time display (for internal pages)

**Footer Component**
- Chef mascot with bounce animation
- "Deliciously Vegetarian" slogan banner
- Responsive sizing

## Styling

The application uses:
- **CSS3 with animations** - Smooth transitions and effects
- **Glass-morphism design** - Modern, frosted glass effect
- **Color scheme**:
  - Primary Orange: #FF5A00
  - Primary Green: #2F882C
  - Dark Green: #0F5E16
  - Light Text: #F5F5F5
  - Dark Text: #333333

## File Structure

```
src/
├── main.jsx              # React entry point
├── App.jsx               # Main router setup
├── components/
│   ├── Header.jsx        # Header with navigation
│   └── Footer.jsx        # Footer with mascot
├── pages/
│   ├── Home.jsx          # Landing page
│   ├── Agent.jsx         # Chat interface
│   ├── DineIn.jsx        # Menu browsing
│   └── TakeAway.jsx      # Takeaway options
└── styles/
    ├── globals.css       # Global styles
    ├── components.css    # Component styles
    ├── home.css          # Home page styles
    └── pages.css         # Other pages styles
```

## Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint (if configured)

## Dependencies

- **react**: ^18.2.0 - UI library
- **react-dom**: ^18.2.0 - DOM manipulation
- **react-router-dom**: ^6.20.0 - Client-side routing

## Dev Dependencies

- **vite**: ^5.0.8 - Build tool
- **@vitejs/plugin-react**: ^4.2.1 - React plugin for Vite

## Deployment

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
Connect your GitHub repository to Netlify for auto-deployment.

### Docker (Optional)
Add a Dockerfile to containerize the application:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## Troubleshooting

### Images not loading?
- Check that `chef_mascot.jpeg` and `restaurant_bg.png` are in the `public/` folder
- Verify file paths in the components are correct

### Port 3000 already in use?
- Change port in `vite.config.js` or use: `npm run dev -- --port 3001`

### Routing not working?
- Ensure React Router is properly configured in `App.jsx`
- Check that page components are correctly imported

## License

Data Udipi Restaurant Application

## Support

For issues or questions, please contact the development team.
