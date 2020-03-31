import {createStyles, Theme} from '@material-ui/core';

const SomethingWentWrongStyles = ({spacing, palette} : Theme)  => createStyles({
  background: {
    height: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: `#f9faff`
  },
  heading: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    height: '150px',
    padding: spacing(1),
    alignItems: 'center'
  },
  spinner: {
    marginTop: spacing(3),
    color: 'white'
  }
});

export default SomethingWentWrongStyles;