import { Fragment, useState, useRef, useEffect } from "react";
import { DateTime } from "luxon";
import pluralize from 'pluralize';
import '../static/css/new.css';
import { useTaskStore } from "../store/StoreContext";
import { useAlertStore } from "../store/StoreContext";


const TaskCreatePopup = (props) => {
    const [title, setTitle] = useState({value: "", errors: []});
    const [desc, setDesc] = useState({value: "", errors: []});
    const [start, setStart] = useState({value: "", errors: []});
    const [due, setDue] = useState({value: "", errors: []});
    const tasks = useTaskStore();
    const alerts = useAlertStore();
    const dateFormat = "D t";

    useEffect(() => {
        const firstInput = document.querySelector("input[name='title']")
        firstInput.focus()
    }, [])

    const errorsList = (errors) => {
        return <Fragment>
            <p className="error-list">Errors:</p> 
            <ul className="error-list">
                {errors.map((errorText) => {
                    return <li key={"error-"+errorText}>
                        {errorText}
                    </li>
                })}
            </ul>
        </Fragment>
    }

    const getErrors = (name, value) => {
        // Time format until we get parsing done: 8/6/2014 1:07 PM
        const errors = [];
        var parsedTime;
        switch (name) {
            case 'title':
                if (value.length > 100) { 
                    errors.push(`Title is ${pluralize("character", value.length-100, true)} too long`);
                }
                else if (value.length === 0) {
                    errors.push(`Title is required`);
                }
                break;
            case 'description':
                if (value.length > 1000) { 
                    errors.push(`Description is ${pluralize("character", value.length-1000, true)} too long`);
                }
                break;
            case 'start':
                if (value !== "") {
                    parsedTime = DateTime.fromFormat(value, dateFormat);
                    if (parsedTime.invalid) {
                        errors.push('Start is not of the format M/m/yyyy h:mm a')
                    }
                    else if (due.value && DateTime.fromFormat(due.value, dateFormat) <= parsedTime) {
                        errors.push('Start does not come before due')
                    } 
                }
                break;
            case 'due':
                if (value === "") {
                    errors.push("Due date is required")
                }
                else {
                    parsedTime = DateTime.fromFormat(value, dateFormat);
                    if (parsedTime.invalid) {
                        errors.push("Date is not of the format M/m/yyyy h:mm a")
                    }
                    else if (start.value && DateTime.fromFormat(start.value, dateFormat) >= parsedTime) {
                        errors.push('Due does not come after start')
                    }
                }
                break;
            default:
                console.error("How did I get here.")
                break;
        } 
        return errors;
    }

    const handleSubmit = (event) => {
        // compose JSON? /send to API
        event.preventDefault();
        var valid = true;

        const titleErrors = getErrors("title", title.value);
        if (titleErrors.length !== 0) {
            valid = false;
            setTitle({value: title.value, errors: titleErrors})
        }
        const descErrors = getErrors("description", desc.value);
        if (descErrors.length !== 0) {
            valid = false;
            setDesc({value: desc.value, errors: descErrors})
        }
        const startErrors = getErrors('start', start.value);
        if (startErrors.length !== 0) {
            valid = false;
            setStart({value: start.value, errors: startErrors})
        }
        const dueErrors = getErrors('due', due.value);
        if (dueErrors.length !== 0) {
            valid = false;
            console.log("here");
            setDue({value: due.value, errors: dueErrors})
        }

        if (valid) {
            console.log(event.target);
            const data = new FormData(event.target);
            if (start.value !== "") {
                data.set("start", DateTime.fromFormat(start.value, dateFormat).toISO())
            }
            data.set("due", DateTime.fromFormat(due.value, dateFormat).toISO())
            console.log(data);
            const converted = Object.fromEntries(data.entries());
            console.log(converted);
            tasks.createTask(converted);
            // props.closeFn;
        }
        else {
            alerts.add("failure", "You must correct all errors before submitting")
        }
        // Call method to check if valid.
        // If valid, add to taskStore. This should wait for response and render any alerts
        // /errors and remove from store if it was invalid
        // If invalid, highlight incorrect portions and have error message above them.
    }

    return (
        <div id="new-wrapper">
            <section className="mid-section">
                <div className="title-button-wrapper">
                    <h2>New Task</h2>
                    <div className="aligned-buttons">
                        <button className="btn btn-red" title="Close" onClick={props.closeFn}>
                            <i className="fas fa-times fa-fw fa-2x"></i>
                        </button>
                    </div>
                </div>
                <form className="form" onSubmit={handleSubmit}>
                    <label>
                        Title
                        { title.errors.length ? errorsList(title.errors) : null }
                        <input
                            name="title"
                            className={title.errors.length ? "errors" : ""}
                            onChange={e => setTitle({value: e.target.value, errors: getErrors(e.target.name, e.target.value)})}
                            onBlur={e => setTitle({value: title.value, errors: getErrors(e.target.name, e.target.value)})}
                            value={title.value}
                            required
                        />
                    </label>
                    <label>
                        Description
                        { desc.errors.length ? errorsList(desc.errors) : null }
                        <textarea
                            name="description"
                            className={desc.errors.length ? "errors" : ""}
                            onChange={e => setDesc({value: e.target.value, errors: getErrors(e.target.name, e.target.value)})}
                            value={desc.value}
                        />
                    </label>
                    <div className="horizontal-align"> 
                        <label>
                            Start
                            { start.errors.length ? errorsList(start.errors) : null }
                            <div className="datetime-picker" id="datetime-picker-start" data-td-target-input="nearest" data-td-target-toggle='nearest'>
                                <input
                                    name="start"
                                    className={start.errors.length ? "errors" : ""}
                                    onChange={e => setStart({value: e.target.value, errors: start.errors})}
                                    onBlur={e => {
                                        setStart({value: start.value, errors: getErrors(e.target.name, e.target.value)});
                                        setDue({value: due.value, errors: getErrors("due", due.value)});
                                    }}
                                    value={start.value}
                                />
                            </div>
                        </label>
                        <label>
                            Due
                            { due.errors.length ? errorsList(due.errors) : null }
                            <div className="datetime-picker" id="datetime-picker-due" data-target-input="nearest">
                                <input 
                                    name="due"
                                    className={due.errors.length ? "errors" : ""}
                                    onChange={e => setDue({value: e.target.value, errors: due.errors})}
                                    onBlur={e => {
                                        setDue({value: due.value, errors: getErrors(e.target.name, e.target.value)});
                                        setStart({value: start.value, errors: getErrors("start", start.value)});
                                    }}
                                    value={due.value}
                                    required
                                />
                            </div>
                        </label>
                    </div>
                    <div 
                        id="add-btn" className="centered"
                    >
                        <input className="btn" value="Add task" type="submit" />
                    </div>
                </form>
            </section>
        </div>
    )
}

export default TaskCreatePopup;