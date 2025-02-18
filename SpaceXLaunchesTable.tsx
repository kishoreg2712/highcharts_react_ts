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
  Skeleton,
  Link,
  Typography,
  Box,
} from "@mui/material";

// Define TypeScript interfaces
interface Rocket {
  id: string;
  name: string;
}

interface Launch {
  flight_number: number;
  name: string;
  date_utc: string;
  success: boolean;
  rocket: string; // Rocket ID (GUID)
  links: {
    patch: {
      small: string | null;
    };
    webcast: string | null;
  };
  failures: {
    reason: string;
  }[];
}

const SpaceXLaunchesTable: React.FC = () => {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [rockets, setRockets] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [orderBy, setOrderBy] = useState<string>("date_utc");

  // Fetch Launch Data
  const fetchLaunches = async (retries: number = 3) => {
    setLoading(true);
    try {
      const apiUrl = "https://api.spacexdata.com/v5/launches";
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      let data: Launch[] = await response.json();
      data = data.sort((a, b) => new Date(b.date_utc).getTime() - new Date(a.date_utc).getTime());
      console.log(data);
      setLaunches(data);

      // Extract unique rocket IDs and fetch rocket names
      const uniqueRocketIds = [...new Set(data.map((launch) => launch.rocket))];
      fetchRocketNames(uniqueRocketIds);
      setError(null);
    } catch (err: unknown) {
      if (retries > 0) {
        fetchLaunches(retries - 1);
      } else {
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch Rocket Names from API
  const fetchRocketNames = async (rocketIds: string[]) => {
    try {
      const rocketData: { [id: string]: string } = {};
      await Promise.all(
        rocketIds.map(async (id) => {
          const response = await fetch(`https://api.spacexdata.com/v4/rockets/${id}`);
          if (response.ok) {
            const rocket: Rocket = await response.json();
            rocketData[id] = rocket.name;
          } else {
            rocketData[id] = "Unknown Rocket"; // Fallback in case of an error
          }
        })
      );
      setRockets(rocketData);
    } catch (err) {
      console.error("Error fetching rocket names:", err);
    }
  };

  useEffect(() => {
    fetchLaunches();
  }, []);

  // Sorting Logic
  const comparator = (a: Launch, b: Launch, orderBy: string) => {
    const isAsc = order === "asc";

    if (orderBy === "date_utc") {
      return isAsc
        ? new Date(a.date_utc).getTime() - new Date(b.date_utc).getTime()
        : new Date(b.date_utc).getTime() - new Date(a.date_utc).getTime();
    } else {
      return isAsc
        ? (a[orderBy as keyof Launch] ?? "").toString().localeCompare((b[orderBy as keyof Launch] ?? "").toString())
        : (b[orderBy as keyof Launch] ?? "").toString().localeCompare((a[orderBy as keyof Launch] ?? "").toString());
    }
  };

  const sortedLaunches = useMemo(() => {
    return [...launches].sort((a, b) => comparator(a, b, orderBy));
  }, [launches, orderBy, order]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      <Paper sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Table Container */}
        <TableContainer sx={{ flexGrow: 1, overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>
          <Table stickyHeader sx={{ minWidth: 750, borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow sx={{ background: "linear-gradient(45deg,rgb(49, 146, 40),rgb(84, 160, 75))" }}>
                {["Mission Name", "Launch Date", "Status", "Rocket", "Webcast", "Mission Patch"].map((header, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      background: "linear-gradient(45deg, #3f51b5, #1a237e)",
                      color: "white",
                      border: "1px solid #ccc",
                      fontWeight: "bold",
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                      "&:hover": { backgroundColor: "#3949ab" }
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedLaunches.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((launch, index) => (
                <TableRow
                  key={launch.flight_number}
                  sx={{
                    border: "1px solid #ccc",
                    backgroundColor: index % 2 === 0 ? "#f5f5f5" : "white",
                    "&:hover": { backgroundColor: "#e3f2fd" }
                  }}
                >
                  <TableCell sx={{ border: "1px solid #ccc" }}>{launch.name}</TableCell>
                  <TableCell sx={{ border: "1px solid #ccc" }}>{new Date(launch.date_utc).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ border: "1px solid #ccc" }}>{launch.success ? "Success" : launch.failures[0]?.reason || "Failed"}</TableCell>
                  <TableCell sx={{ border: "1px solid #ccc" }}>{rockets[launch.rocket] || "Loading..."}</TableCell>
                  <TableCell sx={{ border: "1px solid #ccc" }}>
                    {launch.links.webcast ? (
                      <Link href={launch.links.webcast} target="_blank" sx={{ color: "#0d47a1" }}>Watch</Link>
                    ) : "N/A"}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #ccc" }}>
                    {launch.links.patch.small ? (
                      <img src={launch.links.patch.small} alt="Mission Patch" width="50" />
                    ) : "No Image"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ borderTop: "1px solid #ccc", backgroundColor: "#f5f5f5" }}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={launches.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => setRowsPerPage(parseInt(event.target.value, 10))}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default SpaceXLaunchesTable;