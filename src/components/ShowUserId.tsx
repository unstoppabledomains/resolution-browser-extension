import React from "react";
import useUserId from "../hooks/useUserId";
import {Box, Typography} from "@mui/material";
import CopyableLabel from "./CopyableLabel";

interface Props {}

const styles = {
  subtitle: {
    fontSize: "14px",
    fontWeight: 600,
  },
  input: {
    marginTop: 3,
  },
};

const ShowUserId: React.FC<Props> = () => {
  const {userId, isLoading, error} = useUserId();

  if (isLoading) {
    return <></>;
  }

  if (error) {
    return <></>;
  }

  return (
    <Box sx={styles.input}>
      <Typography variant="body2" sx={styles.subtitle}>
        User ID:
      </Typography>
      <CopyableLabel text={userId || ""} />
    </Box>
  );
};

export default ShowUserId;
