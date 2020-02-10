import React from 'react';
import { Paper, WithStyles, withStyles, Divider } from '@material-ui/core';
import styles from '../styles/root.style';
import Header from './Header';
import Footer from './Footer';
import MainScreen from './MainScreen';

interface Props extends WithStyles<typeof styles>{
}

const Root:React.FC<Props> = ({classes}) => (
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

export default withStyles(styles)(Root);