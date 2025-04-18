// src/pages/AcoReportDetail2024.js

import * as XLSX from "xlsx";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Paper,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  AttachMoney,
  Group,
  BarChart,
  Shield,
  MedicalServices,
  TrendingUp,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import Plot from "react-plotly.js";
import Papa from "papaparse";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Default metric values for 2024 (initially zeroed)
const defaultMetrics = {
  bondedAmount: "$0",
  membership: "0",
  sparxScore: "0",
  stopLoss: "$350K",
  projectedPMPM: "$0",
};

// Data file URLs for 2024
const DATA_2024_URL       = "/data/2024_data.csv";
const NPI_OUTPUT_24_URL   = "/data/npi_output24.csv";
const ACO_SUBSIDIARY_URL  = "/data/ACO_subsidiary list.csv";
const ENROLL_URL          = "/data/MEXPR - DATA_ENROLL.xlsx";
const CLAIMS_URL          = "/data/MEXPR - DATA_CLAIMS.xlsx";
const STOPLOSS_URL        = "/data/StoplossSumarry.csv";

// Define stoploss thresholds.
const stoplossThresholds = [
  "150K", "200K", "250K", "300K", "350K",
  "400K", "450K", "500K", "1M"
];

// Mapping for Financials downloads.
const financialMapping = {
  "Wellvana Health, LLC": "Wellvana_Financials.zip",
  // … etc …
};
// Mapping for QBR downloads.
const qbrMapping = {
  "Total Kidney Health of Northern California LLC":
    "C0002 - Satellite Q3-2024 Qtrly Benchmark Report.xlsx",
  // … etc …
};

