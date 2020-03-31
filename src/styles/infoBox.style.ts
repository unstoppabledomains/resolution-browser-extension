import {createStyles, Theme} from '@material-ui/core';

const InfoBoxStyles = ({spacing}: Theme)  => createStyles({
  infoTitle: {
    paddingBottom: spacing(2),
    paddingLeft: spacing(1)
  },
  infoBody: {
    height: "144px",
    marginBottom: spacing(1.5),
  },
  browserBox: {
    display: "flex",
    borderRadius: "6px",
    border: "solid 1px rgba(45, 122, 255, 0.33)",
    padding: spacing(3),
    marginTop: spacing(2)
  },
  browserLogo: {
    width: "80px",
    height: "80px",
    objectFit: "contain",
    marginRight: spacing(3),
  },
  link: {
    color: "#0e4dff",
    textDecoration: "none",
  },
  info: {
    display: "flex",
    flexDirection: "column",
    marginLeft: spacing(2),
    marginBottom: spacing(2),
  },
  infoBox: {
    color: "#080f23",
    backgroundColor: "#e6f6ff",
    alignSelf: "center",
    padding: spacing(1),
  },
});

export default InfoBoxStyles;