import React from "react";
import { TaskApi } from "./TaskApi.js";
import { TaskStore } from "../store/TaskStore";
import { AlertStore } from "./AlertStore.js";

class RootStore {
    constructor () {
        // this.userStore
        this.taskStore = new TaskStore(this, new TaskApi());
        this.alertStore = new AlertStore(this);
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
const useAlertStore = () => rootStore.alertStore;

export {useStoreContext, StoreProvider, useTaskStore, useAlertStore }