import React from "react";

import List from './List'
import ShowTask from './ShowTask';
import MenuButton from "./MenuButton";
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
                <MenuButton src={<i className = "fas fa-plus fa-fw"> </i>} onClick={() => {alertStore.add("failure", "We haven't implemented adding new tasks.")}}/>
                <MenuButton src={<i className="fas fa-power-off fa-fw"></i>} onClick={() => {alertStore.add("notice", "We haven't implemented users or logging out.")}}/>
            </menu>
            <List store={taskStore} />
            <div id="slider"></div>
            <section id="calendar-wrapper"></section>
        </div>
    );
})

export default Home;
