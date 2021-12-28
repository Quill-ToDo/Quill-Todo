import React from "react";

class MenuButton extends React.Component {
    render () {
        return (
            <button className="btn" id="btn-add">
                <img src={this.props.src} alt={this.props.alt}></img>
            </button>
        )
    }
}

export default MenuButton