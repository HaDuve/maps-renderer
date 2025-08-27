import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText, Card, Title } from 'react-native-paper';
import { Route, RouteMetadata } from '../types/Route';

interface RouteInputFormProps {
  onSaveRoute: (route: Partial<Route>) => void;
  initialValues?: Partial<Route>;
}

const RouteInputForm: React.FC<RouteInputFormProps> = ({
  onSaveRoute,
  initialValues
}) => {
  const [name, setName] = useState(initialValues?.metadata?.name || '');
  const [description, setDescription] = useState(initialValues?.metadata?.description || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Route name is required';
    } else if (name.length < 2) {
      newErrors.name = 'Route name must be at least 2 characters';
    }

    if (description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      waypoints: []
    };

    onSaveRoute(routeData);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Create New Route</Title>

          <TextInput
            label="Route Name *"
            value={name}
            onChangeText={setName}
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
            onChangeText={setDescription}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 16,
  },
});

export default RouteInputForm;
