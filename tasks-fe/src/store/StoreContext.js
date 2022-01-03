import React from "react";
import { TaskApi } from "./TaskApi.js";
import { TaskStore } from "../store/TaskStore";

const StoreContext = React.createContext(null);
const useTaskStore = () => React.useContext(StoreContext);

const StoreProvider = function ({children}) {
    const taskStore = new TaskStore(new TaskApi());

    return (
        <StoreContext.Provider value={taskStore}>{children}</StoreContext.Provider>
    );
}

export {useTaskStore, StoreProvider}