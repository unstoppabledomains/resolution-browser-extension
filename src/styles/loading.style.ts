import {createStyles, Theme} from '@material-ui/core';

const Loading = ({spacing, palette} : Theme)  => createStyles({
  background: {
    height: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9faff'
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
    marginTop: spacing(3)
  }
});

export default Loading;