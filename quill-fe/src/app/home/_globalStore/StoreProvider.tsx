import React, { Context } from "react";
import RootStore from "./RootStore";

// Create root store to manage navigation between stores
const StoreContext : Context<RootStore> = React.createContext(new RootStore);
// Export functions to access stores through via React context
export const useRootStore = () => React.useContext(StoreContext)
export const useTaskStore = () => useRootStore().taskStore;
export const useEventStore = () => useRootStore().eventStore;
// Provide context via this component
export const StoreProvider = ({
    children,
}: {
    children: React.ReactNode
}) => {
    return (
        <StoreContext.Provider value={useRootStore()}>{children}</StoreContext.Provider>
    );
}