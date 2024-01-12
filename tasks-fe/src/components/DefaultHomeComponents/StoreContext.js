import React from "react";
import { TaskApi } from "../../API/TaskApi.js";
import TaskStore from "./Task/TaskStore";

class RootStore {
    constructor () {
        // this.userStore
        this.taskStore = new TaskStore(this, new TaskApi());
    }
}

const StoreContext = React.createContext(null);
const useStoreContext = () => React.useContext(StoreContext);
var rootStore;

const StoreProvider = function ({children}) {
    rootStore = new RootStore();
    
    return (
        <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>
    );
}

const useTaskStore = () => rootStore.taskStore;

export {useStoreContext, StoreProvider, useTaskStore }