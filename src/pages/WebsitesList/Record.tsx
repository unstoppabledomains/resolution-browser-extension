import React, {useState} from "react";
import {useAsyncEffect} from "use-async-effect";

import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import {
  StorageSyncKey,
  chromeStorageSet,
  chromeStorageGet,
} from "../../lib/chromeStorage";
import {Box, Divider, Typography} from "@mui/material";

const styles = {
  tile: {
    padding: "4px",
    display: "flex",
  },
  link: {
    color: "#0e4dff",
    textDecoration: "none",
    cursor: "pointer",
  },
};

interface Props {
  domain: string;
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
}

const Record: React.FC<Props> = ({domain, setLoading}) => {
  const [status, update] = useState(false);

  useAsyncEffect(async () => {
    update(await ifBookmarked(domain));
  }, []);

  const getBookmarks = async (): Promise<string[]> => {
    const bookmarks = await chromeStorageGet(StorageSyncKey.BookmarkedDomains);
    if (bookmarks) return JSON.parse(bookmarks);
    return [];
  };

  const handleBookMarking = async (domain: string) => {
    const bookmarks: string[] = await getBookmarks();
    bookmarks.push(domain);
    await chromeStorageSet(
      StorageSyncKey.BookmarkedDomains,
      JSON.stringify(bookmarks),
    );
    update(true);
  };

  const ifBookmarked = async (domain: string): Promise<boolean> => {
    const bookmarks: string[] = await getBookmarks();
    const found = bookmarks.find((bookmark) => domain === bookmark);
    return !!found;
  };

  const handleUnboookmarking = async (domain: string) => {
    const bookmarks = await getBookmarks();
    bookmarks.splice(bookmarks.indexOf(domain, 0), 1);
    await chromeStorageSet(
      StorageSyncKey.BookmarkedDomains,
      JSON.stringify(bookmarks),
    );
    update(false);
  };

  return (
    <Box>
      <Box sx={styles.tile}>
        {!status ? (
          <BookmarkBorderOutlinedIcon
            color="primary"
            onClick={() => handleBookMarking(domain)}
          />
        ) : (
          <BookmarkIcon
            style={{color: "#4c47f7"}}
            onClick={() => handleUnboookmarking(domain)}
          />
        )}
        <a>
          <Typography variant="body1">{domain}</Typography>
        </a>
      </Box>
      <Divider />
    </Box>
  );
};

export default Record;
