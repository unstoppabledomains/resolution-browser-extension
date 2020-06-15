import React from 'react';
import { withRouter } from 'react-router-dom';
import {withStyles, WithStyles, Typography} from '@material-ui/core';
import styles from '../../styles/somethingwentwrong.style';
import queryString from 'querystring';

interface Props extends WithStyles<typeof styles> {
  location?: {
    search?: string
  }
}

const SomethingWentWrong:React.FC<Props> = ({classes, ...props}) => {
  const query = queryString.parse(props.location.search.replace(/^\?/, ''));
  return (
    <div className={classes.background}>
      {query.reason != null ? <Typography variant="body1">{query.reason}</Typography> : <> </>}
    </div>
  );
}

export default withRouter(withStyles(styles)(SomethingWentWrong));
