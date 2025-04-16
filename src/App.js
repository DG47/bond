// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./components/Login";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import Dashboard from "./pages/Dashboard";
import AccountDetail from "./pages/AccountDetail";
import Summary from "./pages/Summary";
import Account from "./pages/Account";
import AcoReportDetail2024 from "./pages/AcoReportDetail2024";
import AcoReportDetail from "./pages/AcoReportDetail";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* All routes below require auth */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/accounts" replace />} />
              <Route path="accounts" element={<Dashboard />} />
              <Route path="accounts/:id" element={<AccountDetail />} />
              <Route
                path="accounts/:id/report/2024"
                element={<AcoReportDetail2024 />}
              />
              <Route
                path="accounts/:id/report/2025"
                element={<AcoReportDetail />}
              />
              <Route path="summary" element={<Summary />} />
              <Route path="account" element={<Account />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;