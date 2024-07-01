import React from "react";
import Record from "./Record";
import {Typography, Grid, Paper, Menu, MenuItem, Box} from "@mui/material";

import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import InfoBox from "./InfoBox";
import Loading from "../Loading/Loading";

const styles = {
  main: {
    display: "flex",
    justifyContent: "space-between",
  },
  listBackground: {
    width: "60%",
  },
  list: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  },
  selectedLetter: {
    alignSelf: "flex-start",
    paddingLeft: "8px",
  },
  grid: {
    padding: "4px",
  },
  rectangle: {
    opacity: 0.8,
    borderRadius: "6px",
    backgroundImage:
      "linear-gradient(to left, rgba(255, 243, 249, 0), #eaf8fe)",
  },
  letter: {
    padding: "4px",
    cursor: "pointer",
  },
  letters: {
    display: "flex",
    flexWrap: "wrap",
    width: "100%",
    margin: "4px",
    padding: "4px",
  },
  statusLeft: {
    display: "flex",
    paddingLeft: "12px",
  },
  statusRight: {
    paddingRight: "12px",
  },
  status: {
    display: "flex",
    width: "100%",
    color: "#0e4dff",
    padding: "8px 12px 8px 12px",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bold: {
    fontWeight: "bold",
    color: "#0e4dff",
  },
  reflected: {
    transform: "rotate(180deg);",
  },
};

interface Props {
  setLetter: React.Dispatch<React.SetStateAction<string>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setPerPage: React.Dispatch<React.SetStateAction<number>>;
  setClickBookmark: React.Dispatch<React.SetStateAction<boolean>>;
  page: number;
  perPage: number;
  domains: string[];
  letter: string;
  bookmarkClicked: boolean;
}

const List: React.FC<Props> = ({
  setLetter,
  page,
  setPage,
  perPage,
  setPerPage,
  letter,
  domains,
  bookmarkClicked,
  setClickBookmark,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isLoading, setLoading] = React.useState(false);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event, value) => {
    if (!isNaN(+value)) {
      setPerPage(value);
    }
    setAnchorEl(null);
  };

  const goBack = (e) => {
    if (page > 1) setPage(page - 1);
  };
  const goForward = (e) => setPage(page + 1);

  const handleLetterClick = (letter: string) => {
    setLetter(letter === "0-9" ? "0" : letter);
    setClickBookmark(false);
  };

  const renderLetters = () => {
    const letters = [
      "0-9",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ];
    return letters.map((char) => {
      return (
        <Typography
          key={char}
          variant="body1"
          color="primary"
          sx={[styles.letter, letter === char && styles.rectangle]}
          onClick={() => handleLetterClick(char)}
        >
          {char}
        </Typography>
      );
    });
  };

  const renderLetter = () => {
    if (letter === "0") return "0-9";
    return letter.toUpperCase();
  };

  if (isLoading) return <Loading />;
  return (
    <Box sx={styles.main}>
      <Paper sx={styles.listBackground}>
        <Box sx={styles.list}>
          <Box sx={styles.letters}>{renderLetters()}</Box>
          <Typography variant="h5" sx={styles.selectedLetter}>
            {bookmarkClicked ? "Bookmarks" : renderLetter()}
          </Typography>
          <Grid container spacing={2} sx={styles.grid}>
            <Grid item md={6} sm={12} xs={12}>
              {domains.slice(0, domains.length / 2).map((domain) => (
                <Record key={domain} domain={domain} setLoading={setLoading} />
              ))}
            </Grid>
            <Grid item md={6} sm={12} xs={12}>
              {domains.slice(domains.length / 2).map((domain) => (
                <Record key={domain} domain={domain} setLoading={setLoading} />
              ))}
            </Grid>
          </Grid>
          <Box sx={styles.status}>
            <Box sx={styles.statusLeft}>
              <Typography sx={styles.bold} variant="body1">
                {`Page #${page} | Per page: ${perPage}`}
              </Typography>
              <KeyboardArrowDownOutlinedIcon
                aria-controls="simple-menu"
                aria-haspopup="true"
                onClick={handleClick}
              />
              <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={(e) => handleClose(e, 10)}>10</MenuItem>
                <MenuItem onClick={(e) => handleClose(e, 20)}>20</MenuItem>
                <MenuItem onClick={(e) => handleClose(e, 30)}>30</MenuItem>
                <MenuItem onClick={(e) => handleClose(e, 40)}>40</MenuItem>
              </Menu>
            </Box>
            <Box sx={styles.statusRight}>
              {page > 1 ? <ArrowBackIosIcon onClick={goBack} /> : <> </>}
              {domains.length < perPage ? (
                <></>
              ) : (
                <ArrowBackIosIcon onClick={goForward} sx={styles.reflected} />
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
      <InfoBox />
    </Box>
  );
};

export default List;
