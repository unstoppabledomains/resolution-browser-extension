import AddModeratorOutlinedIcon from "@mui/icons-material/AddModeratorOutlined";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Markdown from "markdown-to-jsx";
import React, {useState} from "react";

import {useTranslationContext} from "@unstoppabledomains/ui-components";

import {requestOptionalPermissions} from "../../lib/runtime";
import {useExtensionStyles} from "../../styles/extension.styles";

interface PermissionCtaProps {
  onPermissionGranted: () => Promise<void>;
}

export const PermissionCta: React.FC<PermissionCtaProps> = ({
  onPermissionGranted,
}) => {
  const {classes, cx} = useExtensionStyles();
  const [t] = useTranslationContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = () => {
    window.close();
  };

  const handleGrantClicked = async () => {
    setIsLoading(true);
    const isGranted = await requestOptionalPermissions();
    if (isGranted) {
      await onPermissionGranted();
    }
    setIsLoading(false);
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
                - **Create notifications:** to show wallet activity and incoming
                chats when messaging is enabled
              </Markdown>
              <Markdown>
                - **Manage context menus:** to provide right click access to
                wallet features
              </Markdown>
              <Markdown>
                - **View open tabs:** to display a connection status icon and
                improve popup window management
              </Markdown>
            </Typography>
          </Paper>
        </Box>
        <Box className={classes.contentContainer}>
          <LoadingButton
            variant="contained"
            fullWidth
            className={classes.button}
            onClick={handleGrantClicked}
            loading={isLoading}
          >
            Grant Permissions
          </LoadingButton>
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
