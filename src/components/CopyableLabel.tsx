import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import React from "react";

import {Logger} from "../lib/logger";

function CopyableLabel({text}: {text: string}) {
  const copyToClipboard = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(
      () => {},
      err => {
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
}

export default CopyableLabel;
