import {createStyles, Theme} from '@material-ui/core';

const InstallPageStyles = ({spacing, palette} : Theme)  => createStyles({
  background: {
    height: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    background: `radial-gradient(${palette.primary.main}, rgb(150,123,194)) !important`
  },
  heading: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: spacing(1),
    alignItems: 'center'
  },
  howto: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  link: {
    color: 'white'
  }
});

export default InstallPageStyles;