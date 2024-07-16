import React from "react";
import {Typography, IconButton, Tooltip, Box} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const CopyableLabel = ({text}: {text: string}) => {
  const copyToClipboard = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(
      () => {},
      (err) => {
        console.error("Failed to copy text: ", err);
      },
    );
  };

  return (
    <Box
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        paddingTop: "16px",
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
