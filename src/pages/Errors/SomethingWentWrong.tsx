import React from "react";
import {Box, Typography} from "@mui/material";
import queryString from "querystring";

interface Props {
  location?: {
    search?: string;
  };
}

const SomethingWentWrong: React.FC<Props> = ({...props}) => {
  const query = queryString.parse(props.location.search.replace(/^\?/, ""));
  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: `#f9faff`,
      }}
    >
      {query.reason != null ? (
        <Typography variant="body1">{query.reason}</Typography>
      ) : (
        <> </>
      )}
    </Box>
  );
};

export default SomethingWentWrong;
