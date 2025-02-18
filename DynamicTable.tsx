import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TableSortLabel,
  Link,
  Box,
  CircularProgress,
  Typography,
  TextField,  // ✅ Import TextField for search input
} from "@mui/material";

interface ColumnConfig {
  id: string;
  label: string;
  isLink?: boolean;
  isImage?: boolean;
  format?: (value: any) => string;
}

interface DynamicTableProps {
  apiUrl: string;
  columns: ColumnConfig[];
  idField: string;
}

const DynamicTable: React.FC<DynamicTableProps> = ({ apiUrl, columns, idField }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [orderBy, setOrderBy] = useState<string>(columns?.[0]?.id || "");
  const [searchTerm, setSearchTerm] = useState<string>("");  // ✅ Search state

  useEffect(() => {
    if (!apiUrl) {
      setError("⚠️ API URL is missing. Please provide a valid API endpoint.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        let jsonData;
        try {
          jsonData = await response.json();
        } catch (jsonError) {
          throw new Error("Invalid JSON response from API.");
        }

        let extractedData = jsonData;
        if (typeof jsonData === "object" && !Array.isArray(jsonData)) {
          const possibleArrayKeys = Object.keys(jsonData).filter(
            (key) => Array.isArray(jsonData[key])
          );
          if (possibleArrayKeys.length > 0) {
            extractedData = jsonData[possibleArrayKeys[0]];
          }
        }

        if (!Array.isArray(extractedData)) {
          throw new Error("API returned invalid data format. Expected an array.");
        }

        setData(extractedData);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiUrl]);

  const comparator = (a: any, b: any) => {
    const isAsc = order === "asc";
    return isAsc
      ? (a[orderBy] ?? "").toString().localeCompare((b[orderBy] ?? "").toString())
      : (b[orderBy] ?? "").toString().localeCompare((a[orderBy] ?? "").toString());
  };

  // ✅ Filter data based on search term
  const filteredData = useMemo(() => {
    return data.filter((row) =>
      columns.some((column) =>
        row[column.id]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm, columns]);

  const sortedData = useMemo(() => [...filteredData].sort(comparator), [filteredData, order, orderBy]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      <Paper sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "16px" }}>
        
        {/* ✅ Search Input */}
        <TextField
          label="Search..."
          variant="outlined"
          size="small"
          fullWidth
          sx={{ marginBottom: 2 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ textAlign: "center", padding: 2 }}>
            {error}
          </Typography>
        ) : columns.length === 0 ? (
          <Typography color="textSecondary" sx={{ textAlign: "center", padding: 4 }}>
            ⚠️ No columns available. Please configure columns to display data.
          </Typography>
        ) : (
          <>
            <TableContainer sx={{ flexGrow: 1, overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>
              <Table stickyHeader sx={{ minWidth: 750, borderCollapse: "collapse" }}>
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        sx={{
                          backgroundColor: "#1976d2", // Blue header
                          color: "white",
                          fontWeight: "bold",
                          textAlign: "left",
                          borderBottom: "2px solid white",
                          borderRight: "1px solid white",
                          padding: "12px",
                        }}
                      >
                        <TableSortLabel
                          active={orderBy === column.id}
                          direction={orderBy === column.id ? order : "asc"}
                          onClick={() => setOrderBy(column.id)}
                          sx={{ color: "white", "&.MuiTableSortLabel-root:hover": { color: "#BBDEFB" } }}
                        >
                          {column.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, rowIndex) => (
                    <TableRow
                      key={row[idField]}
                      sx={{
                        backgroundColor: rowIndex % 2 === 0 ? "#f9f9f9" : "white",
                        "&:hover": { backgroundColor: "#E3F2FD" },
                      }}
                    >
                      {columns.map((column, colIndex) => (
                        <TableCell
                          key={column.id}
                          sx={{
                            borderBottom: "1px solid #BDBDBD",
                            borderRight: colIndex !== columns.length - 1 ? "1px solid #BDBDBD" : "none",
                            padding: "12px",
                            fontWeight: column.id.toLowerCase() === "id" ? "bold" : "normal",
                            color: column.id.toLowerCase() === "id" ? "#333" : "inherit",
                          }}
                        >
                          {column.isImage ? (
                            row[column.id] ? <img src={row[column.id]} alt={column.label} width="50" /> : "No Image"
                          ) : column.isLink ? (
                            <Link href={row[column.id]} target="_blank">{row[column.id] || "N/A"}</Link>
                          ) : column.format ? (
                            column.format(row[column.id])
                          ) : (
                            row[column.id] ?? "N/A"
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* ✅ Right-Aligned Pagination */}
            <Box sx={{ borderTop: "1px solid #ccc", backgroundColor: "#f5f5f5", display: "flex", justifyContent: "flex-end" }}>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                count={filteredData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => setRowsPerPage(parseInt(event.target.value, 10))}
              />
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default DynamicTable;