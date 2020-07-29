import React from 'react'
import {WithStyles, withStyles} from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Divider from '@material-ui/core/Divider'
import styles from '../../styles/extension.style'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import MainScreen from './MainScreen'

interface Props extends WithStyles<typeof styles> {}

const Extension: React.FC<Props> = ({classes}) => (
  <Paper className={classes.root}>
    <div className={classes.topLayout}>
      <div className={classes.middleLayout}>
        <Header />
        <Divider />
        <MainScreen />
      </div>
      <Footer />
    </div>
  </Paper>
)

export default withStyles(styles)(Extension)
