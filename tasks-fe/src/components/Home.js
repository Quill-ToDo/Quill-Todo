import React from "react";
import logout from '../static/images/logout.png';
import add from '../static/images/add.png';

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
                <MenuButton src={add} alt="Plus icon for add new task" onClick={() => {alertStore.add("failure", "We haven't implemented adding new tasks.")}}/>
                <MenuButton src={logout} alt="Power off icon for log out" onClick={() => {alertStore.add("notice", "We haven't implemented users or logging out.")}}/>
            </menu>
            <List store={taskStore} />
            <div id="slider"></div>
            <section id="calendar-wrapper"></section>
        </div>
    );
})

export default Home;
