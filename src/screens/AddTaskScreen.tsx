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
import { Picker } from "@react-native-picker/picker";

const isWeb = Platform.OS === "web";

export default function AddTaskScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("1");
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

    try {
      await addDoc(collection(db, "tasks"), {
        title,
        description,
        priorities: Number(priority),
        status: "to-do",
        deadLine: Timestamp.fromDate(deadline),
        actual_time: 0,
        publisher: auth.currentUser?.uid,
        responsible: null,
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

      <Text style={styles.label}>Priority:</Text>
      <View>
        <Picker
          selectedValue={priority}
          onValueChange={(itemValue) => setPriority(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Low (3)" value="3" />
          <Picker.Item label="Medium (2)" value="2" />
          <Picker.Item label="High (1)" value="1" />
        </Picker>
      </View>

      {isWeb ? (
        <>
          <Text style={styles.label}>Deadline:</Text>
          <input
            type="datetime-local"
            onChange={handleWebDateChange}
            style={{
              padding: 10,
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 5,
              marginBottom: 15,
            }}
          />
        </>
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 15,
    paddingTop: 5,
    paddingBottom: 5,
  },
  picker: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
