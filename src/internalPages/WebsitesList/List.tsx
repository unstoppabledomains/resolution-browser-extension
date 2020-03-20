import React, { useState, useEffect } from 'react';
import { useAsyncEffect } from 'use-async-effect';
import styles from '../../styles/list.style';
import Record from './Record';
import { WithStyles, Typography, withStyles, Grid, Paper } from '@material-ui/core';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';

const baseurl = 'http://unstoppabledomains.com/api/v1';
// const baseurl = 'http://localhost:8080/api/v1';
interface Props extends WithStyles<typeof styles> {
	setLetter: React.Dispatch<React.SetStateAction<string>>;
}

const List: React.FC<Props> = ({ classes, setLetter }) => {
	const [ domains, setDomains ] = useState<string[]>([]);
	const [ page, setPage ] = useState(1);
	const [ perPage, setPerPage ] = useState(20);
	const [ activeLetter, setActive ] = useState('A');

	useEffect(() => {
		//Todo get last usage prefs from store and change them here
		setPage(1);
		setPerPage(20);
	}, []);

	useAsyncEffect(
		async () => {
			const freshdomains = await fetchDomains(page, perPage);
			setDomains(freshdomains);
		},
		[ page, perPage ]
	);

	const fetchDomains = async (page, perPage) => {
		const url = `${baseurl}/websites/?page=${page}&perPage=${perPage}`;
		try {
			console.log(url);
			const domains: string[] = await fetch(url, { method: 'GET' }).then((res) => res.json());
			if (!domains || !domains[0]) return [];
			return domains;
		} catch (err) {
			console.error(err);
			return [];
		}
	};

	const goBack = (e) => {
		if (page > 1) setPage(page - 1);
	};
	const goForward = (e) => setPage(page + 1);

  const handleLetterClick = (letter: string) => {
    setActive(letter);
    setLetter(letter);
  }

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
		return letters.map((letter) => {
      let className = classes.letter;
      if (activeLetter === letter) className = className + ' ' + classes.rectangle;
			return (
				<Typography key={letter} variant="body1" color="primary" className={className} onClick={() => handleLetterClick(letter)}>
					{letter}
				</Typography>
			);
		});
	};

	return (
		<div className={classes.main}>
			<Paper className={classes.listBackground}>
				<div className={classes.list}>
					<div className={classes.letters}>{renderLetters()}</div>
					<div className={classes.status}>
						<ArrowBackIosIcon onClick={goBack} />
						<Typography variant="body1">{`Page count: ${page}`}</Typography>
						<ArrowBackIosIcon onClick={goForward} className={classes.reflected} />
					</div>
				</div>
			</Paper>

			<div className={classes.info}>
				<div className={classes.infoBox}>
					<Typography variant="h5" className={classes.infoTitle}>
						{' '}
						What is Decentralized Internet{' '}
					</Typography>
					<Typography variant="body1" className={classes.infoBody}>
						Lorem ipsum dolor sit amet consectetur adipisicing elit. Consectetur provident harum dolorum
						voluptatem incidunt omnis delectus necessitatibus! Aliquid inventore voluptatum unde quam. Ipsa,
						molestiae laborum minus suscipit possimus accusantium ratione.
					</Typography>
					<Typography variant="body1" className={classes.link}>
						{' '}
						Learn more
					</Typography>
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
		</div>
	);
};

export default withStyles(styles)(List);
