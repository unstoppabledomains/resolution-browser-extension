import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import type {Theme} from "@mui/material/styles";
import {makeStyles} from "@mui/styles";
import React from "react";

const AVATAR_SIZE = 100;
const AVATAR_RESULT_SIZE = AVATAR_SIZE + 24;

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrapper: {
    position: "relative",
    backgroundColor: "gray",
    borderRadius: "50%",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      background: "rgba(0, 0, 0, 0.16)",
      opacity: 0,
      transition: theme.transitions.create("opacity"),
    },
  },
  imagePlaceholderWrapper: {
    minWidth: AVATAR_SIZE,
    maxWidth: AVATAR_SIZE,
    height: AVATAR_SIZE,
    overflow: "hidden",
  },
  pendingIcon: {
    "& > svg": {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      padding: theme.spacing(3),
      fill: "gray",
    },
  },
  successIcon: {
    backgroundColor: theme.palette.success.main,
    "& > svg": {
      width: AVATAR_RESULT_SIZE,
      height: AVATAR_RESULT_SIZE,
      fill: theme.palette.common.white,
      padding: theme.spacing(3),
    },
  },
  errorIcon: {
    backgroundColor: theme.palette.common.white,
    "& > svg": {
      width: AVATAR_RESULT_SIZE,
      height: AVATAR_RESULT_SIZE,
      fill: theme.palette.error.main,
    },
  },
  pendingLabel: {
    color: "gray",
  },
  successLabel: {
    color: theme.palette.common.black,
  },
  errorLabel: {
    color: theme.palette.common.black,
  },
  pictureContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  round: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: "50%",
    backgroundColor: "white",
    zIndex: 1,
    [theme.breakpoints.up("sm")]: {
      flex: "1 0 auto",
    },
  },
  progressSpinner: {
    position: "absolute",
    zIndex: 1,
  },
}));

type Props = {
  icon?: JSX.Element;
  label?: string;
  success?: boolean;
  error?: boolean;
  children?: React.ReactNode;
};

export const OperationStatus: React.FC<Props> = ({
  icon,
  label,
  success,
  error,
  children,
}) => {
  const classes = useStyles();

  return (
    <Box className={classes.container}>
      <Box className={classes.pictureContainer}>
        <Box
          className={`${classes.round} ${classes.imageWrapper} ${classes.imagePlaceholderWrapper}`}
        >
          <Box
            className={
              success
                ? classes.successIcon
                : error
                  ? classes.errorIcon
                  : classes.pendingIcon
            }
          >
            {success ? (
              <CheckOutlinedIcon />
            ) : error ? (
              <ErrorOutlinedIcon />
            ) : (
              icon
            )}
          </Box>
          {!success && !error && (
            <CircularProgress
              size={AVATAR_SIZE}
              className={classes.progressSpinner}
              thickness={1.5}
            />
          )}
        </Box>
      </Box>
      <Typography
        mt={2}
        variant="h6"
        className={
          success
            ? classes.successLabel
            : error
              ? classes.errorLabel
              : classes.pendingLabel
        }
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
};
