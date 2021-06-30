import React from "react";
import WaveSurfer from "wavesurfer.js";
import { Box, Button } from "@material-ui/core";
import { darken } from "polished";
import { purple } from "./theme";
import { useDownloadAudio } from "./useDownloadAudio";
import { isLeft, tryCatch } from "fp-ts/lib/Either";
import { observer } from "mobx-react-lite";
import { RootInstance, useRootState } from "./state";
const audioContext = new AudioContext();
const updateWavesurferFromState = (
  waveSurfer: WaveSurfer,
  state: RootInstance
) => {
  if (state.player.playing) {
    if (
      !waveSurfer.isPlaying() ||
      //TODO: Just made up 0.2 randomly. Need some sort of research then a justification.
      Math.abs(waveSurfer.getCurrentTime() - state.player.position) > 0.2
    ) {
      waveSurfer.play(state.player.position);
    }
  } else {
    waveSurfer.pause();
  }
};
export const Player = observer(function Player(props) {
  const state = useRootState();
  const url = state.player.url;

  const urlInstance = tryCatch(
    () => new URL(url),
    () => undefined
  );
  const downloadedAudio = useDownloadAudio(
    audioContext,
    isLeft(urlInstance) ? undefined : urlInstance.right.href
  );
  const [ref, setRef] = React.useState<HTMLDivElement | null>(null);
  const [waveSurfer, setWaveSurfer] = React.useState<WaveSurfer>();
  const updateInterval = React.useRef<NodeJS.Timeout>();
  React.useEffect(() => {
    if (waveSurfer && downloadedAudio.audio) {
      waveSurfer.loadDecodedBuffer(downloadedAudio.audio.audioBuffer);
    }
  }, [downloadedAudio.audio, waveSurfer]);
  React.useEffect(() => {
    if (ref) {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
        updateInterval.current = undefined;
      }
      const waveSurfer = WaveSurfer.create({
        container: ref,
        waveColor: purple,
        progressColor: darken(0.2, purple),
        scrollParent: true,
        barWidth: 3,
        barRadius: 5,
      });
      waveSurfer.on("seek", () => {
        state.player.setPosition(waveSurfer.getCurrentTime());
      });

      waveSurfer.on("ready", () => {
        updateWavesurferFromState(waveSurfer, state);
        updateInterval.current = setInterval(() => {
          state.player.setPosition(waveSurfer.getCurrentTime());
        }, 60);
      });

      console.log(waveSurfer);

      setWaveSurfer((ws) => {
        if (ws) {
          ws.stop();
          ws.destroy();
        }
        return waveSurfer;
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
  React.useEffect(() => {
    if (waveSurfer) {
      updateWavesurferFromState(waveSurfer, state);
    }
  }, [state, state.player.playing, state.player.position, waveSurfer]);

  return (
    <Box width="100%">
      <div ref={setRef} style={{ width: "100%" }}></div>

      <Box>
        <Button
          variant="outlined"
          onClick={() => {
            state.player.playPause();
          }}
        >
          Play/Pause
        </Button>
      </Box>
    </Box>
  );
});
