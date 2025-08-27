import { useState } from "react";
import { Route, RouteMetadata } from "@types/Route";
import { TProps, TController } from "./types";

export const useController = ({
  onSaveRoute,
  initialValues,
}: TProps): TController => {
  const [name, setName] = useState(initialValues?.metadata?.name || "");
  const [description, setDescription] = useState(
    initialValues?.metadata?.description || ""
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = "Route name is required";
    } else if (name.length < 2) {
      newErrors.name = "Route name must be at least 2 characters";
    }

    if (description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNameChange = (text: string) => {
    setName(text);
  };

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const routeData: Partial<Route> = {
      metadata: {
        name: name.trim(),
        description: description.trim() || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as RouteMetadata,
      waypoints: [],
    };

    onSaveRoute(routeData);
  };

  return {
    name,
    description,
    errors,
    handleNameChange,
    handleDescriptionChange,
    handleSave,
  };
};
