import React from "react";
import useUserId from "../../hooks/useUserId";
import {Box} from "@mui/material";
import CopyableLabel from "./CopyableLabel";

interface Props {}

const ShowUserId: React.FC<Props> = () => {
  const {userId, isLoading, error} = useUserId();

  if (isLoading) {
    return <></>;
  }

  if (error) {
    return <></>;
  }

  return (
    <Box>
      <CopyableLabel text={userId || ""} />
    </Box>
  );
};

export default ShowUserId;
