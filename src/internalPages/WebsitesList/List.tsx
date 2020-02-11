import React from 'react';
import styles from '../../styles/list.style';
import { WithStyles, Typography, withStyles } from '@material-ui/core';

interface Props extends WithStyles {

}


const List: React.FC<Props> = ({classes}) => {
  return <> <Typography>Future List Somewhere here!</Typography></>
}

export default withStyles(styles)(List);