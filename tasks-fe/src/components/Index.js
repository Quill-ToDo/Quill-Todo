import React from "react";

import logout from '../static/images/logout.png';
import add from '../static/images/add.png';
import List from './List'
import MenuButton from "./MenuButton";
import ShowTask from './ShowTask';


class Index extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            show: null
        }

        this.toggleShow = this.toggleShow.bind(this);

    }
    
    toggleShow (task) {
        if (this.state.show === null) {
            this.setState({show: <ShowTask task={task}/>}); 
        }
        else {
            this.setState({show: null});
        }
    }

    render () {
        return ( 
            <div className="index-wrapper">
                <div id="new-wrapper"></div>
                <div id="show-wrapper">{this.state.show}</div>
                <div id="left-menu" className="menu">
                    <MenuButton src={add} alt="Plus icon for add new task" link=""/>
                    <MenuButton src={logout} alt="Power off icon for log out" link=""/>
                </div>
                <List TaskClickCallback={this.toggleShow} />
                <div id="slider"></div>
                <div id="calendar-wrapper">
                {/* <%= render 'calendar' %> */}
                </div>
            </div>
        );
    }
}

export default Index;