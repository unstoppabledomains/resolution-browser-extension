import React from 'react'
import { Paper, WithStyles, withStyles, Grid, Typography, Link } from '@material-ui/core';
import styles from '../styles/footer.style';

interface Props extends WithStyles<typeof styles>{
}

const websitesListURL = 'https://ipfs.github.io/public-gateway-checker/';

const Footer:React.FC<Props> = ({classes}) =>  {
  const navigateToList = () => {
    return chrome.tabs.update({url: 'index.html#list'})
  }

  return (
    <div className={classes.main}>
      <Grid container wrap="nowrap" spacing={1}>
        <Grid item>
          <i className="material-icons md-24">folder</i>
        </Grid>
        <Grid item xs zeroMinWidth>
          <Link onClick={navigateToList}><Typography variant="subtitle1" className={classes.title}>
            View list of websites
          </Typography>
          </Link>
        </Grid>
        <Grid item className={classes.trailing}>
        <i className="material-icons md-24">home</i>
        </Grid>
      </Grid>
    </div>
  );
}

export default withStyles(styles)(Footer);