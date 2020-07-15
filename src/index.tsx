import React from "react";
import ReactDOM from "react-dom";
import {
  Box,
  CssBaseline,
  Typography,
  Button,
  TextField,
  Card,
  CardHeader,
  CardContent,
  CardMedia,
  CardActionArea,
  CardActions,
} from "@material-ui/core";
import * as serviceWorker from "./serviceWorker";
import Gun from "./Gun";
import "gun/lib/load";
import "gun/lib/promise";
import "gun/lib/open";
import "gun/sea";
import "gun/nts";

import Player from "react-player";
import { v4 } from "uuid";

type NowPlaying = { url: string; playing: boolean; time: number };
const gun = new Gun<
  Record<
    string,
    {
      leader?: string;
      nowPlaying?: NowPlaying;
    }
  >
>([`http://${window.location.hostname}:8765/gun`]);
const userId = v4();

type Video = {
  type: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  playing?: boolean;
  time?: number;
};

function App() {
  const [state, setState] = React.useState<any>({});
  const [leader, setLeader] = React.useState<string | undefined>();
  const [nowPlaying, setNowPlaying] = React.useState<NowPlaying | undefined>(
    undefined
  );

  const isLeader = leader === userId;
  React.useEffect(() => {
    gun
      .get("asdfasdf")
      .get("nowPlaying")
      .on((d) => {
        setNowPlaying(d ? { ...d } : undefined);
      });

    gun
      .get("asdfasdf")
      .get("leader")
      .on((l) => {
        setLeader(l);
      });
  }, []);

  const [searchText, setSearchText] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<{
    videos: Video[];
    loading: boolean;
  }>({ videos: [], loading: true });

  const [player, setPlayer] = React.useState<Player | null>(null);

  React.useEffect(() => {
    if (
      player &&
      player.getInternalPlayer() &&
      nowPlaying &&
      !isLeader &&
      (nowPlaying.time < player.getCurrentTime() - 1 ||
        nowPlaying.time > player.getCurrentTime() + 1)
    ) {
      player.seekTo(nowPlaying.time, "seconds");
    }
  }, [nowPlaying, isLeader, player]);
  React.useEffect(() => {
    if (player && player.getInternalPlayer() && nowPlaying && !isLeader) {
      const internalPlayer = player.getInternalPlayer();

      if (
        internalPlayer &&
        internalPlayer instanceof YT.Player &&
        internalPlayer.pauseVideo &&
        internalPlayer.playVideo
      ) {
        if (nowPlaying.playing) {
          internalPlayer.playVideo();
        } else {
          internalPlayer.pauseVideo();
        }
      }
    }
  }, [nowPlaying, isLeader, player]);
  console.log(Gun.state());
  return (
    <Box>
      <Box display="flex">
        <TextField
          value={searchText}
          onChange={(e) => {
            setSearchText(e.currentTarget.value);
          }}
          label="Search for a video"
        />
        <Button
          onClick={() =>
            fetch(`/search?query=${encodeURIComponent(searchText)}`)
              .then((res) => res.json())
              .then((data) => setSearchResults(data))
          }
        >
          Search
        </Button>
      </Box>

      <Box padding="1rem">
        <Typography variant="h3">Now Playing</Typography>{" "}
        <Button
          disabled={isLeader}
          variant="outlined"
          onClick={() => {
            gun.get("asdfasdf").get("leader").put(userId);
          }}
        >
          {isLeader ? "You are the leader" : "Take leadership"}
        </Button>
        {nowPlaying ? <Typography>Time: {nowPlaying.time}</Typography> : null}
        {nowPlaying ? (
          <Player
            controls
            ref={setPlayer}
            progressInterval={100}
            onPlay={
              isLeader
                ? () => {
                    gun
                      .get("asdfasdf")
                      .get("nowPlaying")
                      .put({ playing: true });
                  }
                : undefined
            }
            onPause={
              isLeader
                ? () => {
                    gun
                      .get("asdfasdf")
                      .get("nowPlaying")
                      .put({ playing: false });
                  }
                : undefined
            }
            onSeek={
              isLeader
                ? (seconds) => {
                    gun
                      .get("asdfasdf")
                      .get("nowPlaying")
                      .put({ time: seconds });
                  }
                : undefined
            }
            /* onEnded={() =>
              gun
                .get("asdfasdf")
                .get("nowPlaying")
                .put({ playing: false, time: undefined })
            } */
            onProgress={
              isLeader
                ? (progress) => {
                    /*   gun.get("asdfasdf").get("leader").put(userId); */
                    gun
                      .get("asdfasdf")
                      .get("nowPlaying")
                      .put({ time: progress.playedSeconds });
                  }
                : undefined
            }
            url={nowPlaying.url}
          />
        ) : (
          <Typography variant="h6">Click on a video to play</Typography>
        )}
      </Box>
      <Box>
        <Typography variant="h2">Search results</Typography>
        {searchResults.videos.map((vid) => (
          <Box key={vid.url} padding="1rem">
            <Card>
              <CardHeader
                title={vid.title}
                subheader={vid.description}
              ></CardHeader>

              <CardMedia>
                <img src={vid.thumbnail} />
              </CardMedia>

              <CardActions>
                <Button
                  onClick={() => {
                    gun.get("asdfasdf").get("leader").put(userId);
                    gun
                      .get("asdfasdf")
                      .get("nowPlaying")
                      .put({ url: vid.url, time: 0, playing: false });
                  }}
                >
                  Play
                </Button>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>
      {/*     <Button variant="outlined" onClick={onClick}>
        Put some dataaa
      </Button>
      <Typography variant="h1">{JSON.stringify(state)}</Typography> */}
    </Box>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <CssBaseline>
      <App />
    </CssBaseline>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
