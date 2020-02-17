import React, {useState, useEffect} from 'react';
import {useAsyncEffect} from 'use-async-effect';
import styles from '../../styles/list.style';
import Record from './Record';
import { WithStyles, Typography, withStyles, Grid } from '@material-ui/core';

interface Props extends WithStyles<typeof styles> {

}

enum ListOptions {
  crypto = "crypto",
  zil = "zil"
}

const List: React.FC<Props> = ({classes}) => {
  const [domains, setDomains] = useState<string[]>([]);
  const [option, setOption] = useState<keyof typeof ListOptions>("crypto");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  useAsyncEffect(async () => {
    const url = `https://unstoppabledomains.com/api/v1/websites/${option}?page=${page}&perPage=${perPage}`;
    const domains: string[] = await fetch(url, {method: 'GET'}).then(res => res.json());
    console.log({url, domains});
    setDomains([...domains]);
  }, []);


  return (
    <div className={classes.background}>
      <div className={classes.heading}>
        <Typography variant="h3">Websites Navigation Book</Typography>
        <Typography variant="overline">There are {domains.length} records</Typography>
      </div>
      <Grid container spacing={2} className={classes.grid}>
        {
          domains.map(domain => <Grid item><Record domain={domain} key={domain}/></Grid>)
        }
      </Grid>
    </div>
  );
}

export default withStyles(styles)(List);