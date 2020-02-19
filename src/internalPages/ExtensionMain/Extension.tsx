import React from 'react';
import { Paper, WithStyles, withStyles, Divider } from '@material-ui/core';
import styles from '../../styles/extension.style';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MainScreen from './MainScreen';

interface Props extends WithStyles<typeof styles>{
}

const Extension:React.FC<Props> = ({classes}) => (
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

export default withStyles(styles)(Extension);