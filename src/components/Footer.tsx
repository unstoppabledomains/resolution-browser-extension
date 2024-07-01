import React from "react";
import {Box, Grid, Link, Typography} from "@mui/material";
import {useNavigate} from "react-router-dom";
import {useFlags} from "launchdarkly-react-client-sdk";

const styles = {
  main: {
    maxHeight: "48px",
    padding: 1,
    backgroundColor: "#eef9ff",
    color: "#2d64ff",
    fontWeight: "bold",
  },
  trailing: {
    alignSelf: "flex-end",
  },
  title: {
    fontWeight: "bold",
    fontSize: "14px",
  },
};

interface Props {}

const Footer: React.FC<Props> = ({}) => {
  const navigate = useNavigate();
  const flags = useFlags();

  const navigateToList = () => {
    const manifest = chrome.runtime.getManifest();
    return chrome.tabs.update({
      url: `${manifest.browser_action.default_popup}#list`,
    });
  };

  return (
    <Box sx={styles.main}>
      <Grid container wrap="nowrap" spacing={1}>
        <Grid item>
          <i className="material-icons md-24">folder</i>
        </Grid>
        <Grid item xs zeroMinWidth>
          <Link onClick={navigateToList}>
            <Typography variant="subtitle1" sx={styles.title}>
              View list of websites
            </Typography>
          </Link>
        </Grid>
        {flags.extensionWalletEnable && (
          <Grid item sx={styles.trailing}>
            <Link
              onClick={() => {
                navigate("/wallet");
              }}
              style={{
                cursor: "pointer",
              }}
            >
              <i className="material-icons md-24">wallet</i>
            </Link>
          </Grid>
        )}
        <Grid item sx={styles.trailing}>
          <Link href="https://unstoppabledomains.com" target="blank">
            <i className="material-icons md-24">home</i>
          </Link>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Footer;
