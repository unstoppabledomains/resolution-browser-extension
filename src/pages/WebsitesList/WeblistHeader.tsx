import React, {useState} from "react";
import {AddCircle, Bookmarks} from "@mui/icons-material";
import {Box, Button, Link, Paper, Typography} from "@mui/material";

const styles = {
  main: {
    display: "flex",
    flexDirection: "column",
  },
  link: {
    textDecoration: "none",
  },
  header: {
    display: "flex",
    paddingBottom: "12px",
    justifyContent: "space-between",
  },
  title: {
    color: "#5a44f0",
    fontFamily: "OpenSans",
    fontWeight: 800,
    fontStretch: "normal",
    fontStyle: "normal",
    lineHeight: 1.17,
    letterSpacing: "normal",
  },
  control: {
    display: "flex",
    flexDirection: "column",
  },
  controlRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "36px",
  },
  rectangle: {
    borderRadius: "4px",
    border: "solid 1px rgba(70, 155, 255, 0.2)",
    backgroundColor: "rgba(70, 155, 255, 0.06)",
    padding: "0 2px 0 2px",
  },
  flex: {
    display: "flex",
    width: "180px",
    height: "36px",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: "4px",
  },
  addButton: {
    height: "40px",
    color: "white",
    backgroundColor: "#4c47f7",
  },
  controlText: {
    color: "#2d64ff",
    cursor: "pointer",
  },
  featuredBox: {
    padding: "4px",
  },
  featuredBoxInner: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  RecordLink: {
    color: "#0e4dff",
    textDecoration: "none",
    cursor: "pointer",
  },
};

export enum Extension {
  all = "",
  crypto = ".crypto",
}

interface Props {
  setExtension: React.Dispatch<React.SetStateAction<Extension>>;
  bookMarkClick: React.Dispatch<React.SetStateAction<boolean>>;
}

const WeblistHeader: React.FC<Props> = ({setExtension, bookMarkClick}) => {
  const [activeButton, setActiveButton] = useState<Extension>(Extension.all);

  const activate = (extension: Extension) => {
    setActiveButton(extension);
    setExtension(extension);
  };

  // const ifActive = (current: Extension): string =>
  //   activeButton === current ? styles.rectangle : ''
  const renderDomain = (domain: string) => {
    return <a href={`https://${domain}`}>{domain}</a>;
  };

  const renderFeatured = () => {
    return (
      <Box sx={styles.featuredBox}>
        <Typography variant="h5">Featured:</Typography>
        <Box sx={styles.featuredBoxInner}>
          {renderDomain("myetherwallet.crypto")}
          {renderDomain("kyber.crypto")}
          {renderDomain("pomp.crypto")}
          {renderDomain("hashoshi.crypto")}
        </Box>
      </Box>
    );
  };
  return (
    <Box sx={styles.main}>
      <Box sx={styles.header}>
        <Typography sx={styles.title} variant="h3">
          Decentralized Websites
        </Typography>
        <Link href="https://unstoppabledomains.com" sx={styles.link}>
          <Button sx={styles.addButton}>
            <AddCircle />
            &nbsp;Launch your website
          </Button>
        </Link>
      </Box>
      <Paper sx={styles.control}>
        <Box sx={styles.controlRow}>
          <Box sx={styles.flex}>
            <Box
              sx={{...(activeButton === Extension.all ? styles.rectangle : {})}}
            >
              <Typography
                variant="subtitle1"
                sx={styles.controlText}
                onClick={() => activate(Extension.all)}
              >
                All domains
              </Typography>
            </Box>
            <Box
              sx={{
                ...(activeButton === Extension.crypto ? styles.rectangle : {}),
              }}
            >
              <Typography
                variant="subtitle1"
                sx={styles.controlText}
                onClick={() => activate(Extension.crypto)}
              >
                .crypto
              </Typography>
            </Box>
          </Box>
          <Box>
            <Button
              style={{color: "#4c47f7"}}
              onClick={() => bookMarkClick(true)}
            >
              <Bookmarks />
              &nbsp;Bookmarks
            </Button>
          </Box>
        </Box>
        {renderFeatured()}
      </Paper>
    </Box>
  );
};
export default WeblistHeader;
