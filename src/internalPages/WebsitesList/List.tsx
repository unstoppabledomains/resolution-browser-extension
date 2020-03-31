import React from 'react';
import styles from '../../styles/list.style';
import Record from './Record';
import { WithStyles, Typography, withStyles, Grid, Paper, Menu, MenuItem } from '@material-ui/core';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import KeyboardArrowDownOutlinedIcon from '@material-ui/icons/KeyboardArrowDownOutlined';
import InfoBox from './InfoBox';

interface Props extends WithStyles<typeof styles> {
	setLetter: React.Dispatch<React.SetStateAction<string>>;
	setPage: React.Dispatch<React.SetStateAction<number>>;
	setPerPage: React.Dispatch<React.SetStateAction<number>>;
	setClickBookmark: React.Dispatch<React.SetStateAction<boolean>>; 
	page: number;
	perPage: number;
	domains: string[];
	letter: string;
	bookmarkClicked: boolean;
}

const List: React.FC<Props> = ({ classes, setLetter, page, setPage, perPage, setPerPage, letter, domains, bookmarkClicked, setClickBookmark }) => {
	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event, value) => {
		setPerPage(value);
    setAnchorEl(null);
  };

	const goBack = (e) => {
		if (page > 1) setPage(page - 1);
	};
	const goForward = (e) => setPage(page + 1);

	const handleLetterClick = (letter: string) => {
		setLetter(letter);
		setClickBookmark(false);
	};

	const renderLetters = () => {
		const letters = [
			'A',
			'B',
			'C',
			'D',
			'E',
			'F',
			'G',
			'H',
			'I',
			'J',
			'K',
			'L',
			'M',
			'N',
			'O',
			'P',
			'Q',
			'R',
			'S',
			'T',
			'U',
			'V',
			'W',
			'X',
			'Y',
			'Z'
		];
		return letters.map((char) => {
			let className = classes.letter;
			if (letter === char) className = className + ' ' + classes.rectangle;
			return (
				<Typography
					key={char}
					variant="body1"
					color="primary"
					className={className}
					onClick={() => handleLetterClick(char)}
				>
						{char}
				</Typography>
			);
		});
	};

	return (
		<div className={classes.main}>
			<Paper className={classes.listBackground}>
				<div className={classes.list}>
					<div className={classes.letters}>{renderLetters()}</div>
					<Typography variant="h5" className={classes.selectedLetter}>
						{bookmarkClicked ? "Bookmarks" : letter.toUpperCase()}
					</Typography>
					<Grid container spacing={2} className={classes.grid}>
						<Grid item md={6} sm={12} xs={12}>
							{domains
								.slice(0, domains.length / 2)
								.map((domain) => <Record key={domain} domain={domain} />)}
						</Grid>
						<Grid item md={6} sm={12} xs={12}>
							{domains
								.slice(domains.length / 2)
								.map((domain) => <Record key={domain} domain={domain} />)}
						</Grid>
					</Grid>
					<div className={classes.status}>
						<div className={classes.statusLeft}>
							<Typography
								className={classes.bold}
								variant="body1"
							>{`Page #${page} | Per page: ${perPage}`}
							</Typography>
							<KeyboardArrowDownOutlinedIcon aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick}/>
							<Menu
								id="simple-menu"
								anchorEl={anchorEl}
								keepMounted
								open={Boolean(anchorEl)}
								onClose={handleClose}
							>
								<MenuItem onClick={(e) => handleClose(e, 10)}>10</MenuItem>
								<MenuItem onClick={(e) => handleClose(e, 20)}>20</MenuItem>
								<MenuItem onClick={(e) => handleClose(e, 30)}>30</MenuItem>
								<MenuItem onClick={(e) => handleClose(e, 40)}>40</MenuItem>
							</Menu>
						</div>
						<div className={classes.statusRight}>
							{ page > 1 ? <ArrowBackIosIcon onClick={goBack} /> : <> </> }
							{ domains.length < perPage ? <></> : <ArrowBackIosIcon onClick={goForward} className={classes.reflected} /> }
						</div>
					</div>
				</div>
			</Paper>
			<InfoBox />
		</div>
	);
};

export default withStyles(styles)(List);
