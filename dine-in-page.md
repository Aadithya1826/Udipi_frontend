# Planning: Dine-In Page Overhaul

This document outlines the features and components required to implement the new Dine-In experience for the DATA UDIPI restaurant app, based on the provided UI/UX designs.

## 1. Visual Aesthetics & Theme
- **Theme**: Premium Dark/Glassmorphic.
- **Main Layout**: A large, centered white container with high `border-radius` (approx. 40px) and generous padding.
- **Background**: Dark, blurred background elements to create depth.
- **Color Palette**: 
  - Primary: Udipi Red (#E33E17)
  - Secondary: Teal/Mint Green (#E6F7F5)
  - Text: High contrast black/grey for menu, white for headers.

## 2. Component Architecture

### A. Global Header
- **Table Number**: Pill-shaped badge showing the current table (e.g., Table no: 06).
- **Logo**: "DATA UDIPI" center-aligned.
- **Widgets**: Real-time Date/Time and a Language selector.

### B. Navigation & Search (Top of Container)
- **Search Bar**: Centered search input with integrated "Search for food..." placeholder.
- **Filter Action**: A settings/filter icon button next to search.
- **Order Action**: "+ New Order" button for clearing/starting a fresh session.
- **Category Pills**: 
  - Horizontal scrollable list.
  - Icons for each category (Breakfast, Lunch, etc.).
  - Active state: Red background with white text/icon.

### C. Menu Grid & Cards
- **Grid System**: 5 columns (standard) / 4 columns (when Agent is active).
- **Menu Card Components**:
  - **Thumbnail**: High-quality food image with rounded top corners.
  - **Info**: Item name (e.g., Onion Rava Dosa) and ingredient description.
  - **Status Badge**: "Available" (Green) or "Not Available" (Red).
  - **Pricing**: Clear "Rs. 100" label.
  - **Stepper**: Interactive quantity selector (`-` [value] `+`) at the bottom.

### D. AI Agent Sidebar (The "Chef")
- **Visuals**: Chef mascot illustration with a waveform voice visualizer.
- **Interaction**:
  - Sliding glassmorphic panel.
  - "Talk To Your Agent" heading.
  - Suggested quick-actions (pills).
  - Chat bubbles for interactive conversation.
  - Inline menu navigation within the chat flow.
- **Input**: Pill-shaped mic/text input bar with a red activation glow.

### E. Cart & Order Management
- **Cart Sidebar**: Transitioning from the Agent view or opened independently.
- **Item Summary**: Small rows with thumbnail, price, and GST calculation.
- **Customization**: Special instructions box per item.
- **Call to Action**: Large, high-visibility "Place Order" button.

## 3. Technical Requirements
- **State Management**: 
  - `activeCategory` (String)
  - `cartItems` (Array of objects)
  - `agentState` (Open/Closed/Talking)
  - `searchQuery` (String)
- **Responsiveness**: The grid must fluidly adjust when the sidebar toggles.
- **Animations**: 
  - Slide-in for the sidebar.
  - Pulse/Glow for the mic button.
  - Smooth transitions for category switching.

---
*Created for the DATA UDIPI Development Team*
