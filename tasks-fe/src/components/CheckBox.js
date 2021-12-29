import { Fragment } from "react"

function CheckBox (props) {
    return (
        <Fragment>
            <input 
                type="checkbox" 
                aria-labelledby={props.title} 
                onChange={props.toggleCompleteHandler}
                data-complete={props.complete}
                >
            </input>
            <span className={props.type === "due" ? "checkmark" : "checkmark round"}></span>
        </Fragment>
    )
}

export default CheckBox