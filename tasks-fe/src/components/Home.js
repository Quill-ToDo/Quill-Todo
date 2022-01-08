import React from "react";

import List from './List'
import ShowTask from './ShowTask';
import { observer } from "mobx-react-lite";
import { useTaskStore, useAlertStore } from "../store/StoreContext";


const Home = observer(() => {
    const taskStore = useTaskStore();
    const alertStore = useAlertStore();
    const showNewPopUp = false;

    return ( 
        <div id="home-wrapper">
            { showNewPopUp ? < div id="new-wrapper"></div> : null }
            { taskStore.focusedTask ? <ShowTask task={taskStore.focusedTask} /> : null }
            <menu id="left-menu" className="menu">
                <button className="btn" title="Add task" onClick={() => alertStore.add("failure", "We haven't implemented adding new tasks.")}>
                    <i className = "fas fa-plus fa-fw"> </i>
                </button>
                <button className="btn" title="Log out" onClick={() => alertStore.add("notice", "We haven't implemented users or logging out.")}>
                    <i className="fas fa-power-off fa-fw"></i>
                </button>
            </menu>
            <List store={taskStore} />
            <div id="slider"></div>
            <section id="calendar-wrapper"></section>
        </div>
    );
})

export default Home;
