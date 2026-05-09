# Project Architecture & Future Roadmap

As a Senior Web Developer, I have analyzed the current codebase of the Data Udipi Restaurant application. Below is the architectural overview and a step-by-step roadmap for future development.

## 🛠 Current Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 | Declarative UI components. |
| **Build Tool** | Vite | Ultra-fast development and optimized bundling. |
| **Routing** | React Router DOM v6 | Single Page Application (SPA) navigation. |
| **Backend** | Node.js + Express | Proxy server to handle API keys and chat logic. |
| **AI Engine** | Google Gemini API | Natural language processing for the AI Waiter. |
| **Styling** | Vanilla CSS | Custom, high-performance modular styles. |
| **Voice** | Web Speech API | Native browser support for Speech-to-Text (STT) and Text-to-Speech (TTS). |
| **Containerization** | Docker | Consistent deployment across environments. |
| **CI/CD** | Azure Pipelines | Automated build and deployment workflows. |

---

## 🏗 Architectural Pattern: Secure Proxy
The application uses a **Client-Server-Proxy** architecture. 
- The **Frontend** never communicates directly with Google's Gemini API. 
- Instead, it talks to a local **Express Server**.
- This ensures that your `GEMINI_API_KEY` stays hidden on the server and is never exposed to the client's browser console.

---

## 🚀 Step-by-Step Development Roadmap

To bring this app to a production-ready "End User" state, follow these steps:

### Phase 1: UI/UX Refinement (Immediate)
1.  **Global Design System**: Move common HSL colors, spacing, and typography to a `variables.css` file for easier theme management (e.g., Dark Mode).
2.  **State Management & Transitions**: Add a library like `framer-motion` for smooth menu transitions and cart animations.
3.  **Skeleton Screens**: Replace the "..." loader with themed skeleton loaders in `Agent.jsx` to improve perceived performance.

### Phase 2: Enhanced Functionality
1.  **Real-Time Cart Sync**: Integrate **Context API** or **Zustand** to share the cart state globally across `DineIn`, `TakeAway`, and `Agent` pages.
2.  **Payment Integration**: Replace the dummy QR code with a real Razorpay or Stripe integration.
3.  **Multilingual Support**: Since it's a restaurant app, adding i18next for Tamil/Hindi/English would broaden the user base.

### Phase 3: Reliability & DevSecOps
1.  **Error Boundaries**: Implement React Error Boundaries to prevent the whole app from crashing if the AI fails.
2.  **API Rate Limiting**: Add `express-rate-limit` to the backend to prevent abuse of your Gemini API key.
3.  **Full CI/CD**: Complete the "Deploy" stage in `azure-pipelines.yml` to automatically push to an Azure Web App on every merge to `main`.

---

## 🎨 Recommended UI Improvements

1.  **Glassmorphism for UI**: Use `backdrop-filter: blur()` on the Chat bubbles and Modals for a premium, modern feel.
2.  **Active Voice Feedback**: Use a visual wave-form animation while the AI is listening to provide immediate feedback to the user.
3.  **Micro-interactions**: Add "Success" haptic-style animations when an item is added to the cart.
4.  **Order Summary Dashboard**: A floating, collapsible summary on the right side of the screen for easier browsing.
