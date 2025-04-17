import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  FlatList,
  Text,
  Button,
  Pressable,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  onSnapshot,
  query,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import HeaderRightLogoutButton from "../components/HeaderRightLogoutButton";
import { NavigationType } from "../type";

export default function TaskListScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<{ [uid: string]: string }>({});
  const [selectedTab, setSelectedTab] = useState<"to-do" | "inprogress" | "done">("to-do");
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const navigation = useNavigation<NavigationType>();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <HeaderRightLogoutButton />,
    });
  }, [navigation]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const userMap: { [uid: string]: string } = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        userMap[doc.id] = data.username || data.email;
      });
      setUsers(userMap);
    };

    const unsubscribe = onSnapshot(query(collection(db, "tasks")), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTasks(data);
    });

    fetchUsers();
    return () => unsubscribe();
  }, []);

  const filteredTasks = tasks.filter((task) => task.status === selectedTab);

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {["to-do", "inprogress", "done"].map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabButton, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab as any)}
          >
            <Text style={styles.tabText}>{tab.replace("-", " ").toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const deadline =
            item.deadLine?.toDate?.() || new Date(item.deadLine);
          return (
            <Pressable
              onPress={() => navigation.navigate("TaskDetail", { taskId: item.id })}
              onHoverIn={() => setHoveredTask(item.id)}
              onHoverOut={() => setHoveredTask(null)}
              style={[
                styles.taskItem,
                hoveredTask === item.id && styles.hoveredItem,
              ]}
            >
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={styles.taskDetail}>
                Publisher: {users[item.publisher] || "Unknown"}
              </Text>
              <Text style={styles.taskDetail}>
                Responsible: {users[item.responsible] || "Add user to task"}
              </Text>
              <Text style={styles.taskDetail}>Priority: {item.priorities}</Text>
              <Text style={styles.taskDetail}>
                Deadline: {deadline ? new Date(deadline).toLocaleString() : "N/A"}
              </Text>
            </Pressable>
          );
        }}
      />

      <Button title="Add New Task" onPress={() => navigation.navigate("AddTask")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    marginHorizontal: 4,
    borderRadius: 4,
  },
  activeTab: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    color: "#000",
    fontWeight: "bold",
  },
  taskItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  hoveredItem: {
    backgroundColor: "#e0f0ff",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  taskDetail: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
});
