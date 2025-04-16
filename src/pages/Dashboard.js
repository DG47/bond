// src/pages/Dashboard.js
import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar
} from "@mui/material";
import { AttachMoney, Group, Storage, AccountBalance } from "@mui/icons-material";
import { Link } from "react-router-dom";
import Papa from "papaparse";
import Plot from "react-plotly.js";

// Helper: extract city and state from an address.
const extractCityState = (address) => {
  if (!address) return "Unknown City, Unknown State";
  const parts = address.split(",");
  if (parts.length < 2) return address;
  const city = parts[parts.length - 2]?.trim() || "Unknown City";
  const stateZip = parts[parts.length - 1]?.trim() || "Unknown State";
  const state = stateZip.split(" ")[0];
  return `${city}, ${state}`;
};

// Helper to get a color for each program type.
const getBarColor = (programType) => {
  switch (programType) {
    case "REACH":
      return "#8884d8";
    case "KCC":
      return "#82ca9d";
    case "MSSP":
      return "gray";
    default:
      return "#ffc658";
  }
};

const Dashboard = () => {
  const [accountsData, setAccountsData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [bonds, setBonds] = useState(0);

  // Scroll to top when component mounts.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load account info from ACO_subsidiary list CSV.
  useEffect(() => {
    Papa.parse("/data/ACO_subsidiary list.csv", {
      download: true,
      header: true,
      complete: (results) => {
        console.log("Parsed ACO CSV rows:", results.data);

        // Filter rows to only those that have required fields and surety_access === "merchants".
        const rows = results.data.filter(
          (r) =>
            r.parent_co &&
            r.address &&
            r.surety_access &&
            r.surety_access.trim().toLowerCase() === "merchants"
        );
        console.log("Filtered rows with surety_access === 'merchants':", rows);

        const totalBonds = rows.length;

        // Deduplicate by parent_co.
        const seen = new Set();
        const deduped = rows.filter((row) => {
          const parent = row.parent_co.trim().toLowerCase();
          if (seen.has(parent)) return false;
          seen.add(parent);
          return true;
        });
        console.log("Deduplicated rows:", deduped);

        // Map deduplicated rows into our accounts data.
        const final = deduped.map((row) => ({
          id: row.ACO_ID,
          name: row.parent_co.trim(),
          hqAddress: extractCityState(row.address),
          programType: row.program_type
            ? row.program_type.trim().toUpperCase()
            : "",
          membership: row.Membership
            ? parseFloat(String(row.Membership).replace(/,/g, ""))
            : 0,
          surety: row.surety_access ? row.surety_access.trim().toLowerCase() : ""
        }));
        console.log("Final mapped accounts data:", final);

        setAccountsData(final);
        setBonds(totalBonds);
      }
    });
  }, []);

  // Load savings & membership data from shared_savings.csv.
  useEffect(() => {
    Papa.parse("/data/shared_savings.csv", {
      download: true,
      header: true,
      complete: (results) => {
        console.log("Parsed Savings CSV rows:", results.data);
        const data = results.data.map((item) => {
          const savings =
            parseFloat(String(item["Savings_Gross"]).replace(/,/g, "")) || 0;
          const mem =
            parseFloat(String(item["Membership"]).replace(/,/g, "")) || 0;
          return {
            id: item.ID, // Assumes matching ACO_ID.
            savings,
            membership: mem,
            // Use the "Type" header from shared_savings CSV.
            program_type: item.Type ? item.Type.trim().toUpperCase() : ""
          };
        });
        console.log("Mapped savings data:", data);
        setChartData(data);
      }
    });
  }, []);

  // Merge accountsData with chartData.
  const mergedData = useMemo(() => {
    if (!accountsData.length || !chartData.length) return [];
    const accountMap = new Map();
    accountsData.forEach((acc) => {
      accountMap.set(acc.id, { name: acc.name, program_type: acc.programType });
    });
    const merged = chartData.map((item) => ({
      name: accountMap.get(item.id)
        ? accountMap.get(item.id).name
        : item.id,
      savings: item.savings,
      program_type: accountMap.get(item.id)
        ? accountMap.get(item.id).program_type
        : item.program_type
    }));
    console.log("Merged data for chart:", merged);
    return merged;
  }, [accountsData, chartData]);

  // Aggregated Stats calculations.
  const totalSavings = useMemo(() => {
    const total = mergedData.reduce((acc, item) => acc + Number(item.savings), 0);
    return Math.round(total).toLocaleString();
  }, [mergedData]);

  const totalMembership = useMemo(() => {
    const memTotal = chartData.reduce((acc, item) => acc + Number(item.membership), 0);
    return memTotal.toLocaleString();
  }, [chartData]);

  const totalAccounts = accountsData.length;

  const accountStats = [
    { title: "Estimated Savings", value: "$" + totalSavings, icon: <AttachMoney /> },
    { title: "Membership", value: totalMembership, icon: <Group /> },
    { title: "Accounts", value: totalAccounts.toString(), icon: <Storage /> },
    { title: "Bonds", value: bonds.toString(), icon: <AccountBalance /> }
  ];

  // Build graph data for Plotly.
  const groupedData = useMemo(() => {
    const groups = {};
    mergedData.forEach((item) => {
      if (!groups[item.program_type]) groups[item.program_type] = [];
      groups[item.program_type].push(item);
    });
    Object.keys(groups).forEach((pt) => {
      groups[pt].sort((a, b) => b.savings - a.savings);
    });
    console.log("Grouped data for chart:", groups);
    return groups;
  }, [mergedData]);

  // Define desired order (all uppercase).
  const desiredOrder = ["REACH", "KCC", "MSSP"];

  const yOrder = useMemo(() => {
    const order = [];
    desiredOrder.forEach((pt) => {
      if (groupedData[pt]) {
        groupedData[pt].forEach((item) => order.push(item.name));
      }
    });
    console.log("yOrder for chart:", order);
    return order;
  }, [groupedData]);

  const nameToItem = useMemo(() => {
    const map = new Map();
    mergedData.forEach((item) => {
      map.set(item.name, item);
    });
    return map;
  }, [mergedData]);

  const traces = useMemo(() => {
    return desiredOrder.filter((pt) => groupedData[pt]).map((pt) => {
      const xValues = yOrder.map((name) => {
        const rec = nameToItem.get(name);
        return rec && rec.program_type === pt ? rec.savings : null;
      });
      const hoverTexts = xValues.map((x) =>
        x !== null ? (x / 1e6).toFixed(1) + "M" : ""
      );
      return {
        type: "bar",
        orientation: "h",
        name: pt,
        x: xValues,
        y: yOrder,
        marker: { color: getBarColor(pt) },
        customdata: yOrder,
        hovertext: hoverTexts,
        hovertemplate:
          "ACO: %{customdata}<br>Savings: $%{hovertext}<extra></extra>"
      };
    });
  }, [groupedData, yOrder, nameToItem]);

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        px: { xs: 2, sm: 3, md: 4 },
        py: 3,
        boxSizing: "border-box",
        flexGrow: 1
      }}
    >
      <Typography variant="h5" component="h1" fontWeight="bold" sx={{ mb: 3 }}>
        Accounts
      </Typography>

      {/* Stats Cards */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
        {accountStats.map((stat, index) => (
          <Box key={index} sx={{ flex: "1 1 0px", minWidth: 250 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ display: "flex", alignItems: "center" }}>
                <Avatar sx={{ bgcolor: "#6c5ce7", mr: 2 }}>
                  {stat.icon}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary" component="div">
                    {stat.title}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" component="div">
                    {stat.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Horizontal Bar Chart using Plotly */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mb: 2 }}>
          Gross Savings by ACO reported Q2 2025
        </Typography>
        {mergedData.length > 0 && (
          <Plot
            data={traces}
            layout={{
              barmode: "group",
              autosize: true,
              bargap: 0.1,
              xaxis: { title: "Gross Savings $", tickprefix: "$" },
              yaxis: {
                title: "",
                showticklabels: false,
                categoryorder: "array",
                categoryarray: yOrder
              },
              margin: { t: 20, r: 30, l: 50, b: 40 }
            }}
            useResizeHandler
            style={{ width: "100%", height: "400px" }}
          />
        )}
      </Box>

      {/* Accounts Table */}
      <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mb: 2 }}>
        Accounts
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>HQ Address</TableCell>
              <TableCell>Program Type</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accountsData.map((account) => (
              <TableRow
                key={account.id}
                component={Link}
                to={`/accounts/${account.id}`}
                sx={{
                  textDecoration: "none",
                  color: "inherit",
                  cursor: "pointer",
                  "&:hover": { backgroundColor: "#f5f5f5" }
                }}
              >
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar
                      sx={{
                        bgcolor: "#e0e0e0",
                        mr: 2,
                        width: 30,
                        height: 30
                      }}
                    >
                      {account.name.charAt(0)}
                    </Avatar>
                    {account.name}
                  </Box>
                </TableCell>
                <TableCell>{account.hqAddress}</TableCell>
                <TableCell>{account.programType}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Dashboard;