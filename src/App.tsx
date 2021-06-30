import { Global } from "@emotion/core";
import {
  Box,
  Button,
  createMuiTheme,
  CssBaseline,
  Grid,
  TextField,
  ThemeProvider,
} from "@material-ui/core";

import React from "react";
import { Padding } from "./Components";
import { Player } from "./Player";
import { ProvideRootStore, useRootState } from "./state";
import { green } from "./theme";
import { observer } from "mobx-react-lite";

const theme = createMuiTheme({
  palette: {
    /* primary: {
      main: "#56E39F",
    },
    secondary: {
      main: "#673AB7",
    }, */
  },
});
const Root = (props: { children: React.ReactNode }) => {
  return (
    <>
      <Global
        styles={`
        #root, html, body {
            height: 100%;
        }
        body {
            background-color: ${green}
        }
    `}
      />
      <CssBaseline />
      <ProvideRootStore>
        <ThemeProvider theme={theme}>{props.children}</ThemeProvider>
      </ProvideRootStore>
    </>
  );
};

const InnerApp = observer(function InnerApp() {
  const state = useRootState();
  const [inputUrl, setInputUrl] = React.useState(state.player.url);

  React.useEffect(() => {
    setInputUrl(state.player.url);
  }, [state.player.url]);
  return (
    <Grid container style={{ height: "100%" }}>
      <Grid item xs={3}></Grid>
      <Grid item xs={6}>
        <Padding />
        <Box display="flex" alignItems="flex-end">
          <TextField
            fullWidth
            label="Youtube URL"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.currentTarget.value)}
          />
          <Padding />
          <Button
            variant="outlined"
            onClick={() => state.player.setUrl(inputUrl)}
          >
            Play
          </Button>
        </Box>

        <Padding />
        <Player />
      </Grid>
      <Grid item xs={3}></Grid>
    </Grid>
  );
});

export function App() {
  return (
    <Root>
      <InnerApp />
    </Root>
  );
}
