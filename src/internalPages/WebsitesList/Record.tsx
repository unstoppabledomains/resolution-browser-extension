import React, {useState} from 'react'
import {useAsyncEffect} from 'use-async-effect'
import {withStyles, WithStyles} from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Divider from '@material-ui/core/Divider'
import styles from '../../styles/websiteRecords.style'
import BookmarkIcon from '@material-ui/icons/Bookmark'
import BookmarkBorderOutlinedIcon from '@material-ui/icons/BookmarkBorderOutlined'
import {
  StorageSyncKey,
  chromeStorageSyncSet,
  chromeStorageSyncGet,
} from '../../util/chromeStorageSync'

interface Props extends WithStyles<typeof styles> {
  domain: string
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>
}

const Record: React.FC<Props> = ({classes, domain, setLoading}) => {
  const [status, update] = useState(false)

  useAsyncEffect(async () => {
    update(await ifBookmarked(domain))
  }, [])

  const getBookmarks = async (): Promise<string[]> => {
    const bookmarks = await chromeStorageSyncGet(
      StorageSyncKey.BookmarkedDomains,
    )
    if (bookmarks) return JSON.parse(bookmarks)
    return []
  }

  const handleBookMarking = async (domain: string) => {
    const bookmarks: string[] = await getBookmarks()
    bookmarks.push(domain)
    await chromeStorageSyncSet(
      StorageSyncKey.BookmarkedDomains,
      JSON.stringify(bookmarks),
    )
    update(true)
  }

  const ifBookmarked = async (domain: string): Promise<boolean> => {
    const bookmarks: string[] = await getBookmarks()
    const found = bookmarks.find(bookmark => domain === bookmark)
    return !!found
  }

  const handleUnbooomarking = async (domain: string) => {
    const bookmarks = await getBookmarks()
    bookmarks.splice(bookmarks.indexOf(domain, 0), 1)
    await chromeStorageSyncSet(
      StorageSyncKey.BookmarkedDomains,
      JSON.stringify(bookmarks),
    )
    update(false)
  }

  return (
    <div>
      <div className={classes.tile}>
        {!status ? (
          <BookmarkBorderOutlinedIcon
            color="primary"
            onClick={() => handleBookMarking(domain)}
          />
        ) : (
          <BookmarkIcon
            style={{color: '#4c47f7'}}
            onClick={() => handleUnbooomarking(domain)}
          />
        )}
        <a
          className={classes.link}
        >
          <Typography variant="body1">{domain}</Typography>
        </a>
      </div>
      <Divider />
    </div>
  )
}

export default withStyles(styles)(Record)
