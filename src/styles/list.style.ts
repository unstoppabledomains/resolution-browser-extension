import {createStyles, Theme} from '@material-ui/core';

const ListStyles = ({spacing, palette} : Theme)  => createStyles({
  main: {
    display: "flex",
    justifyContent: 'space-between'
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
    paddingLeft: spacing(2)
  },
  grid: {
    padding: spacing(1),
  },
  rectangle: {
    opacity: 0.8,
    borderRadius: "6px",
    backgroundImage: "linear-gradient(to left, rgba(255, 243, 249, 0), #eaf8fe)"
  },
  letter: {
    padding: spacing(1),
    cursor: "pointer",
  },
  letters: {
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%',
    margin: spacing(1),
    padding: spacing(1),
  },
  statusLeft: {
    display: 'flex',
    paddingLeft: spacing(3),
  },
  statusRight: {
    paddingRight: spacing(3),
  },
  status: {
    display: 'flex',
    width: '100%',
    color: "#0e4dff",
    padding: spacing(2,3,2,3),
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bold: {
    fontWeight: "bold",
    color: "#0e4dff"
  },
  reflected: {
    transform: "rotate(180deg);" 
  },
});

export default ListStyles;