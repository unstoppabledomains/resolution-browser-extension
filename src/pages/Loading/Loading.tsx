import React from "react";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import {useExtensionStyles} from "../../styles/extension.styles";

const styles = {
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
  const {classes} = useExtensionStyles();
  return (
    <Paper className={classes.container}>
      <Typography variant="h4">Loading</Typography>
      <CircularProgress sx={styles.spinner} size={80} />
    </Paper>
  );
};

export default Loading;
