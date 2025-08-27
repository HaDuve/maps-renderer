import React from "react";
import { ScrollView } from "react-native";
import { TextInput, Button, HelperText, Card, Title } from "react-native-paper";
import { TProps } from "./types";
import { useController } from "./controller";
import { styles } from "./styles";

export const RouteInputForm = (props: TProps) => {
  const {
    name,
    description,
    errors,
    handleNameChange,
    handleDescriptionChange,
    handleSave,
  } = useController(props);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Create New Route</Title>

          <TextInput
            label="Route Name *"
            value={name}
            onChangeText={handleNameChange}
            mode="outlined"
            error={!!errors.name}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.name}>
            {errors.name}
          </HelperText>

          <TextInput
            label="Description"
            value={description}
            onChangeText={handleDescriptionChange}
            mode="outlined"
            multiline
            numberOfLines={4}
            error={!!errors.description}
            style={styles.input}
          />
          <HelperText type="error" visible={!!errors.description}>
            {errors.description}
          </HelperText>

          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
          >
            Create Route
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};
