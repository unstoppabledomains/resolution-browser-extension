import React from 'react'
import { Paper, WithStyles, withStyles, Grid, Typography } from '@material-ui/core';
import styles from '../styles/footer.style';

interface Props extends WithStyles<typeof styles>{
}

const Footer:React.FC<Props> = ({classes}) => (
  <div className={classes.main}>
    <Grid container wrap="nowrap" spacing={1}>
      <Grid item>
        <i className="material-icons md-24">folder</i>
      </Grid>
      <Grid item xs zeroMinWidth>
        <Typography variant="subtitle1" className={classes.title}>View list of websites</Typography>
      </Grid>
      <Grid item className={classes.trailing}>
      <i className="material-icons md-24">home</i>
      </Grid>
    </Grid>
  </div>
)

export default withStyles(styles)(Footer);