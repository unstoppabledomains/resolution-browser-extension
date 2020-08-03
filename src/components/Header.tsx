import React from 'react'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Box from '@material-ui/core/Box'
import {WithStyles, withStyles} from '@material-ui/core/styles'
import styles from '../styles/header.style'

interface Props extends WithStyles<typeof styles> {}

const Header: React.FC<Props> = ({classes}) => (
  <div className={classes.main}>
    <Grid container wrap="nowrap" spacing={1}>
      <Grid item>
        <img
          className={classes.logo}
          src="icon/128.png"
          alt="Unstoppable domains logo"
        />
      </Grid>
      <Grid item xs zeroMinWidth>
        <Box fontWeight="fontWeightBold">
          <Typography noWrap variant="subtitle1" className={classes.title1}>
            Your Portal to Decentralised web
          </Typography>
        </Box>
        <Typography noWrap variant="subtitle2" className={classes.title2}>
          This extension opens websites on the blockchain
        </Typography>
      </Grid>
    </Grid>
  </div>
)

export default withStyles(styles)(Header)
