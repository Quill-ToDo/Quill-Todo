import React, {Component} from "react";
import logout from '../static/images/logout.png';
import add from '../static/images/add.png';
import List from './List'
import MenuButton from "./MenuButton";

class Index extends Component {
    // TODO: Logic to decide which list gets rendered goes here.
    // Insert self into application.html
    render() {
        return ( 
            <div className="index-wrapper">
                <div id="new-wrapper"></div>
                <div id="show-wrapper"></div>
                <div id="left-menu" className="menu">
                    <MenuButton src={add} alt="Plus icon for add new task" link=""/>
                    <MenuButton src={logout} alt="Power off icon for log out" link=""/>
                </div>
                <List />
                <div id="slider"></div>
                <div id="calendar-wrapper">
                {/* <%= render 'calendar' %> */}
                </div>
            </div>
        );
    }
}

export default Index;