// --- Utility Functions ---
function normalizeKey(str) {
  return (str || "")
    .toString()
    .replace(/[\u00A0]/g, " ")
    .replace(/[^ -~]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
function parseWholeNumber(value) {
  if (value == null) return 0;
  const num = parseInt(String(value).replace(/[$,%]/g, "").trim(), 10);
  return isNaN(num) ? 0 : num;
}
function parseOneDecimal(value) {
  if (value == null) return 0;
  const num = parseFloat(String(value).replace(/[$,%]/g, "").trim());
  return isNaN(num) ? 0 : parseFloat(num.toFixed(1));
}
function parseTwoDecimal(value) {
  if (value == null) return 0;
  const num = parseFloat(String(value).replace(/[$,%]/g, "").trim());
  return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
}
const parseCsv = (url) =>
  new Promise((resolve) => {
    Papa.parse(url, {
      download: true,
      header: true,
      complete: ({ data }) => resolve(data),
    });
  });
const parseExcelBySheet = async (fileUrl, targetId) => {
  try {
    const resp = await fetch(fileUrl);
    const buffer = await resp.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    let data = [];
    wb.SheetNames.forEach((name) => {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[name]);
      data = data.concat(
        rows.filter(
          (r) =>
            (r.ACO_ID || "")
              .toString()
              .toLowerCase()
              .trim() === targetId.toLowerCase().trim()
        )
      );
    });
    return data;
  } catch (e) {
    console.error("Error parsing Excel file:", e);
    return [];
  }
};

// Provider Map loader for 2024
const loadProviderMapData = async (
  acoId,
  setClinicianCount,
  setProviderMapPlot,
  setPhysicianBreakdown
) => {
  const results = await parseCsv(NPI_OUTPUT_24_URL);
  const validRows = results.filter((r) => {
    const lat = parseFloat(String(r.Latitude).trim());
    const lon = parseFloat(String(r.Longitude).trim());
    return (
      (r["Entity ID"] || "").toLowerCase().trim() ===
        acoId.toLowerCase().trim() &&
      !isNaN(lat) &&
      !isNaN(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    );
  });
  setClinicianCount(validRows.length);
  const latitudes = validRows.map((r) => parseFloat(String(r.Latitude).trim()));
  const longitudes = validRows.map((r) => parseFloat(String(r.Longitude).trim()));
  const hoverText = validRows.map(
    (r) => (r["NPI Name"] || "").trim() || "Unknown Provider"
  );
  const breakdownCounts = {
    Diagnostics: 0,
    "Primary Care": 0,
    "Long Term Care": 0,
    Specialty: 0,
  };
  validRows.forEach((r) => {
    if (breakdownCounts[r.Category] != null) {
      breakdownCounts[r.Category]++;
    }
  });
  const total = validRows.length;
  const breakdownPercentages = Object.fromEntries(
    Object.entries(breakdownCounts).map(([k, v]) => [
      k,
      total ? Math.round((v / total) * 100) : 0,
    ])
  );
  const trace = {
    type: "scattergeo",
    mode: "markers",
    lat: latitudes,
    lon: longitudes,
    text: hoverText,
    hoverinfo: "text",
    marker: { size: 8, color: "#6c5ce7", opacity: 0.7 },
  };
  const layout = {
    geo: {
      scope: "usa",
      resolution: 50,
      showland: true,
      landcolor: "#EAEAEA",
      subunitwidth: 1,
      countrywidth: 1,
      subunitcolor: "black",
      countrycolor: "black",
    },
    margin: { l: 0, r: 0, t: 0, b: 0 },
  };
  setProviderMapPlot({ data: [trace], layout });
  setPhysicianBreakdown(breakdownPercentages);
};

const AcoReportDetail2024 = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const printRef = useRef(null);

  // Add missing acoName state:
  const [acoName, setAcoName] = useState("");

  // Metric state
  const [bondedAmount, setBondedAmount] = useState(defaultMetrics.bondedAmount);
  const [membership, setMembership] = useState(defaultMetrics.membership);
  const [sparxScore, setSparxScore] = useState(defaultMetrics.sparxScore);
  const [stopLoss, setStopLoss] = useState(defaultMetrics.stopLoss);
  const [projectedPMPM, setProjectedPMPM] = useState(defaultMetrics.projectedPMPM);
  const [clinicianCount, setClinicianCount] = useState(0);

  // Chart state
  const [confidenceData, setConfidenceData] = useState([]);
  const [benchmarkPlot, setBenchmarkPlot] = useState(null);
  const [qbrPlot, setQbrPlot] = useState(null);
  const [pmpmPlot, setPmpmPlot] = useState(null);
  const [qualityPlot, setQualityPlot] = useState(null);
  const [quarterlyPmpmPlot, setQuarterlyPmpmPlot] = useState(null);
  const [quarterlyPercentagePlot, setQuarterlyPercentagePlot] = useState(null);
  const [providerMapPlot, setProviderMapPlot] = useState(null);
  const [physicianBreakdown, setPhysicianBreakdown] = useState({});
  const [stoplossData, setStoplossData] = useState([]);
  const [beneficiarySplit, setBeneficiarySplit] = useState(null);

  // Download menu state
  const [menuAnchor, setMenuAnchor] = useState(null);
  const handleDownloadClick = (e) => setMenuAnchor(e.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);

  // Download functions (PDF, QBR, Financials)
  const handleDownloadPDF = async () => {
    handleMenuClose();
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "px", "a4");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    let hLeft = imgH, pos = 0;
    pdf.addImage(imgData, "PNG", 0, pos, imgW, imgH, undefined, "FAST");
    hLeft -= pageH;
    while (hLeft > 0) {
      pos -= pageH;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, pos, imgW, imgH, undefined, "FAST");
      hLeft -= pageH;
    }
    pdf.save(`Sparx - ${acoName || id}.pdf`);
  };

  const handleDownloadQBRZip = async () => {
    handleMenuClose();
    Papa.parse(ACO_SUBSIDIARY_URL, {
      download: true,
      header: true,
      complete: ({ data }) => {
        const row = data.find(
          (r) => r.ACO_ID?.toLowerCase().trim() === id.toLowerCase().trim()
        );
        if (row?.subsidiary_co) {
          const fn =
            qbrMapping[row.subsidiary_co.trim()] ||
            `${row.subsidiary_co.trim()}_QBR.zip`;
          const a = document.createElement("a");
          a.href = `/data/QBRs/${encodeURIComponent(fn)}`;
          a.download = fn;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          alert("No QBR file found for this ACO.");
        }
      },
      error: (err) => console.error("Error reading subsidiary CSV", err),
    });
  };

  const handleDownloadFinancialZip = async () => {
    handleMenuClose();
    Papa.parse(ACO_SUBSIDIARY_URL, {
      download: true,
      header: true,
      complete: ({ data }) => {
        const row = data.find(
          (r) => r.ACO_ID?.toLowerCase().trim() === id.toLowerCase().trim()
        );
        if (row?.parent_co) {
          const fn =
            financialMapping[row.parent_co.trim()] ||
            `${row.parent_co.trim()}_Financials.zip`;
          const a = document.createElement("a");
          a.href = `/data/financials/${encodeURIComponent(fn)}`;
          a.download = fn;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          alert("No financial file found for this ACO.");
        }
      },
      error: (err) => console.error("Error reading subsidiary CSV", err),
    });
  };

  // Load Stop Loss for top card
  useEffect(() => {
    Papa.parse(ACO_SUBSIDIARY_URL, {
      download: true,
      header: true,
      complete: ({ data }) => {
        const row = data.find(
          (r) => r.ACO_ID?.toLowerCase().trim() === id.toLowerCase().trim()
        );
        if (row?.stop_loss) {
          setStopLoss(row.stop_loss);
        }
      },
      error: (err) => console.error("Error loading subsidiary CSV", err),
    });
  }, [id]);

  // Loader for stop‑loss payouts chart
  const loadStoplossData = useCallback(async () => {
    try {
      const rows = await parseCsv(STOPLOSS_URL);
      setStoplossData(rows);
    } catch (err) {
      console.error("Error loading StoplossSumarry.csv", err);
    }
  }, []);

  // Initial ancillary loads
  useEffect(() => {
    loadStoplossData();
    loadProviderMapData(
      id,
      setClinicianCount,
      setProviderMapPlot,
      setPhysicianBreakdown
    );
  }, [id, loadStoplossData]);

  // Main data loader
  useEffect(() => {
    const init = async () => {
      const data = await parseCsv(DATA_2024_URL);
      const row = data.find(
        (r) => String(r.ID || "").toLowerCase().trim() === id.toLowerCase().trim()
      );
      if (!row) return;

      // Header metrics
      if (row.bond_amount) {
        setBondedAmount(`$${Number(row.bond_amount).toLocaleString()}`);
      }
      const mem = parseFloat(row.Membership) || 0;
      setMembership(mem.toLocaleString());
      if (row.sparx) {
        setSparxScore(row.sparx.toString());
      }
      if (row["Q4 Spend"]) {
        const s = parseFloat(row["Q4 Spend"]) || 0;
        setProjectedPMPM(
          `$${s.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        );
      }

      // Shared Savings
      const quarters = ["Q1", "Q2", "Q3", "Q4"];
      const base = parseFloat(row["2023 Lookback Savings"]) || 0;
      const trace2023 = {
        x: quarters,
        y: quarters.map(() => base),
        mode: "lines+markers",
        name: "2023",
        marker: { color: "gray", size: 8 },
        line: { color: "gray" },
      };
      const trace2024 = {
        x: quarters,
        y: quarters.map((q) => parseFloat(row[q]) || 0),
        mode: "lines+markers",
        name: "2024",
        marker: { color: "#6c5ce7", size: 8 },
        line: { color: "#6c5ce7" },
        error_y: {
          type: "data",
          array: quarters.map((q) => parseFloat(row[`${q} CI`]) || 0),
          visible: true,
        },
      };
      setConfidenceData([trace2023, trace2024]);

      // Benchmark vs Expenditure
      setBenchmarkPlot({
        data: [
          {
            x: quarters,
            y: quarters.map(
              (q) => parseTwoDecimal(row[`${q} Benchmark`]) || 0
            ),
            name: "Benchmark",
            type: "bar",
            marker: { color: "gray" },
          },
          {
            x: quarters,
            y: quarters.map((q) => parseTwoDecimal(row[`${q} Spend`]) || 0),
            name: "Expenditure",
            type: "bar",
            marker: { color: "#6c5ce7" },
          },
        ],
        layout: {
          barmode: "group",
          title: "Projected Benchmark vs Expenditure (2024)",
          xaxis: { title: { text: "Quarter (Data Released)" } },
          yaxis: { title: { text: "PMPM Cost" }, tickprefix: "$" },
          margin: { l: 60, r: 50, t: 60, b: 70 },
          autosize: true,
        },
      });

      // QBR vs Sparx
      const qbrB = parseTwoDecimal(row["QBR Benchmark"]) || 0;
      const q3B = parseTwoDecimal(row["Q3 Benchmark"]) || 0;
      const qbrS = parseTwoDecimal(row["QBR Spend"]) || 0;
      const q3S = parseTwoDecimal(row["Q3 Spend"]) || 0;
      setQbrPlot({
        data: [
          {
            x: ["QBR", "Sparx"],
            y: [qbrB, q3B],
            name: "Benchmark",
            type: "bar",
            marker: { color: "#2f5d87" },
          },
          {
            x: ["QBR", "Sparx"],
            y: [qbrS, q3S],
            name: "Expenditure",
            type: "bar",
            marker: { color: "#d66035" },
          },
        ],
        layout: {
          barmode: "group",
          title: "QBR vs Sparx (2024)",
          xaxis: { title: "Group" },
          yaxis: { title: "PMPM Cost", tickprefix: "$" },
          margin: { l: 60, r: 20, t: 50, b: 50 },
          autosize: true,
        },
      });

      // Industry results: Member Months vs PMPM & Quality Percentile
      const reachData = await parseCsv("/data/REACH_PUF2023.csv");
      const msspData = await parseCsv("/data/MSSP_PUF2023.csv");
      const kccData = await parseCsv("/data/KCC_PUF2023.csv");
      const processRow = (r, prog) => {
        let eligible, cost, quality, risk, acoId, name;
        if (prog === "REACH") {
          eligible = parseOneDecimal(r["Total Eligible Months8"]);
          cost = parseTwoDecimal(r["Total Cost of Care12"]);
          quality = parseOneDecimal(r["Total Quality Score13"]);
          risk = r["Risk\nArrangement2"];
          acoId = r["ACO\nID"]?.trim();
          name = r["ACO Name"];
        } else if (prog === "MSSP") {
          const raw = parseOneDecimal(r["N_AB"]);
          eligible = raw ? raw * 12 : 0;
          cost = parseTwoDecimal(r["ABtotExp"]) || parseOneDecimal(r["Expenditures"]);
          quality = parseOneDecimal(r["QualScore"]);
          risk = r["Current_Track"];
          acoId = r["ACO_ID"]?.toString().trim();
          name = r["ACO_Name"];
        } else {
          eligible = parseOneDecimal(r["Beneficiary Months (CKD & ESRD)"]);
          const key =
            r["Performance Year Expenditure\n (CKD & ESRD)"] !== undefined
              ? "Performance Year Expenditure\n (CKD & ESRD)"
              : "Performance Year Expenditure (CKD & ESRD)";
          cost = parseTwoDecimal(r[key]);
          quality = parseOneDecimal(r["Total Quality Score"]);
          risk = r["Agreement Option"]?.trim();
          acoId = r["Entity Legal Business Name"]?.trim();
          name = r["Entity Legal Business Name"];
        }
        return {
          acoId: acoId?.toLowerCase().trim(),
          program: prog,
          risk,
          eligible,
          pmpm: eligible && cost ? parseFloat((cost / eligible).toFixed(1)) : 0,
          quality,
          name,
        };
      };
      const combined = [
        ...reachData.map((r) => processRow(r, "REACH")),
        ...msspData.map((r) => processRow(r, "MSSP")),
        ...kccData.map((r) => processRow(r, "KCC")),
      ].filter((d) => d.acoId);
      const lower = id.toLowerCase().trim();
      const current = combined.find((a) => a.acoId === lower);
      if (current) setAcoName(`${current.name} (2024)`);
      const sameGroup = combined.filter(
        (a) => a.program === current.program && a.risk === current.risk
      );
      setPmpmPlot({
        x: sameGroup.map((a) => a.eligible),
        y: sameGroup.map((a) => a.pmpm),
        text: sameGroup.map((a) => (a.acoId === lower ? a.name : "")),
        mode: "markers",
        type: "scatter",
        marker: {
          size: sameGroup.map((a) => (a.acoId === lower ? 20 : 10)),
          color: sameGroup.map((a) => (a.acoId === lower ? "#6c5ce7" : "#e7c56c")),
        },
      });
      const sorted = [...sameGroup].sort((a, b) => a.quality - b.quality);
      setQualityPlot({
        x: sorted.map((_, i) => ((i + 1) / sorted.length) * 100),
        y: sorted.map((a) => a.quality),
        text: sorted.map((a) => (a.acoId === lower ? a.name : "")),
        mode: "markers+lines",
        type: "scatter",
        marker: {
          size: sorted.map((a) => (a.acoId === lower ? 16 : 8)),
          color: sorted.map((a) => (a.acoId === lower ? "#6c5ce7" : "#e7c56c")),
        },
      });

      // Monthly PMPM & Expense Distribution
      const enrollRows = await parseExcelBySheet(ENROLL_URL, id);
      const claimsRows = await parseExcelBySheet(CLAIMS_URL, id);
      const enrollByQ = {}, claimsByQ = {};
      enrollRows.forEach((r) => {
        if (r.PERF_YR?.toString() === "2024") {
          const q = r.CLNDR_MNTH?.toString();
          enrollByQ[q] = (enrollByQ[q] || 0) + parseTwoDecimal(r.ELIG_MNTHS);
        }
      });
      const claimMap = {
        "60": "Inpatient", "20": "SNF", "30": "SNF",
        "10": "HHA", "50": "Hospice", "71": "Professional",
        "72": "Professional", "40": "Outpatient", "41": "DME", "42": "DME"
      };
      claimsRows.forEach((r) => {
        if (r.PERF_YR?.toString() === "2024") {
          const q = r.CLNDR_MNTH?.toString();
          const cat = claimMap[r.CLM_TYPE_CD];
          if (!cat) return;
          claimsByQ[q] = claimsByQ[q] || {};
          claimsByQ[q][cat] =
            (claimsByQ[q][cat] || 0) +
            parseTwoDecimal(r.DC_AMT_AGG_APA || r.ACO_AMT_AGG_APA);
        }
      });
      const qs = Object.keys(enrollByQ)
        .map((m) => parseInt(m, 10))
        .sort((a, b) => a - b);
      const monthLabels = qs.map((m) =>
        ({
          1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
          7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
        }[m] || m.toString())
      );
      const categories = ["Inpatient","SNF","HHA","Hospice","Professional","Outpatient","DME"];
      const pmpmData = {}, pctData = {};
      categories.forEach((c) => { pmpmData[c] = []; pctData[c] = []; });
      qs.forEach((q) => {
        const totE = enrollByQ[q] || 0;
        const claimsForQ = claimsByQ[q] || {};
        let totExp = 0;
        categories.forEach((c) => (totExp += claimsForQ[c] || 0));
        categories.forEach((c) => {
          pmpmData[c].push(totE ? parseFloat((claimsForQ[c] || 0) / totE).toFixed(2) : 0);
          pctData[c].push(totExp ? parseFloat(((claimsForQ[c] || 0) / totExp) * 100).toFixed(2) : 0);
        });
      });
      const pastelColors = categories.map((_, i) => `hsl(${Math.round(360/categories.length*i)},75%,65%)`);
      setQuarterlyPmpmPlot({
        data: categories.map((cat,i) => ({ x: monthLabels, y: pmpmData[cat], name: cat, type: "bar", marker: { color: pastelColors[i] } })),
        layout: { barmode: "stack", title: `${current?.name} - 2024 Monthly Paid PMPM`, xaxis: { title: "Month" }, yaxis: { title: "PMPM", tickprefix: "$" } }
      });
      setQuarterlyPercentagePlot({
        data: categories.map((cat,i) => ({ x: monthLabels, y: pctData[cat], name: cat, type: "bar", marker: { color: pastelColors[i], ticksuffix: "%" } })),
        layout: { barmode: "stack", title: `${current?.name} - 2024 Monthly Expense Distribution (%)`, xaxis: { title: "Month" }, yaxis: { title: "Percent of total", ticksuffix: "%" } }
      });
    };

    init();
  }, [id]);

  const confidenceLayout = {
    title: "Projected % (2024 & 2023)",
    xaxis: { title: { text: "Quarter (Data Released)" }, showgrid: false },
    yaxis: { title: { text: "Shared Savings Percentage" }, showgrid: true, rangemode: "tozero", ticksuffix: "%" },
    autosize: true, hovermode: "closest", margin: { l: 50, r: 20, t: 40, b: 40 }
  };

  const stoplossEntity =
    stoplossData.find(
      (row) =>
        String(row["Entity ID"] || "").toLowerCase().trim() === id.toLowerCase().trim()
    ) || null;

  const metricsWithValues = [
    { title: "Bonded Amount", value: bondedAmount,   icon: <AttachMoney fontSize="large"/> },
    { title: "Membership",    value: membership,     icon: <Group fontSize="large"/> },
    { title: "Sparx Score",   value: sparxScore,     icon: <BarChart fontSize="large"/> },
    { title: "Stop Loss",     value: stopLoss,       icon: <Shield fontSize="large"/> },
    { title: "Physicians",    value: clinicianCount.toLocaleString(), icon: <MedicalServices fontSize="large"/> },
    { title: "Projected PMPM",value: projectedPMPM,  icon: <TrendingUp fontSize="large"/> },
  ];

  return (
    <Box ref={printRef} sx={{ width: "100%", minHeight: "100vh", px: { xs: 2, sm: 3, md: 4 }, py: 3, boxSizing: "border-box", flexGrow: 1 }}>
      {/* Header & Menu */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Button variant="contained" onClick={handleDownloadClick} sx={{ textTransform: "none", fontWeight: "bold" }}>
          Download
        </Button>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
          <MenuItem onClick={handleDownloadPDF}>Download Analysis (PDF)</MenuItem>
          <MenuItem onClick={handleDownloadQBRZip}>Download QBR</MenuItem>
          <MenuItem onClick={handleDownloadFinancialZip}>Download Financials</MenuItem>
        </Menu>
        <Button variant="contained" size="small" onClick={() => navigate(-1)} sx={{ textTransform: "none", fontWeight: "bold" }}>
          ← Back to Reports
        </Button>
      </Box>

      {/* Title */}
      <Typography variant="h5" fontWeight="bold" mb={4}>
        {acoName || "ACO Report (2024)"}
      </Typography>

      {/* Metric Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3, mb: 5 }}>
        {metricsWithValues.map((item, i) => (
          <Card key={i} sx={{ height: "100%", minHeight: 80 }}>
            <CardContent sx={{ display: "flex", alignItems: "center", py: 2 }}>
              <Avatar sx={{ bgcolor: "#6c5ce7", width: 48, height: 48, mr: 2 }}>
                {item.icon}
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight="medium">{item.title}</Typography>
                <Typography variant="h5" fontWeight="bold">{item.value}</Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Shared Savings */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>Shared Savings</Typography>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Plot data={confidenceData} layout={confidenceLayout} config={{ scrollZoom: false }} useResizeHandler style={{ width: "100%", height: "300px" }} />
        </Paper>
      </Box>

      {/* Benchmark vs Expenditure */}
      {benchmarkPlot && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Projected Benchmark vs Expenditure (2024)</Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Plot data={benchmarkPlot.data} layout={benchmarkPlot.layout} config={{ scrollZoom: false }} useResizeHandler style={{ width: "100%", height: "400px" }} />
          </Paper>
        </Box>
      )}

      {/* Monthly PMPM by Claim Type */}
      {quarterlyPmpmPlot && (
        <Paper sx={{ mb: 5, p: 2 }}>
          <Typography variant="h6">Monthly Paid PMPM by Claim Type</Typography>
          <Plot data={quarterlyPmpmPlot.data} layout={quarterlyPmpmPlot.layout} useResizeHandler style={{ width: "100%", height: "300px" }} />
        </Paper>
      )}

      {/* Monthly Expense Distribution (%) */}
      {quarterlyPercentagePlot && (
        <Paper sx={{ mb: 5, p: 2 }}>
          <Typography variant="h6">Monthly Expense Distribution (%)</Typography>
          <Plot data={quarterlyPercentagePlot.data} layout={quarterlyPercentagePlot.layout} useResizeHandler style={{ width: "100%", height: "300px" }} />
        </Paper>
      )}

      {/* Provider Map & Breakdown */}
      {providerMapPlot && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Geographic Distribution of Providers</Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
              <Box sx={{ flex: 3 }}>
                <Plot data={providerMapPlot.data} layout={providerMapPlot.layout} config={{ scrollZoom: false }} useResizeHandler style={{ width: "100%", height: "400px" }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200, border: "1px solid #e0e0e0", borderRadius: 2, p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Physician Breakdown</Typography>
                {Object.entries(physicianBreakdown).filter(([c,p])=>p>0).map(([c,p])=>(
                  <Box key={c} sx={{ mb: 2 }}>
                    <Typography variant="body2">{c} — {p}%</Typography>
                    <Box sx={{ backgroundColor: "#f0f0f0", borderRadius: 1, height: 8, width: "100%", position: "relative" }}>
                      <Box sx={{ backgroundColor: "#6c5ce7", height: "100%", width: `${p}%`, borderRadius: 1 }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* QBR vs Sparx */}
      {qbrPlot && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>QBR vs Sparx (2024)</Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Plot data={qbrPlot.data} layout={qbrPlot.layout} config={{ scrollZoom: false }} useResizeHandler style={{ width: "100%", height: "400px" }} />
          </Paper>
        </Box>
      )}

      {/* Stop Loss Payouts */}
      {stoplossEntity && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Stop Loss Payouts</Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Plot
              data={[
                {
                  type: "bar",
                  name: "Excess above threshold",
                  x: stoplossThresholds.map((t) => `Cost Over ${t}`),
                  y: stoplossThresholds.map((t) => {
                    const key = Object.keys(stoplossEntity).find((k) =>
                      normalizeKey(k) === `cost over ${t}`.toLowerCase()
                    );
                    return parseOneDecimal(stoplossEntity[key]);
                  }),
                  yaxis: "y1",
                  marker: { color: "#6c5ce7" },
                },
                {
                  type: "scatter",
                  mode: "lines+markers",
                  name: "Claimants above threshold",
                  x: stoplossThresholds.map((t) => `Cost Over ${t}`),
                  y: stoplossThresholds.map((t) => {
                    const key = Object.keys(stoplossEntity).find((k) =>
                      normalizeKey(k) === `mbrs ${t}`.toLowerCase()
                    );
                    return parseWholeNumber(stoplossEntity[key]);
                  }),
                  yaxis: "y2",
                  line: { color: "#d66035", width: 3 },
                  marker: { size: 6 },
                },
              ]}
              layout={{
                title: "2024 High Cost Claimants",
                barmode: "group",
                xaxis: { title: "Cost Threshold", tickangle: -15 },
                yaxis: {
                  title: "Costs Paid in Excess of Attachment Point",
                  tickprefix: "$",
                  tickformat: ",d",
                  side: "left",
                  showgrid: true,
                },
                yaxis2: {
                  title: { text: "Claimants above Threshold", font: { color: "#d66035" } },
                  overlaying: "y",
                  side: "right",
                  tickformat: ",d",
                  zeroline: false,
                  showgrid: false,
                },
                legend: { orientation: "h", y: -0.3 },
                margin: { l: 90, r: 70, t: 60, b: 80 },
              }}
              config={{ scrollZoom: false }}
              useResizeHandler
              style={{ width: "100%", height: "500px" }}
            />
          </Paper>
        </Box>
      )}

      {/* Industry Results - Member Months vs PMPM */}
      {pmpmPlot && (
        <Paper sx={{ mb: 5, p: 2 }}>
          <Typography variant="h6">Latest Industry Results - Member Months vs PMPM</Typography>
          <Plot
            data={[pmpmPlot]}
            layout={{
              autosize: true,
              xaxis: { title: { text: "Total Member Months" } },
              yaxis: { title: { text: "PMPM Cost" }, tickprefix: "$" },
            }}
            config={{ scrollZoom: false }}
            useResizeHandler
            style={{ width: "100%", height: "300px" }}
          />
        </Paper>
      )}

      {/* Industry Results - Quality Percentile */}
      {qualityPlot && (
        <Paper sx={{ mb: 5, p: 2 }}>
          <Typography variant="h6">Latest Industry Results - Percentile Rank of Quality Scores</Typography>
          <Plot
            data={[qualityPlot]}
            layout={{
              autosize: true,
              xaxis: { title: { text: "Percentile Rank" }, ticksuffix: "%" },
              yaxis: { title: { text: "Total Quality Score" }, ticksuffix: "%" },
            }}
            config={{ scrollZoom: false }}
            useResizeHandler
            style={{ width: "100%", height: "300px" }}
          />
        </Paper>
      )}
    </Box>
  );
};

export default AcoReportDetail2024;