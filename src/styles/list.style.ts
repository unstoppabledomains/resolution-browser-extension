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
  info: {
    width: "40%",
    marginLeft: spacing(2),
    marginBottom: spacing(2),
  },
  infoBox: {
    color: "#080f23",
    backgroundColor: "#e6f6ff",
    padding: spacing(2),
  },
  link: {
    color: "#0e4dff",
    textDecoration: "none",
  },
  rectangle: {
    opacity: 0.8,
    borderRadius: "6px",
    backgroundImage: "linear-gradient(to left, rgba(255, 243, 249, 0), #eaf8fe)"
  },
  letter: {
    padding: spacing(1),
  },
  letters: {
    display: 'flex'
  },
  infoTitle: {
    paddingBottom: spacing(3)
  },
  infoBody: {
    height: "144px",
    marginBottom: spacing(1.5),
  },
  status: {
    display: 'flex',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  reflected: {
    transform: "rotate(180deg);" 
  },
  browserBox: {
    display: "flex",
    borderRadius: "6px",
    border: "solid 1px rgba(45, 122, 255, 0.33)",
    padding: spacing(3),
    marginTop: spacing(2)
  },
  browserLogo: {
    width: "80px",
    height: "80px",
    objectFit: "contain",
    marginRight: spacing(3),
  }
});

export default ListStyles;