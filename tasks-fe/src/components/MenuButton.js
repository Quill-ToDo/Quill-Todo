function MenuButton (props) {
    return (
        <button className="btn" id="btn-add">
            <img src={props.src} alt={props.alt}></img>
        </button>
    )
}

export default MenuButton