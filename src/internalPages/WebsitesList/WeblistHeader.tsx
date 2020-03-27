import React, { useState } from 'react';
import { WithStyles, withStyles, Typography, Button, Paper } from '@material-ui/core';
import { AddCircle } from '@material-ui/icons';
import BookmarksIcon from '@material-ui/icons/Bookmarks';
import styles from '../../styles/weblistHeader.style';

export enum Extension {
	all = '',
	crypto = '.crypto',
	zil = '.zil',
	eth = '.eth'
}

interface Props extends WithStyles<typeof styles> {
	setExtension: React.Dispatch<React.SetStateAction<Extension>>;
	bookMarkClick: React.Dispatch<React.SetStateAction<boolean>>;
}

const WeblistHeader: React.FC<Props> = ({ classes, setExtension,bookMarkClick }) => {
	const [ activeButton, setActiveButton ] = useState(Extension.all);

	const activate = (extension: Extension) => {
		console.log(`choosing ${extension}`);
		setActiveButton(extension);
		setExtension(extension);
	};

	const ifActive = (current: Extension): string => (activeButton === current ? classes.rectangle : '');

	console.log({ setExtension });
	return (
		<div className={classes.main}>
			<div className={classes.header}>
				<Typography className={classes.title} variant="h3">
					Decentralized Websites
				</Typography>
				<a href="https://unstoppabledomains.com" className={classes.link}>
					<Button className={classes.addButton}>
						<AddCircle />&nbsp;Launch your website
					</Button>
				</a>
			</div>
			<Paper className={classes.control}>
				<div className={classes.flex}>
					<div className={ifActive(Extension.all)}>
						<Typography
							variant="subtitle1"
							className={classes.controlText}
							onClick={() => activate(Extension.all)}
						>
							All domains
						</Typography>
					</div>
					<div className={ifActive(Extension.crypto)}>
						<Typography
							variant="subtitle1"
							className={classes.controlText}
							onClick={() => activate(Extension.crypto)}
						>
							.crypto
						</Typography>
					</div>
					<div className={ifActive(Extension.zil)}>
						<Typography
							variant="subtitle1"
							className={classes.controlText}
							onClick={() => activate(Extension.zil)}
						>
							.zil
						</Typography>
					</div>
				</div>
				<div>
					<Button style={{color: "#4c47f7"}} onClick={() => bookMarkClick(true)}>
						<BookmarksIcon />&nbsp;Bookmarks
					</Button>
				</div>
			</Paper>
		</div>
	);
};
export default withStyles(styles)(WeblistHeader);
