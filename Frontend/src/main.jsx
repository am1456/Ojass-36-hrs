import "./App.css";
import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import App from "./App";
import { AuthProvider, useAuth } from "./admin-panel/context/AuthContext";
import Login from "./admin-panel/pages/login";
import Register from "./admin-panel/pages/register";



function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />

            <Route
              index
              element={
                <ProtectedRoute>
                  <div className="p-10 text-2xl font-bold">
                    Dashboard (Protected)
                  </div>
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);