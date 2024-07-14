import CheckIcon from "@mui/icons-material/Check";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import React from "react";

import FormError from "./FormError";
import {DomainProfileVisibilityValues} from "../../types";
import {Theme} from "@mui/material";
import {makeStyles} from "@mui/styles";

interface ManageInputProps {
  id: string;
  value?: string;
  mt?: number;
  label?: string | JSX.Element;
  placeholder: string;
  error?: boolean;
  errorText?: string;
  disabled?: boolean;
  deprecated?: boolean;
  onChange: (id: string, value: string) => void;
  onKeyDown?: React.KeyboardEventHandler;
  // if true, the input will allow adding multiple lines of text. Else, one line
  // only.  Defaults to false.
  multiline?: boolean;
  helperText?: string;
  labelIcon?: React.ReactNode;
  disableTextTrimming?: boolean;
  // if true, the label and input will be stacked. else, the label will be to the left of the input
  stacked?: boolean;
  // number of rows to display when the `multiline` prop is set to true.
  rows?: number;
  // maximum number of characters allowed in the input element
  maxLength?: number;
  endAdornment?: React.ReactNode;
  startAdornment?: React.ReactNode;
  classes?: {
    root?: string;
    input?: string;
    adornedStart?: string;
    adornedEnd?: string;
  };
  publicVisibilityValues?: object;
  isCardOpen?: {
    cardOpen: boolean;
    id: string | null;
  };
  type?: string;
  setPublicVisibilityValues?: React.Dispatch<
    React.SetStateAction<DomainProfileVisibilityValues>
  > | null;
  setIsCardOpen?: React.Dispatch<
    React.SetStateAction<{
      cardOpen: boolean;
      id: string | null;
    }>
  >;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const useStyles = makeStyles((theme: Theme) => ({
  // Input
  formMargin: {
    "&:first-of-type": {
      marginTop: "0px !important",
    },
  },
  formLabel: {
    fontSize: "1.125rem",
    pointerEvents: "auto", // to make the Tooltip component work inside the InputLabel
    color: "gray",
    fontWeight: theme.typography.fontWeightMedium,
  },
  labelIcon: {
    display: "flex",
    marginRight: theme.spacing(1.5),
  },
  formControlInputLabel: {
    width: "inherit",
    maxWidth: "inherit",
    transform: "initial",
    fontSize: theme.typography.body1.fontSize,
    position: "relative",
    [theme.breakpoints.down("sm")]: {
      width: "auto",
    },
    "& span": {
      minWidth: "auto",
    },
    [`${theme.breakpoints.down("md")} and (orientation: landscape)`]: {
      width: "inherit",
      minWidth: "74px",
      position: "initial",
    },
  },
  error: {borderRadius: theme.shape.borderRadius, border: "1px solid red"},
  inputRoot: {
    width: "100%",
    padding: 0,
    "label + &": {
      marginTop: theme.spacing(3),
    },
  },
  multiChainInputRoot: {
    marginTop: theme.spacing(1),
    "label + &": {
      marginTop: theme.spacing(3),
    },
    border: "1px solid #ced4da",
    "&:focus": {
      borderRadius: theme.shape.borderRadius,
      borderColor: "#80bdff",
    },
    width: "100%",
    borderRadius: theme.shape.borderRadius,
    // [`&.${classes.error}`]: {
    //   borderRadius: theme.shape.borderRadius,
    //   borderColor: "red",
    // },
    "& input": {
      borderRadius: theme.shape.borderRadius,
      position: "relative",
      backgroundColor: theme.palette.common.white,
      fontSize: 16,
      width: "100%",
      padding: theme.spacing(1, 1.5),
      transition: theme.transitions.create("border-color"),
      height: "24px",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      display: "none",
    },
  },
  input: {
    position: "relative",
    backgroundColor: theme.palette.common.white,
    width: "100%",
    transition: theme.transitions.create("border-color"),
    height: 24,
    padding: theme.spacing(1.25, 1.5),
  },
  labelAndIconDiv: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      height: 42,
    },
    [`${theme.breakpoints.down("md")} and (orientation: landscape)`]: {
      width: "100%",
    },
  },
  labelGridItem: {
    marginBottom: theme.spacing(1),
    [theme.breakpoints.up("sm")]: {
      marginBottom: 0,
    },
  },
  versionTag: {
    minWidth: "3em",
  },
  formErrorContainer: {
    marginTop: theme.spacing(1),
  },
  // Loading
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "42vh",
    marginBottom: theme.spacing(28),
  },
  loadingText: {
    textAlign: "center",
    fontWeight: 600,
    marginBottom: theme.spacing(3),
  },
  publicIcon: {
    fill: theme.palette.primary.main,
  },
  privateIcon: {
    fill: "gray",
  },
  card: {
    zIndex: 2,
    position: "absolute",
    top: "2em",
    width: "329px",
    right: "2em",
    textAlign: "left",
    padding: "20px",
    paddingBottom: "10px",
    boxShadow:
      "0px 0px 4px rgba(0, 0, 0, 0.08), 0px 8px 48px rgba(0, 0, 0, 0.08)",
    [theme.breakpoints.down("sm")]: {
      right: "0em",
    },
  },
  cardBtnContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    whiteSpace: "normal",
    left: "",
    padding: "0px",
    marginTop: "10px",
    position: "relative",
    [theme.breakpoints.down("sm")]: {
      left: "0px",
    },
  },
  cardModalButtons: {
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  visibleBtn: {
    marginLeft: "0px !important",
  },
  cardTitle: {
    fontSize: "16px",
    color: "#000000",
    fontWeight: 700,
    marginBottom: "0px",
  },
  checkIcon: {
    color: theme.palette.primary.main,
  },
  cardCaption: {
    fontSize: "16px",
    fontWeight: 600,
    marginLeft: "6px",
  },
  iconButton: {
    color: "#000000",
  },
  iconButtonBig: {
    color: "#000000",
    borderRadius: 5,
    width: "100%",
    justifyContent: "left",
  },
  verifiedIcon: {
    color: "#0DA767",
    fontSize: "16px",
    marginRight: "12px",
    [theme.breakpoints.down("sm")]: {
      marginLeft: "5px",
    },
  },
}));

