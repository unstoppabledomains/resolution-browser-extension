import React from "react";
import {Box, Theme} from "@mui/material";
import {makeStyles} from "@mui/styles";

const useStyles = makeStyles((theme: Theme) => ({
  layoutContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "400px",
    height: "600px",
    padding: "1rem",
    margin: "auto",
    backgroundColor: theme.palette.background.default,
    boxShadow: `0 2px 10px ${theme.palette.primaryShades[900]}`,
  },
}));

const Layout = ({children}) => {
  const classes = useStyles();

  return <Box className={classes.layoutContainer}>{children}</Box>;
};

export default Layout;
