import {createStyles, Theme} from '@material-ui/core';

const WebsiteRecords = ({spacing, palette} : Theme)  => createStyles({
  tile: {
    padding: spacing(1),
    display: "flex",
  },
  link: {
    color: '#0e4dff',
    textDecoration: "none",
    cursor: "pointer"
  }
});

export default WebsiteRecords;