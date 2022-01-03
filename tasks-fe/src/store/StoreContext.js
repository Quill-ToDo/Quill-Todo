import React from "react";
import { TaskApi } from "./TaskApi.js";
import { TaskStore } from "../store/TaskStore";

const StoreContext = React.createContext(null);
const useTaskStore = () => React.useContext(StoreContext);

const StoreProvider = function ({children}) {
    const taskStore = new TaskStore(new TaskApi());

    // Breaks here
    // Checks to see if its string, function
    // Does not have a valid key
    return (
        <StoreContext.Provider value={taskStore}>{children}</StoreContext.Provider>
    );
}

// const refreshShow = async (pk) => {
    // Replace with getting task from store
    // return axios.get(API_URL + pk)
    // .then(res => {
    //     this.setState({show: <ShowTask 
    //         task={res.data} 
    //         clickOffHandler={this.toggleShow} 
    //     />}); 
    //         document.getElementById("show-wrapper").style.display="flex";
    // }).catch(e => {
    //     // TODO: Add to alert
    //     console.log("Couldn't render task details")
    //     console.log(e)
    // })
// }

// const toggleShow = (pk) => {
//     console.log("Toggle show");
// //     if (show === null) {
// //         refreshShow(pk);
// //     }
// //     else {
// //         this.setState({show: null});
// //         document.getElementById("show-wrapper").style.display="none";
// //     }
// }


export {useTaskStore, StoreProvider}