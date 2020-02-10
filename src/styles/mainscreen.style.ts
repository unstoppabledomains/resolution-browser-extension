import {createStyles, Theme} from '@material-ui/core';

const RootStyles = ({spacing, palette} : Theme)  => createStyles({
  main: {
    padding: spacing(2),
    height: '100%'
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  title: {
    fontWeight: 'bold',
    fontSize: '18px',
  },
  subtitle: {
    fontSize: '14px',
    fontWeight: 600
  },
  formControl: {
    margin: spacing(0),
    padding: spacing(0),
    height: '48px',
    maxHeight: '48px'
  },
  selectEmpty: {
    marginTop: spacing(0),
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  input: {
    marginTop: spacing(3),
  },
  inputField: {
    width: '100%'
  },
  spacer: {
    display: 'flex',
    width: '100%',
    minHeight: '100%'
  },
  gatewayMessage: {
    marginTop: spacing(1),
    color: '#939799',
    
  }

});

export default RootStyles;