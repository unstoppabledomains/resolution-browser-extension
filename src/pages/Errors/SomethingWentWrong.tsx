import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import queryString from "querystring";
import React from "react";

import {useExtensionStyles} from "../../styles/extension.styles";

interface Props {
  location?: {
    search?: string;
  };
}

const SomethingWentWrong: React.FC<Props> = ({...props}) => {
  const {classes} = useExtensionStyles();
  const query = props.location?.search
    ? queryString.parse(props.location.search.replace(/^\?/, ""))
    : undefined;
  return (
    <Paper className={classes.container}>
      {query?.reason ? (
        <Typography variant="body1">{query.reason}</Typography>
      ) : (
        <> </>
      )}
    </Paper>
  );
};

export default SomethingWentWrong;
