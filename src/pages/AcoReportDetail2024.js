// src/pages/AcoReportDetail2024.js
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
  FormControl,
  Select,
  InputLabel,
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
import JSZip from "jszip";

// Default metric values for 2024 (initially zeroed)
const defaultMetrics = {
  bondedAmount: "$0",
  membership: "0",
  sparxScore: "0",
  stopLoss: "$350K",
  projectedPMPM: "$0",
};

// Data file URLs for 2024
const DATA_2024_URL = "/data/2024_data.csv";
const NPI_OUTPUT_24_URL = "/data/npi_output24.csv";
const STOPLOSS_URL = "/data/StoplossSumarry.csv";

// Define stoploss thresholds.
const stoplossThresholds = [
  "150K",
  "200K",
  "250K",
  "300K",
  "350K",
  "400K",
  "450K",
  "500K",
  "1M",
];

// --- Mapping Objects ---
// Mapping for Financials downloads.
const financialMapping = {
  "Wellvana Health, LLC": "Wellvana_Financials.zip",
  "Village Practice Management Company Holdings, LLC": "VPMC_Financials.zip",
  "US Renal Care, Inc.": "US Renal Care_Financials.zip",
  "Upperline Health Inc.": "Upperline_Financials.zip",
  "Theoria Medical PLLC": "Theoria_Financials.zip",
  "SLTCM Holdings LLC": "Sound Physicians_Financials.zip",
  "Bluerock Care Community LLC (DBA: Penn Ave Health)": "Penn Ave Health_Financials.zip",
  "Pathways Holdings": "Pathways Health_Financials.zip",
  "Complete Care Collaborative of the Midwest, LLC": "Midwest_Financials.zip",
  "Genuine Health Group, LLC": "Genuine Health_Financials.zip",
  "FEMG Holdings, LLC": "FEMG Health Partners_Financials.zip",
  "Evergreen Nephrology LLC": "Evergreen Nephrology_Financials.zip",
  "Complete Care Collaborative of the South, LLC": "Collaborative Care South_Financials.zip"
};
// Mapping for QBR downloads.
const qbrMapping = {
  "Total Kidney Health of Northern California LLC": "C0002 - Satellite Q3-2024 Qtrly Benchmark Report.xlsx",
  "Integrated Kidney Partners III LLC": "C0073 - Dallas Q3-2024 Qtrly Benchmark Report.xlsx",
  "Integrated Kidney Partners V LLC": "C0074 - San Antonio Q3-2024 Qtrly Benchmark Report.xlsx",
  "Upperline Health Inc.": "REACH.D0333.BNMR.PY2024.D250213.T1000540 (1).xlsx",
  "Integrated Kidney Partners II LLC": "C0083 - South FL Q3-2024 Qtrly Benchmark Report.xlsx",
  "Integrated Kidney Partners IX LLC": "C0190 - Upstate NY Q3-2024 Qtrly Benchmark Report.xlsx",
  "Integrated Kidney Partners VII LLC": "C0192 - FTW-Houston Q3-2024 Qtrly Benchmark Report.xlsx",
  "Integrated Kidney Partners VIII LLC": "C0193 - Alaska Q3-2024 Qtrly Benchmark Report.xlsx",
  "Integrated Kidney Partners X LLC": "C0194 - CO-Wyoming - Q3-2024 Qtrly Benchmark Report.xlsx",
  "Integrated Kidney Partners XX LLC": "C0204 - UT-Idaho - Q3-2024 Qtrly Benchmark Report.xlsx",
  "Integrated Kidney Partners XXIII LLC": "C0207 - Kansas City - Q3-2024 Qtrly Benchmark Report.xlsx",
  "Evergreen Nephrology LLC": "Evergreen Nephrology_QBR.zip",
  "Complete Care Collaborative of the South, LLC": "Collaborative Care South_QBR.zip"
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
      complete: (results) => resolve(results.data),
    });
  });

// For 2024 data we only use CSV parsing.
const loadNPIExcel = async () => {
  try {
    await parseCsv(DATA_2024_URL);
  } catch (err) {
    console.error("Error reading DATA_2024_URL:", err);
  }
};

