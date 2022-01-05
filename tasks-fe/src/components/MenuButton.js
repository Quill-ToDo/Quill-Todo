function MenuButton (props) {
    return (
        <button className="btn" id="btn-add" onClick={props.onClick}>
            <img src={props.src} alt={props.alt}></img>
        </button>
    )
}

export default MenuButton