import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import AddModeratorOutlinedIcon from "@mui/icons-material/AddModeratorOutlined";
import Button from "@mui/material/Button";
import {useExtensionStyles} from "../../styles/extension.styles";
import {useTranslationContext} from "@unstoppabledomains/ui-components";
import {requestOptionalPermissions} from "../../lib/runtime";
import Markdown from "markdown-to-jsx";

interface PermissionCtaProps {
  onPermissionGranted: () => void;
}

export const PermissionCta: React.FC<PermissionCtaProps> = ({
  onPermissionGranted,
}) => {
  const {classes, cx} = useExtensionStyles();
  const [t] = useTranslationContext();

  const handleCancel = () => {
    window.close();
  };

  const handleGrantClicked = async () => {
    const isGranted = await requestOptionalPermissions();
    if (isGranted) {
      onPermissionGranted();
    }
  };

  return (
    <Paper className={classes.container}>
      <Box className={cx(classes.walletContainer, classes.contentContainer)}>
        <Box
          className={cx(classes.contentContainer, classes.fullHeightCentered)}
        >
          <AddModeratorOutlinedIcon className={classes.walletIcon} />
          <Typography variant="h4" mt={3}>
            Permission Request
          </Typography>
          <Typography variant="body1" mt={1} mb={2}>
            The Unstoppable Lite Wallet extension needs to request additional
            permissions.
          </Typography>
          <Paper variant="outlined" className={classes.updatedContentContainer}>
            <Typography variant="body2">
              <Markdown>
                - **Create notifications:** to notify you about wallet activity
                as well as incoming chats when messaging is enabled
              </Markdown>
              <Markdown>
                - **Manage context menus:** to provide easy access to wallet
                features by right clicking a webpage
              </Markdown>
              <Markdown>
                - **View open tabs:** to display a wallet connection status
                icon, and help manage popup windows
              </Markdown>
            </Typography>
          </Paper>
        </Box>
        <Box className={classes.contentContainer}>
          <Button
            variant="contained"
            fullWidth
            className={classes.button}
            onClick={handleGrantClicked}
          >
            Grant Permissions
          </Button>
          <Button
            variant="outlined"
            fullWidth
            className={classes.button}
            onClick={handleCancel}
          >
            {t("common.cancel")}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
