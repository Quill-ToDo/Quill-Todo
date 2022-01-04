import React from "react";
import { TaskApi } from "./TaskApi.js";
import { TaskStore } from "../store/TaskStore";
import { AlertStore } from "./AlertStore.js";

// Tasks
const TaskContext = React.createContext(null);
const useTaskStore = () => React.useContext(TaskContext);

const TaskProvider = function ({children}) {
    const taskStore = new TaskStore(new TaskApi());

    return (
        <TaskContext.Provider value={taskStore}>{children}</TaskContext.Provider>
    );
}

// Alerts
const AlertContext = React.createContext(null);
const useAlertStore = () => React.useContext(AlertContext);

const AlertProvider = function ({children}) {
    const alertStore = new AlertStore();
    return (
        <AlertContext.Provider value={alertStore}>{children}</AlertContext.Provider>
    );
}

export {useTaskStore, TaskProvider, useAlertStore, AlertProvider}