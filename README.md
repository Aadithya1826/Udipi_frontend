# Data Udipi Restaurant - React Frontend

A modern, responsive React.js frontend for the Data Udipi restaurant ordering system.

## Project Structure

```
Restaurant APP/
├── public/                  # Static assets
│   ├── chef_mascot.jpeg
│   └── restaurant_bg.png
├── src/                     # Source code
│   ├── components/          # Reusable components
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   ├── pages/               # Page components
│   │   ├── Home.jsx
│   │   ├── Agent.jsx
│   │   ├── DineIn.jsx
│   │   └── TakeAway.jsx
│   ├── styles/              # CSS files
│   │   ├── globals.css      # Global styles
│   │   ├── components.css   # Component styles
│   │   ├── home.css         # Home page styles
│   │   └── pages.css        # Pages styles
│   ├── App.jsx              # Root component
│   └── main.jsx             # Entry point
├── .eslintrc.json           # ESLint configuration
├── .gitignore               # Git ignore rules
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── package.json             # Dependencies
├── README.md                # This file
└── SETUP.md                 # Setup instructions
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Ensure your image assets are in the `public/` folder:
   - `chef_mascot.jpeg` - The chef mascot image
   - `restaurant_bg.png` - Background image

## Development

Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Building

Create a production build:
```bash
npm run build
```

## Features

- **Home Page**: Welcome screen with ordering options
- **Talk to Agent**: Chat interface for customer support
- **Dine In**: Browse menu and place dine-in orders
- **Take Away**: View takeaway packages
- **Language Support**: English and Tamil language selector
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Chef Mascot**: Animated mascot with bounce effect
- **Modern UI**: Glass-morphism design with smooth animations

## Technologies Used

- **React 18.2** - UI framework
- **React Router 6** - Client-side routing
- **Vite** - Fast build tool
- **CSS3** - Modern styling with animations
- **Font Awesome** - Icons

## Styling Features

- Glass-morphism effects
- Smooth animations and transitions
- Dark theme with orange and green accents
- Mobile-responsive grid layouts
- Custom scrollbars
- Glassmorphic buttons and components

## Chef Mascot Integration

The chef mascot image is displayed in the footer with:
- Bounce animation
- Drop shadow effect
- Responsive sizing
- Positioned above the "Deliciously Vegetarian" slogan

Make sure the `chef_mascot.jpeg` file is placed in the `public/` folder for proper display.
