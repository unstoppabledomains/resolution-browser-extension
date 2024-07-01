import {Box, Typography} from "@mui/material";
import React from "react";

type TotalBallanceProps = {
  totalBalance: number;
};

const TotalBallance: React.FC<TotalBallanceProps> = ({totalBalance}) => {
  return (
    <Box
      sx={{
        paddingBottom: "2rem",
      }}
    >
      <Typography
        sx={{
          fontSize: "32px",
          fontWeight: 700,
        }}
      >
        ${totalBalance}
      </Typography>
    </Box>
  );
};

export default TotalBallance;
