import { Box } from "@material-ui/core";
import React from "react";
export const Padding = ({ size = 1 }: { size?: number }) => (
  <Box height={`${size}rem`} width={`${size}rem`} />
);
