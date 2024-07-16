import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type {Theme} from "@mui/material/styles";
import {makeStyles} from "@mui/styles";
import React from "react";

export const useStyles = makeStyles((theme: Theme) => ({
  formError: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    fontSize: "0.8125rem",
    fontWeight: theme.typography.fontWeightMedium,
    lineHeight: 1,
    color: "red",
    "&:not(:last-child)": {
      marginBottom: theme.spacing(1),
    },
  },
  formWarning: {
    color: "yellow",
  },
  formErrorIcon: {
    display: "flex",
    width: 15,
    height: 15,
    marginRight: theme.spacing(1),
    "& svg": {
      width: "inherit",
      height: "inherit",
    },
  },
}));

type Props = {
  message: string | JSX.Element;
  severity?: "error" | "warning";
  className?: string;
};

const FormError: React.FC<Props> = ({message, className, severity}) => {
  const classes = useStyles();

  const combinedClassName = `${classes.formError} ${className} ${
    severity === "warning" ? classes.formWarning : ""
  }`;

  return (
    <div className={combinedClassName}>
      <div className={classes.formErrorIcon}>
        {severity === "warning" ? <WarningAmberIcon /> : <ErrorOutlineIcon />}
      </div>
      {message}
    </div>
  );
};

export default FormError;
