import React from "react";
import { TaskApi } from "../API/TaskApi.js";
import { TaskStore } from "../globalStore/TaskStore";
import { Timeline } from "../globalStore/Timeline";
import { configure } from "mobx"

configure({
    useProxies: "never"
})


class RootStore {
    constructor () {
        // this.userStore
        this.taskStore = new TaskStore(this, new TaskApi());
        this.timeline = new Timeline(this, this.taskStore);
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

// TODO: Method to add stores to this dynamically.

export {useStoreContext, StoreProvider, useTaskStore }