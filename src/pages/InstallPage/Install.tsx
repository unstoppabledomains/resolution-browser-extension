import React from "react";
import {
  StorageSyncKey,
  chromeStorageSyncGet,
  chromeStorageSyncSet,
} from "../../util/chromeStorageSync";
import {ExtensionOptions, ExtensionURIMap} from "../../types";
import {Box, Link, Typography} from "@mui/material";

const styles = {
  background: {
    height: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: `#f9faff`,
  },
  heading: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    padding: 1,
    alignItems: "center",
  },
  howto: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
};

interface Props {}

const Install: React.FC<Props> = () => {
  chromeStorageSyncGet(StorageSyncKey.GatewayBaseURL).then((url) => {
    if (!url)
      chromeStorageSyncSet(
        StorageSyncKey.GatewayBaseURL,
        ExtensionURIMap[ExtensionOptions.InfuraAPI],
      );
  });

  return (
    <Box sx={styles.background}>
      <Box sx={styles.heading}>
        <Typography variant="h4">
          Decentralized browser extension was installed
        </Typography>
      </Box>
      <Box sx={styles.howto}>
        <Typography variant="h3">How to use</Typography>
        <ol style={{fontSize: "1.15rem", marginLeft: "0"}}>
          <li style={{marginTop: ".5em"}}>
            Enter a domain into the search bar. ex. http://57smiles.crypto
          </li>
          <li style={{marginTop: ".5em"}}>
            The browser will redirect you using the gateway url below.
          </li>
          <li style={{marginTop: ".5em"}}>
            For a list of current gateways check out this{" "}
            <Link href="https://ipfs.github.io/public-gateway-checker/">
              website
            </Link>
            .
          </li>
          <li style={{marginTop: ".5em"}}>
            You can change the gateway in the main pop up windows of this
            extension
          </li>
        </ol>
      </Box>
    </Box>
  );
};

export default Install;
