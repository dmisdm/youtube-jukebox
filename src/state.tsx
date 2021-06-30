import React from "react";
import { Instance, onSnapshot, types, applySnapshot } from "mobx-state-tree";
import lf from "localforage";

const localforageInstance = lf.createInstance({
  name: "state-persistence",
});
const Player = types
  .model({
    url: "",
    playing: false,
    position: 0,
  })
  .actions((self) => ({
    setUrl(url: string) {
      self.url = url;
    },
    playPause() {
      self.playing = !self.playing;
    },
    setPlaying(playing: boolean) {
      self.playing = playing;
    },
    setPosition(position: number) {
      self.position = position;
    },
  }));

const RootStore = types.model({
  player: Player,
});

const rootStore = RootStore.create({
  player: {},
});

const key = "snapshot-v1";
const rehydrate = async () => {
  const value = await localforageInstance.getItem(key);
  if (value) {
    applySnapshot(rootStore, value);
  }
};
rehydrate();
onSnapshot(rootStore, async (snapshot) => {
  await localforageInstance.setItem(key, snapshot);
});

export type RootInstance = Instance<typeof RootStore>;
const RootStoreContext = React.createContext<null | RootInstance>(null);

export const ProvideRootStore: React.ComponentType = (props) => (
  <RootStoreContext.Provider value={rootStore} {...props} />
);
export function useRootState() {
  const store = React.useContext(RootStoreContext);
  if (store === null) {
    throw new Error("Store cannot be null, please add a context provider");
  }
  return store;
}
