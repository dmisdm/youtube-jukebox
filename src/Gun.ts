import Gun from "gun";

export default Gun as typeof Gun & { state(): number };
