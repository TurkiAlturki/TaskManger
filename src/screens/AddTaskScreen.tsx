import React, { useState, useLayoutEffect } from "react";
import {
  View,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Text,
  Platform,
  TouchableOpacity,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import HeaderRightLogoutButton from "../components/HeaderRightLogoutButton";

const isWeb = Platform.OS === "web";

export default function AddTaskScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [deadline, setDeadline] = useState(new Date());
  const [isPickerVisible, setPickerVisible] = useState(false);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <HeaderRightLogoutButton />,
    });
  }, [navigation]);

  const handleAddTask = async () => {
    if (!description.trim()) return Alert.alert("Description is required");
    if (!priority.trim() || isNaN(Number(priority)))
      return Alert.alert("Priority must be a number");

    try {
      await addDoc(collection(db, "tasks"), {
        title,
        description,
        priorities: Number(priority),
        status: "to-do",
        deadLine: Timestamp.fromDate(deadline),
        actual_time: 0,
        publisher: auth.currentUser?.uid,
        userID: auth.currentUser?.uid,
      });

      Alert.alert("Success", "Task added!");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const onConfirm = (selectedDate: Date) => {
    setPickerVisible(false);
    setDeadline(selectedDate);
  };

  const handleWebDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) setDeadline(date);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Task Title:</Text>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Task Description:</Text>
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>
        Priority (1 = High, 2 = Medium, 3 = Low):
      </Text>
      <TextInput
        style={styles.input}
        placeholder="1, 2 or 3"
        value={priority}
        onChangeText={setPriority}
        keyboardType="numeric"
      />

      {isWeb ? (
        <input
          type="datetime-local"
          onChange={handleWebDateChange}
          style={{
            padding: 10,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 5,
            marginBottom: 15,
            width: "100%",
          }}
        />
      ) : (
        <>
          <Text style={styles.label}>Deadline:</Text>
          <Text style={{ marginBottom: 10 }}>{deadline.toLocaleString()}</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setPickerVisible(true)}
          >
            <Text style={styles.dateButtonText}>📅 Pick Deadline</Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isPickerVisible}
            mode="datetime"
            date={deadline}
            onConfirm={onConfirm}
            onCancel={() => setPickerVisible(false)}
            is24Hour={true}
          />
        </>
      )}

      <View style={{ marginTop: 20 }}>
        <Button title="Add Task" onPress={handleAddTask} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  input: {
    borderColor: "#888",
    borderWidth: 1,
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  dateButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: "center",
  },
  dateButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
