import React, { useState, useEffect } from 'react';
import { WithStyles, withStyles } from '@material-ui/core';
import styles from '../../styles/websiteList.style';
import WeblistHeader, { Extension } from './WeblistHeader';
import List from './List';

interface Props extends WithStyles<typeof styles> {}

const WebsiteList: React.FC<Props> = ({ classes }) => {
	const [ extension, setExtension ] = useState<Extension>(Extension.all);
	const [ letter, setLetter ] = useState('A');
  console.log('test', Extension.all);

  useEffect(() => {
    console.log({extension});
  }, [extension]);


	return (
		<div className={classes.background}>
			<div className={classes.main}>
				<WeblistHeader setExtension={setExtension} />
        <div className={classes.body}>
          <List setLetter={setLetter}/>
        </div>
			</div>
		</div>
	);
};
export default withStyles(styles)(WebsiteList);
