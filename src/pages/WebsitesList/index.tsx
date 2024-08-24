import React, {useState, useEffect} from "react";
import {useAsyncEffect} from "use-async-effect";
import WeblistHeader, {Extension} from "./WeblistHeader";
import List from "./List";
import {chromeStorageGet, StorageSyncKey} from "../../lib/chromeStorage";
import {Box} from "@mui/material";

const styles = {
  main: {
    padding: "5 15 0 15",
  },
  background: {
    backgroundColor: "#f9faff",
    height: "100vh",
  },
  body: {
    marginTop: 2,
    display: "flex",
    flexDirection: "column",
    color: "#0e4dff",
    justifyContent: "space-between",
  },
};

interface Props {}

const baseurl = "https://unstoppabledomains.com/api/v1";
// const baseurl = 'http://localhost:8080/api/v1';

const WebsiteList: React.FC<Props> = () => {
  const [extension, setExtension] = useState<Extension>(Extension.all);
  const [letter, setLetter] = useState("a");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [domains, setDomains] = useState([""]);
  const [bookmarkClicked, clickBookmark] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    //Todo get last usage prefs from store and change them here
    setPage(1);
    setPerPage(20);
  }, []);

  useAsyncEffect(async () => {
    const freshdomains = await fetchDomains(page, perPage);
    if (freshdomains.length === 0) {
      setIsError(true);
    } else {
      setDomains(freshdomains);
    }
  }, [page, perPage, extension, letter]);

  useAsyncEffect(async () => {
    const bookmarks = await getBookmarks();
    if (bookmarkClicked) {
      setDomains(bookmarks);
    }
  }, [bookmarkClicked]);

  const fetchDomains = async (page: number, perPage: number) => {
    const isDigit = /\d/.test(letter);
    const url = `${baseurl}/websites/?page=${page}&perPage=${perPage}&letter=${letter}&isDigit=${isDigit}&extension=${extension}`;
    try {
      const domains: string[] = await fetch(url, {method: "GET"}).then((res) =>
        res.json(),
      );
      if (!domains || !domains[0]) return [];
      return domains;
    } catch (err) {
      return [];
    }
  };

  const getBookmarks = async (): Promise<string[]> => {
    const bookmarks = await chromeStorageGet(StorageSyncKey.BookmarkedDomains);
    if (bookmarks) return JSON.parse(bookmarks);
    return [];
  };

  return (
    <Box sx={styles.background}>
      <Box sx={styles.main}>
        <WeblistHeader
          setExtension={setExtension}
          bookMarkClick={clickBookmark}
        />
        <Box sx={styles.body}>
          {isError ? (
            <p>Temporary Disabled</p>
          ) : (
            <List
              setLetter={setLetter}
              letter={letter}
              bookmarkClicked={bookmarkClicked}
              setClickBookmark={clickBookmark}
              domains={domains}
              page={page}
              setPage={setPage}
              perPage={perPage}
              setPerPage={setPerPage}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};
export default WebsiteList;
