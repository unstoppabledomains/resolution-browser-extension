import React from "react";
import {Paper, CircularProgress, Typography} from "@mui/material";
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
