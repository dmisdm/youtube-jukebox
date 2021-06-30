import React from "react";

import ytdl from "ytdl-core";
import { fs } from "memfs";

type SongDownload = {
  audioBuffer: AudioBuffer;
  info: ytdl.videoInfo;
};

const audioDlCache = caches.open("audio-dl-cache-v1");
function tryCatch<R, T extends () => R>(tryer: T, catcher: (e: unknown) => R) {
  try {
    return tryer();
  } catch (e) {
    return catcher(e);
  }
}

function getUrlForCache(songUrl: string) {
  const videoId = ytdl.getURLVideoID(songUrl);
  return `https://youtube.com/watch?v=${videoId}`;
}

async function processUncached(
  url: string,
  data: {
    buffer: ArrayBuffer;
    info: ytdl.videoInfo;
  },
  ctx: AudioContext
): Promise<SongDownload> {
  const cache = await audioDlCache;
  const copied = data.buffer.slice(0);
  const audioBuffer = await ctx.decodeAudioData(data.buffer);
  const responseToCache = new Response(copied, {
    headers: new Headers({
      "X-Song-Info": encodeURIComponent(JSON.stringify(data.info)),
    }),
  });

  cache.put(getUrlForCache(url), responseToCache);

  return {
    audioBuffer,
    info: data.info,
  };
}

async function processCached(
  url: string,
  response: Response,
  ctx: AudioContext
): Promise<SongDownload> {
  const arrayBuffer = await response.arrayBuffer();

  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  const result = JSON.parse(
    decodeURIComponent(response.headers.get("X-Song-Info") || "")
  );

  return {
    audioBuffer,
    info: result,
  };
}

async function downoadSong(
  url: string,
  audioContext: AudioContext
): Promise<SongDownload> {
  const cache = await audioDlCache;
  const hit = await cache.match(getUrlForCache(url));
  if (hit) {
    return processCached(url, hit, audioContext);
  } else {
    const req = ytdl(url);

    const out = fs.createWriteStream("tmp");
    req.pipe(out);
    const info = await ytdl.getBasicInfo(url);
    const buffer = await new Promise<ArrayBuffer>((resolve) =>
      out.on("finish", () => resolve((fs.readFileSync("tmp") as Buffer).buffer))
    );

    return processUncached(
      url,
      {
        info,
        buffer: buffer,
      },
      audioContext
    );
  }
}

export function useDownloadAudio(ctx?: AudioContext, url?: string) {
  const [state, setState] = React.useState<{
    loading: boolean;
    audio?: {
      audioBuffer: AudioBuffer;
      info: ytdl.videoInfo;
    };
  }>({ loading: false });
  React.useEffect(() => {
    let cancelled = false;
    if (url && url.length && ctx) {
      setState({
        loading: true,
      });
      downoadSong(url, ctx).then((song) => {
        if (cancelled) return;
        if (!cancelled) {
          setState((state) => ({
            ...state,
            loading: false,
            audio: {
              audioBuffer: song.audioBuffer,
              info: song.info,
            },
          }));
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [ctx, url]);
  return state;
}
