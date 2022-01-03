import React from "react";
import logout from '../static/images/logout.png';
import add from '../static/images/add.png';
// import List from './List'
import ShowTask from './ShowTask';
import MenuButton from "./MenuButton";
import { observer } from "mobx-react-lite";
import { useTaskStore } from "../store/StoreContext";
    

const Index = observer((props) => {
    const context = useTaskStore();
    // useState

    return ( 
        <div id="index-wrapper">
            <div id="new-wrapper"></div>
            <div id="show-wrapper">{ context.focusedTask ? <ShowTask task={context.showTask}/> : null }</div>
            <div id="left-menu" className="menu">
                <MenuButton src={add} alt="Plus icon for add new task" link=""/>
                <MenuButton src={logout} alt="Power off icon for log out" link=""/>
            </div>
            <ul>
            </ul>
            {/* <List /> */}
            <div id="slider"></div>
            <div id="calendar-wrapper">
            </div>
        </div>
    );
})

export {Index};
