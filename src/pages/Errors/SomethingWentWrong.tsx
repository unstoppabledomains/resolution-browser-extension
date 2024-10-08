import React from "react";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import queryString from "querystring";
import {useExtensionStyles} from "../../styles/extension.styles";

interface Props {
  location?: {
    search?: string;
  };
}

const SomethingWentWrong: React.FC<Props> = ({...props}) => {
  const {classes} = useExtensionStyles();
  const query = queryString.parse(props.location.search.replace(/^\?/, ""));
  return (
    <Paper className={classes.container}>
      {query.reason != null ? (
        <Typography variant="body1">{query.reason}</Typography>
      ) : (
        <> </>
      )}
    </Paper>
  );
};

export default SomethingWentWrong;
