# Data Udipi Restaurant - React Frontend

A modern, responsive React.js frontend for the Data Udipi restaurant ordering system, featuring glass-morphism design, AI-powered agent interaction, and a seamless ordering experience.

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18 or higher
- **npm**: v8 or higher

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file based on `.env.example`
   - Add your `VITE_GEMINI_API_KEY` and other configurations.

### Development
Start the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

## 📁 Project Structure

```text
Restaurant APP/
├── public/                  # Static assets (images, fonts)
├── src/                     # Source code
│   ├── components/          # Reusable UI components (Header, Footer, Modals)
│   ├── data/                # Static data & configuration
│   ├── pages/               # Page-level components (Home, Agent, DineIn, TakeAway)
│   ├── styles/              # CSS styles (Globals, Components, Pages)
│   ├── App.jsx              # Main router and app layout
│   └── main.jsx             # React entry point
├── azure-pipelines.yml      # Azure DevOps deployment configuration
├── Dockerfile               # Containerization configuration
├── nginx.conf               # Nginx configuration for SPA routing
├── vite.config.js           # Vite build configuration
└── package.json             # Project dependencies and scripts
```

## 🛠️ Technologies Used
- **React 18.2**: UI logic and framework.
- **Vite**: Ultra-fast build tool and development server.
- **React Router 6**: Client-side navigation.
- **CSS3**: Modern styling with animations and glass-morphism.
- **Font Awesome**: Icon system.

## 📦 Deployment

### Azure DevOps (CI/CD)
The project includes an `azure-pipelines.yml` file. When connected to Azure DevOps, it will automatically:
1. Install dependencies.
2. Build the production application.
3. Publish the `dist` folder as a build artifact.

### Docker (Containerization)
To build and run the application as a container:
```bash
docker build -t udipi-frontend .
docker run -p 80:80 udipi-frontend
```
This uses a multi-stage build and Nginx to serve the content efficiently.

## ✨ Features
- **AI Agent**: Interactive chat interface for customer assistance.
- **Dine-In Menu**: Visual menu browsing with item details and categories.
- **Takeaway Packages**: Pre-configured meal packages for quick selection.
- **Multilingual Support**: Toggle between English and Tamil.
- **Responsive Design**: Optimized for desktop, tablet, and mobile browsers.

## 📜 License
Data Udipi Restaurant Application. All rights reserved.
