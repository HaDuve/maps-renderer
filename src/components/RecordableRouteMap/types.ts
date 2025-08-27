import { Route } from "../../types/Route";

export type TProps = {
  route: Route;
  onVideoCreated?: (videoUri: string) => void;
};
