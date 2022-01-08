function MenuButton (props) {
    return (
        <button className="btn" onClick={props.onClick}>
            {props.src}
        </button>
    )
}

export default MenuButton