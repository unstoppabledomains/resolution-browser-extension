import {createStyles, Theme} from '@material-ui/core';

const RootStyles = ({spacing, palette} : Theme)  => createStyles({
  main: {
    maxHeight: '48px',
    padding: spacing(1),
    backgroundColor: "#eef9ff",
    color: '#2d64ff',
    fontWeight: 'bold'
  },
  trailing: {
    alignSelf: 'flex-end'
  },
  title: {
    fontWeight: 'bold',
    fontSize: '14px',
  }
});

export default RootStyles;