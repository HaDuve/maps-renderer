import { Route } from "@types/Route";

export type TProps = {
  onSaveRoute: (route: Partial<Route>) => void;
  initialValues?: Partial<Route>;
};

export type TController = {
  name: string;
  description: string;
  errors: { [key: string]: string };
  handleNameChange: (text: string) => void;
  handleDescriptionChange: (text: string) => void;
  handleSave: () => void;
};
