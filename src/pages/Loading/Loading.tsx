import React from "react";
import {Box, CircularProgress, Typography} from "@mui/material";

const styles = {
  background: {
    height: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9faff",
  },
  heading: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    height: "150px",
    padding: 1,
    alignItems: "center",
  },
  spinner: {
    marginTop: 3,
  },
};

interface Props {}

const Loading: React.FC<Props> = () => {
  return (
    <Box sx={styles.background}>
      <Typography variant="h4">Loading</Typography>
      <CircularProgress sx={styles.spinner} size={80} />
    </Box>
  );
};

export default Loading;
