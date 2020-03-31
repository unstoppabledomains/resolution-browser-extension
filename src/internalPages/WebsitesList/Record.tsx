import React, { useState } from 'react';
import { useAsyncEffect } from 'use-async-effect';
import { withStyles, WithStyles, Typography, Divider } from '@material-ui/core';
import styles from '../../styles/websiteRecords.style';
import BookmarkIcon from '@material-ui/icons/Bookmark';
import BookmarkBorderOutlinedIcon from '@material-ui/icons/BookmarkBorderOutlined';
import { chromeStorageSyncGet, StorageSyncKey, chromeStorageSyncSet } from '../../util/chromeStorageSync';
import Resolution, { ResolutionError, ResolutionErrorCode } from '@unstoppabledomains/resolution';

interface Props extends WithStyles<typeof styles> {
	domain: string;
	setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const Record: React.FC<Props> = ({ classes, domain, setLoading }) => {
	const [ status, update ] = useState(false);

	useAsyncEffect(async () => {
		update(await ifBookmarked(domain));
	}, []);

	const getBookmarks = async (): Promise<string[]> => {
		const bookmarks = await chromeStorageSyncGet(StorageSyncKey.BookmarkedDomains);
		if (bookmarks) return JSON.parse(bookmarks);
		return [];
	};

	const handleBookMarking = async (domain: string) => {
		const bookmarks: string[] = await getBookmarks();
		bookmarks.push(domain);
		await chromeStorageSyncSet(StorageSyncKey.BookmarkedDomains, JSON.stringify(bookmarks));
		update(true);
	};

	const ifBookmarked = async (domain: string): Promise<boolean> => {
		const bookmarks: string[] = await getBookmarks();
		const found = bookmarks.find((bookmark) => domain === bookmark);
		return !!found;
	};

	const handleUnbooomarking = async (domain: string) => {
		const bookmarks = await getBookmarks();
		bookmarks.splice(bookmarks.indexOf(domain, 0), 1);
		await chromeStorageSyncSet(StorageSyncKey.BookmarkedDomains, JSON.stringify(bookmarks));
		update(false);
	};

	const redirect = async (domain: string) => {
		setLoading(true);
		const resolution = new Resolution({
			blockchain: {
				ens: {
					url: 'https://mainnet.infura.io/v3/350101a50e4c4319bcafc44313daf5dc'
				},
				cns: {
					url: 'https://mainnet.infura.io/v3/350101a50e4c4319bcafc44313daf5dc'
				}
			}
		});
		const gatewayBaseURL = new URL(
			(await chromeStorageSyncGet(StorageSyncKey.GatewayBaseURL)) || 'http://gateway.ipfs.io'
		).href;
		try {
			const url = new URL(domain);
			const ipfsHash = await resolution.ipfsHash(url.hostname);
			const displayUrl = `${gatewayBaseURL}ipfs/${ipfsHash}${url.pathname}`;
			chrome.tabs.update({
				url: displayUrl
			});
		} catch (err) {
			let message = err.message;
			if (err instanceof ResolutionError) {
				if (err.code === ResolutionErrorCode.RecordNotFound) message = 'Ipfs page not found';
			}
			chrome.tabs.update({ url: `index.html#error?reason=${message}` });
		}
	};

	return (
		<div>
			<div className={classes.tile}>
				{!status ? (
					<BookmarkBorderOutlinedIcon color="primary" onClick={() => handleBookMarking(domain)} />
				) : (
					<BookmarkIcon style={{ color: '#4c47f7' }} onClick={() => handleUnbooomarking(domain)} />
				)}
				<a className={classes.link} onClick={() => redirect(`https://${domain}`)}>
					<Typography variant="body1">{domain}</Typography>
				</a>
			</div>
			<Divider />
		</div>
	);
};

export default withStyles(styles)(Record);
