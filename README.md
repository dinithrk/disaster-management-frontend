# 🌊 Integrated Hydro Risk Management System - Frontend

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)

A modern, responsive frontend application for the **Integrated Hydro Risk Management System**. This dashboard provides real-time alerts, monitoring interfaces, and CRUD functionalities for managing metadata related to hydro-disasters.

## ✨ Features

- **Alerts Dashboard**: Real-time visualization of hydro risk alerts.
- **Metadata Management**: Complete CRUD interfaces to manage disaster-related metadata.
- **Premium UI/UX**: Designed with modern web standards, featuring dynamic aesthetics and intuitive navigation.
- **Responsive Design**: Fully optimized for both desktop and mobile devices.

## 🛠️ Technologies Used

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher recommended)
- **npm** or **yarn**

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd disaster-management-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:8090` to see the application in action.

## 📂 Project Structure

```text
disaster-management-frontend/
├── public/               # Static assets
├── src/                  # Source code
│   ├── components/       # Reusable React components
│   ├── pages/            # Page-level components
│   ├── services/         # API integration and services
│   ├── styles/           # Global styles and design system
│   ├── App.jsx           # Main application entry point
│   └── main.jsx          # React DOM rendering
├── index.html            # Main HTML template
├── package.json          # Project metadata and dependencies
└── vite.config.js        # Vite configuration
```

## 📜 Available Scripts

In the project directory, you can run:

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the app for production to the `dist` folder.
- `npm run preview`: Locally preview the production build.
- `npm run lint`: Runs ESLint to catch and fix code issues.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
