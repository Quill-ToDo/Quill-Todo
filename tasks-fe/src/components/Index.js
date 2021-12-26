import React, {Component} from "react";
import logout from '../static/images/logout.png';
import add from '../static/images/add.png';
import List from './List'

class Index extends Component {
    // TODO: Logic to decide which list gets rendered goes here.
    // Insert self into application.html
    render() {
        return ( 
            <div className="index-wrapper">
                <div id="new-wrapper"></div>
                <div id="show-wrapper"></div>
                <div id="left-menu" className="menu">
                    <button className="btn" id="btn-add">
                        <img src={add} alt="Plus sign icon for task add"></img>
                    </button>
                    <button className="btn">
                        {/* <%= link_to(destroy_user_session_path, method: :delete, alt: "Logout") do  */}
                        <img src={logout} alt="Power off icon for log out"></img>
                    </button>
                </div>
                <List />
                <div id="slider"></div>
                <div id="calendar-wrapper">
                {/* {% comment %} <%= render 'calendar' %> {% endcomment %} */}
                </div>
            </div>
        );
    }
}

export default Index;