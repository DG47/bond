import React, { useEffect, useState } from "react";
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
  Button,
  Avatar,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  AttachMoney,
  Group,
  Storage,
  Shield,
  MedicalServices,
} from "@mui/icons-material";
import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp";
import { useNavigate, useParams } from "react-router-dom";
import Papa from "papaparse";
import Plot from "react-plotly.js";

// TinyDonut component
function TinyDonut({ percentage = 0, size = 16, strokeWidth = 2, color = "#6c5ce7" }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * percentage) / 100;
  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e0e0e0"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
    </svg>
  );
}

export default function AccountDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Scroll to top when component mounts.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Expanded row for table.
  const [expandedRow, setExpandedRow] = useState(null);
  const handleExpandClick = (targetId) =>
    setExpandedRow((prev) => (prev === targetId ? null : targetId));

  // State for subsidiaries and account stats.
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [accountStats, setAccountStats] = useState([]);
  const [parentName, setParentName] = useState("");
  const [parentStopLoss, setParentStopLoss] = useState("");
  const [selectedYear, setSelectedYear] = useState("2025");

  // NEW: State to hold available years (e.g., ["2024", "2025"])
  const [availableYears, setAvailableYears] = useState([]);

  // Mapping from subsidiary id -> shared savings Plotly data.
  const [subsidiarySharedSavings, setSubsidiarySharedSavings] = useState({});
  // Mapping from subsidiary id -> clinician count.
  const [subsidiaryClinicianCount, setSubsidiaryClinicianCount] = useState({});

  // Utility function to parse a value as one decimal.
  const parseOneDecimal = (value) => {
    if (value == null) return 0;
    const num = parseFloat(String(value).replace(/[$,%]/g, "").trim());
    return isNaN(num) ? 0 : parseFloat(num.toFixed(1));
  };

  // Load ACO_subsidiary list and update parent and subsidiaries info.
  useEffect(() => {
    Papa.parse("/data/ACO_subsidiary list.csv", {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data;
        // Find parent's row (assuming parent's ACO_ID matches the id).
        const parentRow = data.find(
          (r) => r.ACO_ID?.toLowerCase().trim() === id.toLowerCase().trim()
        );
        if (!parentRow) return;
        const parent = parentRow.parent_co || "Unknown Parent";
        setParentName(parent);
        setParentStopLoss(parentRow.stop_loss || "$350K");

        // NEW: Compute available years from the parent's group
        const yearsSet = new Set();
        data.forEach((r) => {
          if (r.parent_co === parent && r["Performance Years"]) {
            r["Performance Years"]
              .split(",")
              .forEach((year) => yearsSet.add(year.trim()));
          }
        });
        const yearsArray = Array.from(yearsSet);
        setAvailableYears(yearsArray);

        // Filter subsidiaries for the selected year and that have surety_access === "merchants".
        const matched = data
          .filter(
            (r) =>
              r.parent_co === parent &&
              r.surety_access?.toLowerCase().trim() === "merchants" &&
              r["Performance Years"]?.split(",").map((y) => y.trim()).includes(selectedYear)
          )
          .map((r, i) => ({
            id: r.ACO_ID || i,
            name: r.subsidiary_co || r.parent_co,
            program: r.program_type || "KCO",
            projectedSavings: "",
            score: "",
            action: "View Report",
          }));
        setSubsidiaries(matched);
      },
    });
  }, [id, selectedYear]);

  // Account Stats Effect: Aggregating Generated Savings, Membership, Bonds.
  useEffect(() => {
    const csvFile =
      selectedYear === "2024" ? "/data/2024_data.csv" : "/data/shared_savings.csv";
    Papa.parse(csvFile, {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data;
        let totalMembership = 0;
        let totalSavings = 0;
        subsidiaries.forEach((sub) => {
          // For both years in this example, use "ID" as key.
          const key = "ID";
          const row = data.find(
            (r) =>
              (r[key] || "").toLowerCase().trim() ===
              sub.id.toString().toLowerCase().trim()
          );
          if (row) {
            totalMembership += parseFloat(row["Membership"]) || 0;
            totalSavings += parseFloat(row["Savings_Gross"]) || 0;
          }
        });
        const formattedMembership = totalMembership.toLocaleString();
        const formattedSavings = "$" + Math.round(totalSavings).toLocaleString();
        setAccountStats([
          { title: "Generated Savings", value: formattedSavings, icon: <AttachMoney /> },
          { title: "Membership", value: formattedMembership, icon: <Group /> },
          { title: "Bonds", value: subsidiaries.length.toString(), icon: <Storage /> },
        ]);
      },
    });
  }, [subsidiaries, selectedYear]);

  // Update each subsidiary’s Projected Savings and Sparx Score.
  useEffect(() => {
    if (subsidiaries.length === 0) return;
    const csvFile =
      selectedYear === "2024" ? "/data/2024_data.csv" : "/data/shared_savings.csv";
    Papa.parse(csvFile, {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data;
        const key = "ID";
        const updatedSubs = subsidiaries.map((sub) => {
          const row = data.find(
            (r) =>
              (r[key] || "").toLowerCase().trim() ===
              sub.id.toString().toLowerCase().trim()
          );
          if (row) {
            return {
              ...sub,
              projectedSavings:
                selectedYear === "2024"
                  ? row["Q4"]
                    ? `${parseOneDecimal(row["Q4"]).toLocaleString()}%`
                    : ""
                  : row["Q2"]
                  ? `${parseOneDecimal(row["Q2"]).toLocaleString()}%`
                  : "",
              score: row["sparx"] ? row["sparx"].toString() : sub.score,
            };
          }
          return sub;
        });
        setSubsidiaries(updatedSubs);
      },
    });
  }, [subsidiaries, selectedYear]);

  // Load shared savings data for each subsidiary (for the chart).
  useEffect(() => {
    if (subsidiaries.length === 0) return;
    const csvFile =
      selectedYear === "2024" ? "/data/2024_data.csv" : "/data/shared_savings.csv";
    Papa.parse(csvFile, {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data;
        const newMapping = {};
        subsidiaries.forEach((sub) => {
          const key = "ID";
          const row = data.find(
            (r) =>
              (r[key] || "").toLowerCase().trim() ===
              sub.id.toString().toLowerCase().trim()
          );
          if (row) {
            const quarters = ["Q1", "Q2", "Q3", "Q4"];
            if (selectedYear === "2024") {
              const baseline = parseFloat(row["2023 Lookback Savings"]);
              const trace2023 = {
                x: quarters,
                y: quarters.map(() => baseline),
                mode: "lines+markers",
                marker: { color: "gray", size: 8 },
                line: { color: "gray" },
                name: "2023",
              };
              const trace2024 = {
                x: quarters,
                y: quarters.map((q) => parseFloat(row[q])),
                mode: "lines+markers",
                marker: { color: "#6c5ce7", size: 8 },
                line: { color: "#6c5ce7" },
                name: "2024",
                error_y: {
                  type: "data",
                  array: quarters.map((q) => parseFloat(row[`${q} CI`])),
                  visible: true,
                },
              };
              newMapping[sub.id] = [trace2023, trace2024];
            } else {
              const quarters = ["Q1", "Q2", "Q3", "Q4"];
              const baseline = parseFloat(row["2024 Lookback Savings"]);
              const trace2024 = {
                x: quarters,
                y: quarters.map(() => baseline),
                mode: "lines+markers",
                marker: { color: "gray", size: 8 },
                line: { color: "gray" },
                name: "2024",
              };
              const trace2025 = {
                x: quarters,
                y: quarters.map((q) =>
                  q === "Q1" || q === "Q2" ? parseFloat(row[q]) : null
                ),
                mode: "lines+markers",
                marker: { color: "#6c5ce7", size: 8 },
                line: { color: "#6c5ce7" },
                name: "2025",
                error_y: {
                  type: "data",
                  array: quarters.map((q) =>
                    q === "Q1" || q === "Q2" ? parseFloat(row[`${q} CI`]) : null
                  ),
                  visible: true,
                },
              };
              newMapping[sub.id] = [trace2024, trace2025];
            }
          }
        });
        setSubsidiarySharedSavings(newMapping);
      },
    });
  }, [subsidiaries, selectedYear]);

  // Load clinician counts (for 2025) or physician counts (for 2024).
  useEffect(() => {
    if (subsidiaries.length === 0) return;
    if (selectedYear === "2024") {
      Papa.parse("/data/2024_data.csv", {
        download: true,
        header: true,
        complete: (results) => {
          const data = results.data;
          const newCountMapping = {};
          subsidiaries.forEach((sub) => {
            const row = data.find(
              (r) =>
                (r["ID"] || "").toLowerCase().trim() ===
                sub.id.toString().toLowerCase().trim()
            );
            newCountMapping[sub.id] = row ? parseInt(row["physicians"], 10) : 0;
          });
          setSubsidiaryClinicianCount(newCountMapping);
        },
      });
    } else {
      Papa.parse("/data/npi_output.csv", {
        download: true,
        header: true,
        complete: (results) => {
          const data = results.data;
          const newCountMapping = {};
          subsidiaries.forEach((sub) => {
            const count = data.filter((r) => {
              const lat = parseFloat((r.Latitude || "").toString().trim());
              const lon = parseFloat((r.Longitude || "").toString().trim());
              return (
                (r["Entity ID"] || "").toLowerCase().trim() ===
                  sub.id.toString().toLowerCase().trim() &&
                !isNaN(lat) &&
                !isNaN(lon) &&
                lat >= -90 &&
                lat <= 90 &&
                lon >= -180 &&
                lon <= 180
              );
            }).length;
            newCountMapping[sub.id] = count;
          });
          setSubsidiaryClinicianCount(newCountMapping);
        },
      });
    }
  }, [subsidiaries, selectedYear]);

  // Layout for the shared savings chart.
  const sharedSavingsLayout = {
    title: "Projected % (2024 & 2025)",
    xaxis: { title: { text: "Quarter (Data Released)" }, showgrid: false },
    yaxis: {
      title: { text: "Gross Percentage Savings" },
      showgrid: true,
      rangemode: "tozero",
      ticksuffix: "%",
    },
    autosize: true,
    hovermode: "closest",
    margin: { l: 50, r: 20, t: 40, b: 40 },
  };

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", px: { xs: 2, sm: 3, md: 4 }, py: 3 }}>
      {/* Back Button */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton sx={{ mr: 1 }} onClick={() => navigate("/accounts")}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight="bold">
          {parentName}
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
        {accountStats.map((stat, index) => (
          <Box key={index} sx={{ flex: "1 1 0px", minWidth: 250 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ display: "flex", alignItems: "center" }}>
                <Avatar sx={{ bgcolor: "#6c5ce7", mr: 2 }}>{stat.icon}</Avatar>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    {stat.title}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {stat.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Year Toggle - Render buttons only for available years */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          {selectedYear} ACOs
        </Typography>
        {availableYears.includes("2024") && (
          <Button
            variant={selectedYear === "2024" ? "contained" : "outlined"}
            onClick={() => setSelectedYear("2024")}
          >
            2024
          </Button>
        )}
        {availableYears.includes("2025") && (
          <Button
            variant={selectedYear === "2025" ? "contained" : "outlined"}
            onClick={() => setSelectedYear("2025")}
          >
            2025
          </Button>
        )}
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ACO Name</TableCell>
              <TableCell>Program</TableCell>
              <TableCell>Projected Savings</TableCell>
              <TableCell>Sparx Score</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subsidiaries.map((aco) => (
              <React.Fragment key={aco.id}>
                <TableRow
                  hover
                  onClick={() => handleExpandClick(aco.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {expandedRow === aco.id ? (
                        <KeyboardArrowDownIcon sx={{ mr: 1 }} />
                      ) : (
                        <KeyboardArrowRightIcon sx={{ mr: 1 }} />
                      )}
                      {aco.name}
                    </Box>
                  </TableCell>
                  <TableCell>{aco.program}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "inline-flex", alignItems: "center" }}>
                      {aco.projectedSavings || "N/A"}
                      {/*<KeyboardDoubleArrowUpIcon sx={{ ml: 0.5, color: "green" }} />*/}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {aco.score || "N/A"}
                      </Typography>
                      <TinyDonut percentage={Number(aco.score)} size={16} strokeWidth={2} />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {/* UPDATED: Append the selectedYear into the report URL */}
                    <Button
                      variant="contained"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/accounts/${aco.id}/report/${selectedYear}`);
                      }}
                      sx={{ backgroundColor: "#6c5ce7", "&:hover": { backgroundColor: "#5346d9" } }}
                    >
                      {aco.action}
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Expandable Content */}
                <TableRow>
                  <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                    <Collapse in={expandedRow === aco.id} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 2, backgroundColor: "#f9f9f9" }}>
                        <Box sx={{ display: "flex", gap: 3 }}>
                          {/* Shared Savings Chart */}
                          {subsidiarySharedSavings[aco.id] &&
                            parseFloat(subsidiarySharedSavings[aco.id][0].y[0]) > 0 && (
                              <Box sx={{ flex: 2 }}>
                                <Paper sx={{ p: 2 }}>
                                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                                    Shared Savings Chart
                                  </Typography>
                                  <Box sx={{ height: 300 }}>
                                    <Plot
                                      data={subsidiarySharedSavings[aco.id]}
                                      layout={sharedSavingsLayout}
                                      style={{ width: "100%", height: "100%" }}
                                      useResizeHandler
                                    />
                                  </Box>
                                </Paper>
                              </Box>
                            )}
                          {/* Right Side Cards: Stop Loss & Physicians */}
                          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", height: 300, gap: 2 }}>
                            <Card sx={{ flex: 1 }}>
                              <CardContent
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  height: "100%",
                                }}
                              >
                                <Shield sx={{ fontSize: 40, color: "#6c5ce7", mb: 1 }} />
                                <Typography variant="subtitle2" fontWeight="bold">
                                  Stop Loss
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {parentStopLoss || "N/A"}
                                </Typography>
                              </CardContent>
                            </Card>
                            <Card sx={{ flex: 1 }}>
                              <CardContent
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  height: "100%",
                                }}
                              >
                                <MedicalServices sx={{ fontSize: 40, color: "#6c5ce7", mb: 1 }} />
                                <Typography variant="subtitle2" fontWeight="bold">
                                  Physicians
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {typeof subsidiaryClinicianCount[aco.id] === "number"
                                    ? subsidiaryClinicianCount[aco.id]
                                    : "Loading..."}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Box>
                        </Box>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}