import {createStyles, Theme} from "@material-ui/core";

const WebsiteListStyles = ({spacing}: Theme)  => createStyles({
  main: {
    padding: spacing(5, 15, 0, 15),
  },
  background: {
    backgroundColor: "#f9faff",
    height: "100vh",
  },
  body: {
    marginTop: spacing(2),
    display: "flex",
    flexDirection: "column",
    color: "#0e4dff",
    justifyContent: "space-between",
  }
});

export default WebsiteListStyles;