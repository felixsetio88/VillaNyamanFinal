// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ isAdmin, children }) => {
  // Check if user is not an admin
  if (!isAdmin) {
    return <Navigate to="/" replace />; // Redirect to home page or any other page
  }

  return children; // Render the child component if the user is an admin
};

export default ProtectedRoute;