const ManageInput: React.FC<ManageInputProps> = ({
  id,
  value,
  label,
  placeholder,
  error,
  mt,
  errorText,
  disabled = false,
  deprecated = false,
  onChange,
  onKeyDown,
  multiline = false,
  helperText,
  labelIcon = null,
  disableTextTrimming = false,
  stacked = true,
  maxLength,
  rows,
  inputRef,
  type = "text",
  startAdornment = null,
  endAdornment = null,
  classes: classesOverride,
  publicVisibilityValues,
  setPublicVisibilityValues,
  isCardOpen,
  setIsCardOpen,
}) => {
  const classes = useStyles();
  const handleChange = ({target}: React.ChangeEvent<HTMLInputElement>) => {
    onChange(
      target.id,
      disableTextTrimming ? target.value : target.value.trim(),
    );
  };

  const handleAdornmentClick = (e: {stopPropagation: () => void}) => {
    // Toggles visibility of the modal
    e.stopPropagation();
    setIsCardOpen!((prev) => {
      if (prev?.cardOpen) {
        return {
          id,
          cardOpen: false,
        };
      } else {
        return {
          id,
          cardOpen: true,
        };
      }
    });
  };

  const togglePublicVisibility = (e: {stopPropagation: () => void}) => {
    e.stopPropagation();
    if (setPublicVisibilityValues) {
      setPublicVisibilityValues((prev) => {
        return {...prev, [id + "Public"]: prev && !prev[id + "Public"]};
      });
    }
  };

  function BasicCard() {
    return isCardOpen && isCardOpen.id === id && isCardOpen.cardOpen ? (
      <Card sx={{minWidth: 275}} className={classes.card}>
        <Typography color="text.secondary" className={classes.cardTitle}>
          Who can view your data?
        </Typography>

        <Typography
          sx={{fontSize: "14px"}}
          color="text.secondary"
          style={{whiteSpace: "normal"}}
        >
          You can control the access people have in viewing your data.
        </Typography>
        <CardActions className={classes.cardBtnContainer}>
          <div
            className={classes.cardModalButtons}
            onClick={togglePublicVisibility}
            data-testid="inlineTogglePrivate"
          >
            <IconButton
              aria-label="toggle public visibility"
              className={classes.iconButtonBig}
            >
              {publicVisibilityValues &&
              publicVisibilityValues[id + "Public"] === false ? (
                <CheckIcon className={classes.checkIcon} />
              ) : (
                <VisibilityOffOutlinedIcon />
              )}
              <Typography className={classes.cardCaption}>
                Only you and allowed dApps
              </Typography>
            </IconButton>
          </div>
          <div
            className={`${classes.cardModalButtons} ${classes.visibleBtn}`}
            onClick={togglePublicVisibility}
            data-testid="inlineTogglePublic"
          >
            <IconButton
              aria-label="toggle public visibility"
              className={classes.iconButtonBig}
            >
              {publicVisibilityValues &&
              publicVisibilityValues[id + "Public"] === false ? (
                <PublicOutlinedIcon />
              ) : (
                <CheckIcon className={classes.checkIcon} />
              )}
              <Typography className={classes.cardCaption}>
                Visible to everyone
              </Typography>
            </IconButton>
          </div>
        </CardActions>
      </Card>
    ) : null;
  }

  return (
    <Box mt={mt} width="100%" className={classes.formMargin}>
      <FormControl className={classes.formMargin} fullWidth>
        <Grid container>
          <Grid
            item
            className={classes.labelGridItem}
            xs={12}
            sm={stacked ? 12 : 3}
          >
            {label && (
              <div className={classes.labelAndIconDiv}>
                {labelIcon && (
                  <div className={classes.labelIcon}>{labelIcon}</div>
                )}
                <InputLabel
                  focused={false}
                  htmlFor={id}
                  className={`${classes.formLabel} ${classes.formControlInputLabel}`}
                >
                  {label}
                </InputLabel>
              </div>
            )}
          </Grid>
          <Grid item xs={12} sm={stacked ? 12 : 9}>
            <OutlinedInput
              id={id}
              disabled={disabled || deprecated}
              error={error}
              minRows={rows}
              maxRows={rows}
              inputRef={inputRef}
              value={value || ""}
              type={type}
              inputProps={{
                "data-testid": `input-${id}`,
                className: !endAdornment && error ? classes.error : "",
                maxLength,
              }}
              multiline={multiline}
              placeholder={placeholder}
              onChange={handleChange}
              onKeyDown={onKeyDown}
              classes={{
                root: `${classes.inputRoot} ${classesOverride?.root}`,
                input: `${classes.input} ${classesOverride?.input}`,
                adornedStart: classesOverride?.adornedStart,
                adornedEnd: classesOverride?.adornedEnd,
              }}
              startAdornment={startAdornment}
              endAdornment={
                endAdornment
                  ? endAdornment
                  : setPublicVisibilityValues && (
                      <InputAdornment
                        position="end"
                        style={{paddingRight: "15px", position: "relative"}}
                      >
                        {publicVisibilityValues &&
                        publicVisibilityValues[id + "Public"] ? (
                          <Tooltip title={"This data is public"}>
                            <PublicOutlinedIcon
                              className={classes.publicIcon}
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip title={"This data is private"}>
                            <VisibilityOffOutlinedIcon
                              className={classes.privateIcon}
                            />
                          </Tooltip>
                        )}
                        <IconButton
                          data-testid="inlineToggle"
                          aria-label="toggle public visibility"
                          onClick={handleAdornmentClick}
                          edge="end"
                        >
                          <ExpandMoreOutlinedIcon />
                        </IconButton>
                        <BasicCard></BasicCard>
                      </InputAdornment>
                    )
              }
            />
            {helperText && <FormHelperText>{helperText}</FormHelperText>}
            {(deprecated || (error && errorText)) && (
              <div className={classes.formErrorContainer}>
                <FormError
                  message={deprecated ? "Legacy Token" : errorText ?? ""}
                />
              </div>
            )}
          </Grid>
        </Grid>
      </FormControl>
    </Box>
  );
};

export default ManageInput;
