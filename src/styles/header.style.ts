import {createStyles, Theme} from '@material-ui/core';

const RootStyles = ({spacing, palette} : Theme)  => createStyles({
  main: {
    padding: spacing(2)
  },
  logo: {
    height: '48px',
    width: '48px',
    borderRadius: spacing(1),
    objectFit: 'contain'
  },
  title1: {
    fontSize: '18px',
    fontWeight: "bold"
  },
  title2: {
    fontSize: '13px',
    color: '#939799',
  }
});

export default RootStyles;