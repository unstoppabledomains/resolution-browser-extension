import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {Logger} from "../lib/logger";

const CopyableLabel = ({text}: {text: string}) => {
  const copyToClipboard = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(
      () => {},
      (err) => {
        Logger.error(err, "Popup", "Failed to copy text");
      },
    );
  };

  return (
    <Box
      style={{
        display: "flex",
        alignItems: "center",
      }}
    >
      <Typography variant="body2" fontSize="small">
        {text}
      </Typography>
      <Tooltip title="Copy to clipboard">
        <IconButton onClick={() => copyToClipboard(text)} size="small">
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default CopyableLabel;
