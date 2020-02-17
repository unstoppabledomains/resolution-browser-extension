import React from 'React';
import {withStyles, WithStyles, Link, Typography} from '@material-ui/core';
import styles from '../../styles/websiteRecords.style';

interface Props extends WithStyles<typeof styles> {
  domain: string
}

const Record: React.FC<Props> = ({classes, domain}) => {  
  return (
    <div className={classes.tile}>
      <a className={classes.link} href={`http://${domain}`}>
        <Typography variant="body1">{domain}</Typography>
      </a>
    </div>
  );
};

export default withStyles(styles)(Record);