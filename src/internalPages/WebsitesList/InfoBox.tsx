import React from 'react';
import { WithStyles, withStyles, Typography } from '@material-ui/core';
import styles from '../../styles/infoBox.style';

interface Props extends WithStyles<typeof styles>{

}
const InfoBox:React.FC<Props> = ({classes}) =>  {
return (
	<div className={classes.info}>
				<div className={classes.infoBox}>
					<Typography variant="h5" className={classes.infoTitle}>
						{' '}
						What is a blockchain domain?{' '}
					</Typography>
					<iframe width="460" height="315" src="https://www.youtube.com/embed/Zm6uZzZwLSg" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"></iframe>
				</div>
				<a href="https://unstoppabledomains.com/browser" className={classes.link}>
					<div className={classes.browserBox}>
						<img src="icon/browser.svg" className={classes.browserLogo} />
						<Typography variant="h4" color="primary">
							Install Unstoppable Browser
						</Typography>
					</div>
				</a>
			</div>
);
}
export default withStyles(styles)(InfoBox);