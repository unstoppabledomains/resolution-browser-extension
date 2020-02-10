import React from 'react'
import { Paper, WithStyles, withStyles, Grid, Typography, Avatar, Box } from '@material-ui/core';
import styles from '../styles/header.style';

interface Props extends WithStyles<typeof styles>{
}

const Header:React.FC<Props> = ({classes}) => (
  <div className={classes.main}>
        <Grid container wrap="nowrap" spacing={1}>
          <Grid item>
            <Avatar className={classes.logo}><img src="icon/48.png" alt="Unstoppable domains logo" /></Avatar>
          </Grid>
          <Grid item xs zeroMinWidth>
            <Box fontWeight="fontWeightBold">
              <Typography noWrap variant="subtitle1" className={classes.title1}>Your Portal to Decentralised web</Typography>
            </Box>
            <Typography noWrap variant="subtitle2" className={classes.title2}>This extension opens websites on the blockchain</Typography>
          </Grid>
        </Grid>
  </div>
)

export default withStyles(styles)(Header);