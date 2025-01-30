import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TablePagination,
  TableSortLabel,
} from "@mui/material";

// Define TypeScript interface for Launch data
interface Launch {
  flight_number: number;
  mission_name: string;
  launch_year: string;
  rocket: {
    rocket_name: string;
  };
  links: {
    mission_patch: string | null;
  };
}

const SpaceXLaunchesTable: React.FC = () => {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [orderBy, setOrderBy] = useState<string>("mission_name");

  // Fetch Data on Component Mount with Retry Logic
  const fetchData = async (retries: number = 3) => {
    try {
      const apiUrl = "https://api.spacexdata.com/v3/launches?order=desc&limit=200";
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data: Launch[] = await response.json();
      setLaunches(data);
    } catch (err: unknown) {
      if (retries > 0) {
        fetchData(retries - 1); // Retry fetch
      } else {
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Loading State
  if (loading)
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", width: "100%" }}>
        <CircularProgress />
      </div>
    );

  // Handle Error State
  if (error)
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", width: "100%" }}>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );

  // Sorting Logic
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedLaunches = [...launches].sort((a, b) => {
    if (orderBy === "launch_year") {
      return order === "asc"
        ? parseInt(a.launch_year) - parseInt(b.launch_year)
        : parseInt(b.launch_year) - parseInt(a.launch_year);
    } else {
      return order === "asc"
        ? a.mission_name.localeCompare(b.mission_name)
        : b.mission_name.localeCompare(a.mission_name);
    }
  });

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
      <TableContainer
        component={Paper}
        sx={{
          flex: 1,
          width: "100%",
          maxHeight: "70vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Table stickyHeader sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel active={orderBy === "mission_name"} direction={orderBy === "mission_name" ? order : "asc"} onClick={() => handleRequestSort("mission_name")}>
                  Mission Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={orderBy === "launch_year"} direction={orderBy === "launch_year" ? order : "asc"} onClick={() => handleRequestSort("launch_year")}>
                  Launch Year
                </TableSortLabel>
              </TableCell>
              <TableCell>Rocket Name</TableCell>
              <TableCell>Mission Patch</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedLaunches
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((launch) => (
                <TableRow key={launch.flight_number}>
                  <TableCell>{launch.mission_name}</TableCell>
                  <TableCell>{launch.launch_year}</TableCell>
                  <TableCell>{launch.rocket.rocket_name}</TableCell>
                  <TableCell>
                    {launch.links.mission_patch ? (
                      <img src={launch.links.mission_patch} alt={`Mission patch for ${launch.mission_name}`} width="50" />
                    ) : (
                      <span style={{ color: "gray" }}>No Image</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={launches.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default SpaceXLaunchesTable;