// Provider Map loader for 2024 using NPI_OUTPUT_24_URL.
const loadProviderMapData = async (acoId, setClinicianCount, setProviderMapPlot, setPhysicianBreakdown) => {
  const results = await parseCsv(NPI_OUTPUT_24_URL);
  const validRows = results.filter((r) => {
    const lat = parseFloat(String(r.Latitude).trim());
    const lon = parseFloat(String(r.Longitude).trim());
    return (
      (r["Entity ID"] || "").toLowerCase().trim() === acoId.toLowerCase().trim() &&
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
  const hoverText = validRows.map((r) => (r["NPI Name"] || "").trim() || "Unknown Provider");
  const breakdownCounts = { Diagnostics: 0, "Primary Care": 0, "Long Term Care": 0, Specialty: 0 };
  validRows.forEach((r) => {
    const cat = r["Category"];
    if (cat && breakdownCounts.hasOwnProperty(cat)) {
      breakdownCounts[cat]++;
    }
  });
  const total = validRows.length;
  const breakdownPercentages = Object.fromEntries(
    Object.entries(breakdownCounts).map(([k, v]) => [k, total ? Math.round((v / total) * 100) : 0])
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

//////////////////////////
// AcoReportDetail2024 Component
//////////////////////////
const AcoReportDetail2024 = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Scroll to top on mount.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Component state.
  const [acoName, setAcoName] = useState("");
  const [clinicianCount, setClinicianCount] = useState(0);
  const [selectedQuarter, setSelectedQuarter] = useState("Q2");

  const [bondedAmount, setBondedAmount] = useState(defaultMetrics.bondedAmount);
  const [membership, setMembership] = useState(defaultMetrics.membership);
  const [sparxScore, setSparxScore] = useState(defaultMetrics.sparxScore);
  const [stopLoss, setStopLoss] = useState(defaultMetrics.stopLoss);
  const [projectedPMPM, setProjectedPMPM] = useState(defaultMetrics.projectedPMPM);

  // Graph states.
  const [benchmarkPlot, setBenchmarkPlot] = useState(null);
  const [qbrPlot, setQbrPlot] = useState(null);
  const [pmpmPlot, setPmpmPlot] = useState(null);
  const [qualityPlot, setQualityPlot] = useState(null);
  const [stoplossData, setStoplossData] = useState([]);
  const [quarterlyPmpmPlot, setQuarterlyPmpmPlot] = useState(null);
  const [quarterlyPercentagePlot, setQuarterlyPercentagePlot] = useState(null);
  const [providerMapPlot, setProviderMapPlot] = useState(null);
  const [physicianBreakdown, setPhysicianBreakdown] = useState({});
  const [confidenceData, setConfidenceData] = useState([]);
  const [beneficiarySplit, setBeneficiarySplit] = useState(null);

  // Download menu state.
  const [menuAnchor, setMenuAnchor] = useState(null);
  const printRef = useRef(null);
  const handleDownloadClick = (e) => setMenuAnchor(e.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);

  // ---- Download Functions ----
  const handleDownloadPDF = async () => {
    handleMenuClose();
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "px", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
    }
    pdf.save(`Sparx - ${acoName}.pdf`);
  };

  const handleDownloadQBRZip = async () => {
    handleMenuClose();
    Papa.parse("/data/ACO_subsidiary list.csv", {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data;
        const matchingRow = data.find(
          (r) => (r.ACO_ID || "").toLowerCase().trim() === id.toLowerCase().trim()
        );
        if (matchingRow && matchingRow.subsidiary_co) {
          const subsidiary_co = matchingRow.subsidiary_co.trim();
          const fileName = qbrMapping[subsidiary_co] || `${subsidiary_co}_QBR.zip`;
          const fileUrl = `/data/QBRs/${encodeURIComponent(fileName)}`;
          const a = document.createElement("a");
          a.href = fileUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          alert("No QBR file found for this ACO based on the subsidiary list.");
        }
      },
      error: (err) => {
        console.error("Error reading the subsidiary CSV", err);
        alert("There was an error processing the QBR file download.");
      },
    });
  };

  const handleDownloadFinancialZip = async () => {
    handleMenuClose();
    Papa.parse("/data/ACO_subsidiary list.csv", {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data;
        const matchingRow = data.find(
          (r) => (r.ACO_ID || "").toLowerCase().trim() === id.toLowerCase().trim()
        );
        if (matchingRow && matchingRow.parent_co) {
          const parentCo = matchingRow.parent_co.trim();
          const fileName = financialMapping[parentCo] || `${parentCo}_Financials.zip`;
          const fileUrl = `/data/financials/${encodeURIComponent(fileName)}`;
          const a = document.createElement("a");
          a.href = fileUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          alert("No financial file found for this ACO based on the subsidiary list.");
        }
      },
      error: (err) => {
        console.error("Error reading the subsidiary CSV", err);
        alert("There was an error processing the financial file download.");
      },
    });
  };

  // ---- Data Loaders ----
  useEffect(() => {
    parseCsv(DATA_2024_URL).then((data) => {
      const row = data.find(
        (r) => (r.ID || "").toLowerCase().trim() === id.toLowerCase().trim()
      );
      if (row && row.bond_amount) {
        setBondedAmount(`$${Number(row.bond_amount).toLocaleString()}`);
      }
    });
  }, [id]);

  const loadAdditionalData = async () => {
    try {
      const sharedData = await parseCsv(DATA_2024_URL);
      const row = sharedData.find(
        (r) => (r.ID || "").toLowerCase().trim() === id.toLowerCase().trim()
      );
      if (!row) return;
      const mem = parseFloat(row["Membership"]) || 0;
      setMembership(mem.toLocaleString());
      setSparxScore(row["sparx"] ? row["sparx"].toString() : "");
      const q4Spend = parseFloat(String(row["Q4 Spend"]).replace(/[$,%]/g, "").trim()) || 0;
      const q4Formatted = Number(q4Spend).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setProjectedPMPM(`$${q4Formatted}`);
      await loadBenchmarkExpenditureGraph();
      const adPct = parseOneDecimal(row["AD %"]) || 0;
      const esrdPct = parseOneDecimal(row["ESRD %"]) || 0;
      const totalMemberMonths = parseOneDecimal(mem * 12);
      setBeneficiarySplit({ adPct, esrdPct, total: totalMemberMonths });
    } catch (error) {
      console.error("Error loading additional data:", error);
    }
  };

  const loadBenchmarkExpenditureGraph = async () => {
    try {
      const sharedData = await parseCsv(DATA_2024_URL);
      const row = sharedData.find(
        (r) => (r.ID || "").toLowerCase().trim() === id.toLowerCase().trim()
      );
      if (!row) {
        setBenchmarkPlot(null);
        return;
      }
      const quarters = ["Q1", "Q2", "Q3", "Q4"];
      const benchValues = quarters.map((q) => parseTwoDecimal(row[`${q} Benchmark`]) || 0);
      const spendValues = quarters.map((q) => parseTwoDecimal(row[`${q} Spend`]) || 0);
      const traceBench = {
        x: quarters,
        y: benchValues,
        name: "Benchmark",
        type: "bar",
        marker: { color: "gray" },
      };
      const traceSpend = {
        x: quarters,
        y: spendValues,
        name: "Expenditure",
        type: "bar",
        marker: { color: "#6c5ce7" },
      };
      setBenchmarkPlot({
        data: [traceBench, traceSpend],
        layout: {
          barmode: "group",
          title: "Projected Benchmark vs Expenditure (2024)",
          xaxis: { title: { text: "Quarter (Data Released)" } },
          yaxis: { title: { text: "PMPM Cost" }, tickprefix: "$" },
          margin: { l: 60, r: 50, t: 60, b: 70 },
          autosize: true,
        },
      });
    } catch (error) {
      console.error("Error loading Benchmark vs Expenditure graph:", error);
    }
  };

  const loadQBRVsSparxData = async () => {
    try {
      const data = await parseCsv(DATA_2024_URL);
      const row = data.find(
        (r) => (r.ID || "").toLowerCase().trim() === id.toLowerCase().trim()
      );
      if (!row) {
        setQbrPlot({ data: [], layout: { title: `No QBR data found for ACO ${id}` } });
        return;
      }
      const qbrBenchmark = parseTwoDecimal(row["QBR Benchmark"]) || 0;
      const q3Benchmark = parseTwoDecimal(row["Q3 Benchmark"]) || 0;
      const qbrSpend = parseTwoDecimal(row["QBR Spend"]) || 0;
      const q3Spend = parseTwoDecimal(row["Q3 Spend"]) || 0;
      const benchmarkTrace = {
        x: ["QBR", "Sparx"],
        y: [qbrBenchmark, q3Benchmark],
        name: "Benchmark",
        type: "bar",
        marker: { color: "#2f5d87" },
      };
      const expenditureTrace = {
        x: ["QBR", "Sparx"],
        y: [qbrSpend, q3Spend],
        name: "Expenditure",
        type: "bar",
        marker: { color: "#d66035" },
      };
      setQbrPlot({
        data: [benchmarkTrace, expenditureTrace],
        layout: {
          barmode: "group",
          title: "QBR vs Sparx (2024)",
          xaxis: { title: "Group" },
          yaxis: { title: "PMPM Cost", tickprefix: "$" },
          margin: { l: 60, r: 20, t: 50, b: 50 },
          autosize: true,
        },
      });
    } catch (error) {
      console.error("Error in loadQBRVsSparxData:", error);
    }
  };

  const loadSharedSavingsData = async () => {
    try {
      const sharedData = await parseCsv(DATA_2024_URL);
      const row = sharedData.find(
        (r) => (r.ID || "").toLowerCase().trim() === id.toLowerCase().trim()
      );
      if (!row) {
        console.warn(`No shared savings data found for ACO ID "${id}"`);
        setConfidenceData([]);
        return;
      }
      const quarters = ["Q1", "Q2", "Q3", "Q4"];
      const trace2023 = {
        x: quarters,
        y: quarters.map(() => parseFloat(row["2023 Lookback Savings"]) || 0),
        mode: "lines+markers",
        marker: { color: "gray", size: 8 },
        line: { color: "gray" },
        name: "2023",
      };
      const trace2024 = {
        x: quarters,
        y: quarters.map((q) => parseFloat(row[q]) || 0),
        mode: "lines+markers",
        marker: { color: "#6c5ce7", size: 8 },
        line: { color: "#6c5ce7" },
        name: "2024",
        error_y: {
          type: "data",
          array: quarters.map((q) => parseFloat(row[`${q} CI`]) || 0),
          visible: true,
        },
      };
      setConfidenceData([trace2023, trace2024]);
    } catch (error) {
      console.error("Error loading shared savings CSV:", error);
    }
  };

  // Load Monthly Graphs: "Monthly Paid PMPM by Claim Type" and "Monthly Expense Distribution (%)"
  const loadClaimsAndEnrollData = async (currentAcoName) => {
    const lowerId = id.toLowerCase().trim();
    const enrollData = await parseCsv(DATA_2024_URL);
    const claimsData = await parseCsv(DATA_2024_URL);
    const enrollByQuarter = {};
    enrollData.forEach((row) => {
      if (row.PERF_YR && row.PERF_YR.toString().trim() === "2024") {
        const q = row.CLNDR_MNTH && row.CLNDR_MNTH.toString().trim();
        const elig = parseTwoDecimal(row.ELIG_MNTHS);
        if (!enrollByQuarter[q]) enrollByQuarter[q] = 0;
        enrollByQuarter[q] += elig;
      }
    });
    const claimTypeMapping = {
      "60": "Inpatient",
      "20": "SNF",
      "30": "SNF",
      "10": "HHA",
      "50": "Hospice",
      "71": "Professional",
      "72": "Professional",
      "40": "Outpatient",
      "41": "DME",
      "42": "DME",
    };
    const claimsByQuarter = {};
    claimsData.forEach((row) => {
      if (row.PERF_YR && row.PERF_YR.toString().trim() === "2024") {
        const q = row.CLNDR_MNTH && row.CLNDR_MNTH.toString().trim();
        const code = row.CLM_TYPE_CD;
        const category = claimTypeMapping[code];
        if (!category) return;
        const amt =
          row.DC_AMT_AGG_APA !== undefined
            ? parseTwoDecimal(row.DC_AMT_AGG_APA)
            : parseTwoDecimal(row.ACO_AMT_AGG_APA);
        if (!claimsByQuarter[q]) claimsByQuarter[q] = {};
        if (!claimsByQuarter[q][category]) claimsByQuarter[q][category] = 0;
        claimsByQuarter[q][category] += amt;
      }
    });
    const quarters = Object.keys(enrollByQuarter)
      .map((m) => parseInt(m, 10))
      .sort((a, b) => a - b);
    const monthMap = {
      1: "Jan",
      2: "Feb",
      3: "Mar",
      4: "Apr",
      5: "May",
      6: "Jun",
      7: "Jul",
      8: "Aug",
      9: "Sep",
      10: "Oct",
      11: "Nov",
      12: "Dec",
    };
    const monthLabels = quarters.map((m) => monthMap[m] || m.toString());
    const categories = [
      "Inpatient",
      "SNF",
      "HHA",
      "Hospice",
      "Professional",
      "Outpatient",
      "DME",
    ];
    const pmpmData = {};
    const percentageData = {};
    categories.forEach((cat) => {
      pmpmData[cat] = [];
      percentageData[cat] = [];
    });
    quarters.forEach((q) => {
      const totalElig = enrollByQuarter[q] || 0;
      const claimsForQ = claimsByQuarter[q] || {};
      let totalExp = 0;
      categories.forEach((cat) => {
        totalExp += claimsForQ[cat] || 0;
      });
      categories.forEach((cat) => {
        const exp = claimsForQ[cat] || 0;
        const pmpmVal = totalElig ? parseFloat((exp / totalElig).toFixed(2)) : 0;
        pmpmData[cat].push(pmpmVal);
        const pctVal = totalExp ? parseFloat(((exp / totalExp) * 100).toFixed(2)) : 0;
        percentageData[cat].push(pctVal);
      });
    });
    const pastelColors = categories.map((_, i) => {
      const hue = Math.round((360 / categories.length) * i);
      return `hsl(${hue}, 75%, 65%)`;
    });
    const pmpmTraces = categories.map((cat, i) => ({
      x: monthLabels,
      y: pmpmData[cat],
      name: cat,
      type: "bar",
      marker: { color: pastelColors[i] },
    }));
    const percentageTraces = categories.map((cat, i) => ({
      x: monthLabels,
      y: percentageData[cat],
      name: cat,
      type: "bar",
      marker: { color: pastelColors[i], ticksuffix: "%" },
    }));
    // ---- Monthly Paid PMPM by Claim Type ----
    setQuarterlyPmpmPlot({
      data: pmpmTraces,
      layout: {
        barmode: "stack",
        title: `${currentAcoName} - 2024 Monthly Paid PMPM`,
        xaxis: { title: { text: "Month" } },
        yaxis: { title: { text: "PMPM" }, tickprefix: "$" },
      },
    });
    // ---- Monthly Expense Distribution (%) ----
    setQuarterlyPercentagePlot({
      data: percentageTraces,
      layout: {
        barmode: "stack",
        title: `${currentAcoName} - 2024 Monthly Expense Distribution (%)`,
        xaxis: { title: { text: "Month" } },
        yaxis: { title: { text: "Percent of total" }, ticksuffix: "%" },
      },
    });
  };

  // ---- Main Data Loader ----
  useEffect(() => {
    const loadAllData = async () => {
      const [reach, mssp, kcc] = await Promise.all([
        parseCsv("/data/REACH_PUF2023.csv"),
        parseCsv("/data/MSSP_PUF2023.csv"),
        parseCsv("/data/KCC_PUF2023.csv"),
      ]);
      const processRow = (row, program) => {
        let eligible, cost, quality, risk, acoId, name;
        if (program === "REACH") {
          eligible = parseOneDecimal(row["Total Eligible Months8"]);
          cost = parseTwoDecimal(row["Total Cost of Care12"]);
          quality = parseOneDecimal(row["Total Quality Score13"]);
          risk = row["Risk\nArrangement2"];
          acoId = row["ACO\nID"]?.trim();
          name = row["ACO Name"];
        } else if (program === "MSSP") {
          const rawEligible = parseOneDecimal(row["N_AB"]);
          const eligibleVal = rawEligible ? rawEligible * 12 : 0;
          eligible = parseFloat(eligibleVal.toFixed(1));
          cost = parseTwoDecimal(row["ABtotExp"]) || parseOneDecimal(row["Expenditures"]);
          quality = parseOneDecimal(row["QualScore"]);
          risk = row["Current_Track"];
          acoId = row["ACO_ID"]?.toString().trim();
          name = row["ACO_Name"];
        } else if (program === "KCC") {
          eligible = parseOneDecimal(row["Beneficiary Months (CKD & ESRD)"]);
          const costKey =
            row["Performance Year Expenditure\n (CKD & ESRD)"] !== undefined
              ? "Performance Year Expenditure\n (CKD & ESRD)"
              : "Performance Year Expenditure (CKD & ESRD)";
          cost = parseTwoDecimal(row[costKey]);
          quality = parseOneDecimal(row["Total Quality Score"]);
          risk = row["Agreement Option"]?.trim();
          acoId = row["Entity Legal Business Name"]?.trim();
          name = row["Entity Legal Business Name"];
        }
        return {
          acoId,
          name,
          program,
          risk,
          eligible,
          cost,
          quality,
          pmpm: eligible && cost ? parseFloat((cost / eligible).toFixed(1)) : null,
        };
      };
      const combined = [
        ...reach.map((r) => processRow(r, "REACH")),
        ...mssp.map((r) => processRow(r, "MSSP")),
        ...kcc.map((r) => processRow(r, "KCC")),
      ].filter((d) => d.acoId && d.pmpm != null && d.quality != null);
      const current = combined.find(
        (a) => (a.acoId || "").toLowerCase() === id.toLowerCase().trim()
      );
      if (!current) return;
      setAcoName(current.name + " (2024)");
      await loadClaimsAndEnrollData(current.name);
    };

    const loadStoplossData = async () => {
      const rows = await parseCsv(STOPLOSS_URL);
      setStoplossData(rows);
    };

    const loadProviderData = async () => {
      await loadProviderMapData(id, setClinicianCount, setProviderMapPlot, setPhysicianBreakdown);
    };

    const init = async () => {
      await loadNPIExcel();
      await loadAllData();
      await loadBenchmarkExpenditureGraph();
      await loadQBRVsSparxData();
      await loadStoplossData();
      await loadProviderData();
      await loadSharedSavingsData();
      await loadAdditionalData();
    };
    init();
  }, [id, selectedQuarter]);

  // Static fallback Shared Savings.
  const line2024Trace = {
    x: ["Q1", "Q2", "Q3", "Q4"],
    y: [5, 5, 5, 5],
    mode: "lines+markers",
    marker: { color: "gray", size: 8 },
    line: { color: "gray" },
    name: "2024",
  };
  const confidenceLayout = {
    title: "Projected % (2024)",
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

  const stoplossEntity =
    stoplossData && stoplossData.length > 0
      ? stoplossData.find(
          (row) => (row["Entity ID"] || "").toLowerCase().trim() === id.toLowerCase().trim()
        )
      : null;

  // ---- Updated Metrics ----
  // "Bonded Amount" is loaded from DATA_2024_URL via its bond_amount field.
  // "Physicians" metric now uses the clinicianCount value.
  const metricsWithValuesDisplay = [
    { title: "Bonded Amount", value: bondedAmount, icon: <AttachMoney fontSize="large" /> },
    { title: "Membership", value: membership, icon: <Group fontSize="large" /> },
    { title: "Sparx Score", value: sparxScore, icon: <BarChart fontSize="large" /> },
    { title: "Stop Loss", value: stopLoss, icon: <Shield fontSize="large" /> },
    { title: "Physicians", value: clinicianCount ? clinicianCount.toLocaleString() : "0", icon: <MedicalServices fontSize="large" /> },
    { title: "Projected PMPM", value: projectedPMPM, icon: <TrendingUp fontSize="large" /> },
  ];

  return (
    <Box
      ref={printRef}
      sx={{
        width: "100%",
        minHeight: "100vh",
        px: { xs: 2, sm: 3, md: 4 },
        py: 3,
        boxSizing: "border-box",
        flexGrow: 1,
      }}
    >
      {/* Header and Download Menu */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Button variant="contained" color="primary" onClick={handleDownloadClick} sx={{ textTransform: "none", fontWeight: "bold" }}>
          Download
        </Button>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
          <MenuItem onClick={handleDownloadPDF}>Download Analysis</MenuItem>
          <MenuItem onClick={handleDownloadQBRZip}>Download QBR</MenuItem>
          <MenuItem onClick={handleDownloadFinancialZip}>Download Financials</MenuItem>
        </Menu>
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate(-1)}
          sx={{
            backgroundColor: "#6c5ce7",
            "&:hover": { backgroundColor: "#5346d9" },
            textTransform: "none",
            fontWeight: "bold",
          }}
        >
          ← Back to Reports
        </Button>
      </Box>
      <Typography variant="h5" fontWeight="bold" mb={4}>
        {acoName || "ACO Report (2024)"}
      </Typography>

      {/* Metric Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3, mb: 5 }}>
        {metricsWithValuesDisplay.map((item, index) => (
          <Card key={index} sx={{ height: "100%", minHeight: 80 }}>
            <CardContent sx={{ display: "flex", alignItems: "center", py: 2 }}>
              <Avatar sx={{ bgcolor: "#6c5ce7", width: 48, height: 48, mr: 2 }}>
                {item.icon}
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight="medium">{item.title}</Typography>
                <Typography variant="h5" fontWeight="bold">
                  {item.value}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Shared Savings Chart */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Shared Savings
        </Typography>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Plot
            data={confidenceData.length > 0 ? confidenceData : [line2024Trace]}
            layout={confidenceLayout}
            config={{ scrollZoom: false }}
            useResizeHandler
            style={{ width: "100%", height: "300px" }}
          />
        </Paper>
      </Box>

      {/* Benchmark vs Expenditure Graph */}
      {benchmarkPlot && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Projected Benchmark vs Expenditure (2024)
          </Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Plot
              data={benchmarkPlot.data}
              layout={benchmarkPlot.layout}
              config={{ scrollZoom: false }}
              useResizeHandler
              style={{ width: "100%", height: "400px" }}
            />
          </Paper>
        </Box>
      )}

      {/* QBR vs Sparx Graph */}
      {qbrPlot && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            QBR vs Sparx (2024)
          </Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Plot
              data={qbrPlot.data}
              layout={qbrPlot.layout}
              config={{ scrollZoom: false }}
              useResizeHandler
              style={{ width: "100%", height: "400px" }}
            />
          </Paper>
        </Box>
      )}

      {/* Monthly Paid PMPM by Claim Type */}
      {quarterlyPmpmPlot && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Monthly Paid PMPM by Claim Type
          </Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Plot
              data={quarterlyPmpmPlot.data}
              layout={quarterlyPmpmPlot.layout}
              config={{ scrollZoom: false }}
              useResizeHandler
              style={{ width: "100%", height: "100%" }}
            />
          </Paper>
        </Box>
      )}

      {/* Monthly Expense Distribution (%) */}
      {quarterlyPercentagePlot && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Monthly Expense Distribution (%)
          </Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Plot
              data={quarterlyPercentagePlot.data}
              layout={quarterlyPercentagePlot.layout}
              config={{ scrollZoom: false }}
              useResizeHandler
              style={{ width: "100%", height: "100%" }}
            />
          </Paper>
        </Box>
      )}

      {/* Latest Industry Results - Member Months vs PMPM */}
      {pmpmPlot && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Latest Industry Results - Member Months vs PMPM
          </Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Plot
              data={[pmpmPlot]}
              layout={{
                autosize: true,
                xaxis: { title: { text: "Total Member Months" } },
                yaxis: { title: { text: "PMPM Cost" }, tickprefix: "$" },
                hovermode: "closest",
              }}
              config={{ scrollZoom: false }}
              useResizeHandler
              style={{ width: "100%", height: "100%" }}
            />
          </Paper>
        </Box>
      )}

      {/* Latest Industry Results - Percentile Rank of Quality Scores */}
      {qualityPlot && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Latest Industry Results - Percentile Rank of Quality Scores
          </Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Plot
              data={[qualityPlot]}
              layout={{
                autosize: true,
                xaxis: { title: { text: "Percentile Rank" }, ticksuffix: "%" },
                yaxis: { title: { text: "Total Quality Score" }, ticksuffix: "%" },
                hovermode: "closest",
              }}
              config={{ scrollZoom: false }}
              useResizeHandler
              style={{ width: "100%", height: "100%" }}
            />
          </Paper>
        </Box>
      )}

      {/* Provider Map & Physician Breakdown */}
      {providerMapPlot && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Geographic Distribution of Providers
          </Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
              <Box sx={{ flex: 3 }}>
                <Plot
                  data={providerMapPlot.data}
                  layout={providerMapPlot.layout}
                  config={{ scrollZoom: false }}
                  useResizeHandler
                  style={{ width: "100%", height: "400px" }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200, border: "1px solid #e0e0e0", borderRadius: 2, p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Physician Breakdown
                </Typography>
                {Object.entries(physicianBreakdown)
                  .filter(([cat, pct]) => pct > 0)
                  .map(([cat, pct]) => (
                    <Box key={cat} sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {cat} — {pct}%
                      </Typography>
                      <Box
                        sx={{
                          backgroundColor: "#f0f0f0",
                          borderRadius: 1,
                          height: 8,
                          width: "100%",
                          position: "relative",
                        }}
                      >
                        <Box sx={{ backgroundColor: "#6c5ce7", height: "100%", width: `${pct}%`, borderRadius: 1 }} />
                      </Box>
                    </Box>
                  ))}
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Stop Loss Payouts */}
      {stoplossEntity && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Stop Loss Payouts
          </Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Plot
              data={[
                {
                  type: "bar",
                  name: "Excess above threshold",
                  x: stoplossThresholds.map((t) => `Cost Over ${t}`),
                  y: stoplossThresholds.map((t) => {
                    const key = Object.keys(stoplossEntity).find(
                      (k) => normalizeKey(k) === `cost over ${t}`.toLowerCase()
                    );
                    return parseOneDecimal(stoplossEntity[key]);
                  }),
                  yaxis: "y1",
                  marker: { color: "#2f5ce7" },
                },
                {
                  type: "scatter",
                  mode: "lines+markers",
                  name: "Claimants above threshold",
                  x: stoplossThresholds.map((t) => `Cost Over ${t}`),
                  y: stoplossThresholds.map((t) => {
                    const key = Object.keys(stoplossEntity).find(
                      (k) => normalizeKey(k) === `mbrs ${t}`.toLowerCase()
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
                  titlefont: { color: "#d66035" },
                  tickfont: { color: "#d66035" },
                  overlaying: "y",
                  side: "right",
                  tickformat: ",d",
                  zeroline: false,
                  showline: false,
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

      {/* Latest Industry Results - Member Months vs PMPM */}
      {pmpmPlot && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Latest Industry Results - Member Months vs PMPM
          </Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Plot
              data={[pmpmPlot]}
              layout={{
                autosize: true,
                xaxis: { title: { text: "Total Member Months" } },
                yaxis: { title: { text: "PMPM Cost" }, tickprefix: "$" },
                hovermode: "closest",
              }}
              config={{ scrollZoom: false }}
              useResizeHandler
              style={{ width: "100%", height: "100%" }}
            />
          </Paper>
        </Box>
      )}

      {/* Latest Industry Results - Percentile Rank of Quality Scores */}
      {qualityPlot && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Latest Industry Results - Percentile Rank of Quality Scores
          </Typography>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Plot
              data={[qualityPlot]}
              layout={{
                autosize: true,
                xaxis: { title: { text: "Percentile Rank" }, ticksuffix: "%" },
                yaxis: { title: { text: "Total Quality Score" }, ticksuffix: "%" },
                hovermode: "closest",
              }}
              config={{ scrollZoom: false }}
              useResizeHandler
              style={{ width: "100%", height: "100%" }}
            />
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default AcoReportDetail2024;