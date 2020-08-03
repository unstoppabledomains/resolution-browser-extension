import React from 'react'
import styles from '../../styles/loading.style'
import {withStyles, WithStyles} from '@material-ui/core/styles'
import CircularProgress from '@material-ui/core/CircularProgress'
import Typography from '@material-ui/core/Typography'

interface Props extends WithStyles<typeof styles> {}

const Loading: React.FC<Props> = ({classes}) => {
  return (
    <div className={classes.background}>
      <Typography variant="h4">Loading</Typography>
      <CircularProgress className={classes.spinner} size={80} />
    </div>
  )
}

export default withStyles(styles)(Loading)
