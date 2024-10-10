import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#164432",
    },
  },
  typography: {
    fontFamily: ["Poppins"].join(","),
  },
});

export default theme;