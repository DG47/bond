import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  AccountCircle as AccountIcon,
  Summarize as SummaryIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    // { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Dashboard", icon: <DashboardIcon />, path: "/accounts" },
    // { text: "Tasks", icon: <TaskIcon />, path: "/tasks" },
    { text: "Summary", icon: <SummaryIcon />, path: "/summary" },
    { text: "Account", icon: <AccountIcon />, path: "/account" },
  ];

  const handleLogout = () => {
    // Add your logout logic here (e.g. clear tokens, redirect)
    localStorage.clear();
    navigate("/login");
  };

  return (
    <Box
      sx={{
        width: 250,
        height: "100vh",
        backgroundColor: "#6c5ce7",
        color: "white",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Top Section with Logo and Nav Links */}
      <Box>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <img src="/logo.png" alt="Sparx Logo" style={{ height: 40 }} />
          </Box>
        </Box>

        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <ListItemIcon sx={{ color: "white", minWidth: "40px" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Bottom Logout Button */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", mb: 1 }} />
        <ListItemButton
          onClick={handleLogout}
          sx={{
            color: "white",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          <ListItemIcon sx={{ color: "white", minWidth: "40px" }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );
};

export default Sidebar;