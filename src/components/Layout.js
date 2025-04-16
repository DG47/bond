import React from 'react';
import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import Footer from "./Footer";

const Layout = () => {
  return (
    <>
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main content */}
      <Box
        sx={{
          marginLeft: '250px', // Offset for fixed sidebar
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          bgcolor: '#f9f9f9'
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>

        {/* Global footer on all pages */}
        <Footer />
      </Box>
    </>
  );
};

export default Layout;