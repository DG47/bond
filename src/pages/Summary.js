import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TableSortLabel,
  CircularProgress,
} from "@mui/material";

// Helper: compares two records in descending order using the given key.
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

// Returns a comparator function based on sort order and column.
function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// Stable sort: maintains the original order if values are equal.
function stableSort(array, comparator) {
  const stabilized = array.map((el, index) => [el, index]);
  stabilized.sort((a, b) => {
    const cmp = comparator(a[0], b[0]);
    return cmp !== 0 ? cmp : a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
}

const Summary = () => {
  // Sorting state: sort order and column key.
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("bondNumber");

  // State to hold bond data loaded from CSV.
  const [bondData, setBondData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load CSV data when the component mounts.
  useEffect(() => {
    Papa.parse("/data/summary_page.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Log the parsed data to check the header mapping.
        console.log("CSV results:", results.data);
        // Map CSV fields to desired property names.
        const data = results.data.map((item) => ({
          bondNumber: item["Bond Number"]?.trim(),
          bondAmount: parseFloat(
            item["Bond Amount"]
              ?.replace(/\$/g, "") // Remove dollar signs, if any.
              .replace(/,/g, "")   // Remove commas.
              .trim()
          ),
          principalName: item["Principal Name"]?.trim(),
          ownershipCompany: item["Ownership Name"]?.trim(),
          performanceYear: parseInt(item["Performance Year"]?.trim(), 10),
          bondType: item["Bond Type"]?.trim(),
          rate: item["Rate"]?.trim(),
          ratePercentage: parseFloat(
            item["Rate Percentage"]
              ?.replace(/[^0-9.]/g, "") // Allow only digits and the period.
              .trim()
          ),
        }));
        setBondData(data);
        setLoading(false);
      },
      error: (error) => {
        console.error("Error loading CSV:", error);
        setLoading(false);
      },
    });
  }, []);

  // Handler for column header clicks to update sort order.
  const handleSort = (columnName) => {
    if (orderBy === columnName) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(columnName);
      setOrder("asc");
    }
  };

  // Apply sorting to the loaded data.
  const sortedData = stableSort(bondData, getComparator(order, orderBy));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" fontWeight="bold" sx={{ mb: 3 }}>
        Summary of Bonds
      </Typography>
      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f9f9f9" }}>
                  <TableCell sortDirection={orderBy === "bondNumber" ? order : false}>
                    <TableSortLabel
                      active={orderBy === "bondNumber"}
                      direction={orderBy === "bondNumber" ? order : "asc"}
                      onClick={() => handleSort("bondNumber")}
                    >
                      Bond Number
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === "bondAmount" ? order : false}>
                    <TableSortLabel
                      active={orderBy === "bondAmount"}
                      direction={orderBy === "bondAmount" ? order : "asc"}
                      onClick={() => handleSort("bondAmount")}
                    >
                      Bond Amount
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === "principalName" ? order : false}>
                    <TableSortLabel
                      active={orderBy === "principalName"}
                      direction={orderBy === "principalName" ? order : "asc"}
                      onClick={() => handleSort("principalName")}
                    >
                      Principal Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === "ownershipCompany" ? order : false}>
                    <TableSortLabel
                      active={orderBy === "ownershipCompany"}
                      direction={orderBy === "ownershipCompany" ? order : "asc"}
                      onClick={() => handleSort("ownershipCompany")}
                    >
                      Ownership Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === "performanceYear" ? order : false}>
                    <TableSortLabel
                      active={orderBy === "performanceYear"}
                      direction={orderBy === "performanceYear" ? order : "asc"}
                      onClick={() => handleSort("performanceYear")}
                    >
                      Performance Year
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === "bondType" ? order : false}>
                    <TableSortLabel
                      active={orderBy === "bondType"}
                      direction={orderBy === "bondType" ? order : "asc"}
                      onClick={() => handleSort("bondType")}
                    >
                      Bond Type
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === "rate" ? order : false}>
                    <TableSortLabel
                      active={orderBy === "rate"}
                      direction={orderBy === "rate" ? order : "asc"}
                      onClick={() => handleSort("rate")}
                    >
                      Rate
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === "ratePercentage" ? order : false}>
                    <TableSortLabel
                      active={orderBy === "ratePercentage"}
                      direction={orderBy === "ratePercentage" ? order : "asc"}
                      onClick={() => handleSort("ratePercentage")}
                    >
                      Rate Percentage
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {sortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No data available.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.bondNumber}</TableCell>
                      <TableCell>${row.bondAmount.toLocaleString()}</TableCell>
                      <TableCell>{row.principalName}</TableCell>
                      <TableCell>{row.ownershipCompany}</TableCell>
                      <TableCell>{row.performanceYear}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.bondType}
                          sx={{
                            backgroundColor:
                              row.bondType === "KCC"
                                ? "#f5e1fc"
                                : row.bondType === "MSSP"
                                ? "#e1f3fc"
                                : "#ffe0cc",
                            color: "#444",
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.rate}
                          sx={{
                            backgroundColor:
                              row.rate === "Risk Related"
                                ? "#d6fdd6"
                                : row.rate === "N A"
                                ? "#fff7d6"
                                : "#eee",
                            color: "#444",
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell>{row.ratePercentage}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body2" color="textSecondary">
            {sortedData.length} results
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Summary;