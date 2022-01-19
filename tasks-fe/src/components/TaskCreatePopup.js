import { Fragment, useState, useEffect } from "react";
import { DateTime } from "luxon";
import pluralize from 'pluralize';
import '../static/css/new.css';
import '../static/css/datetimepicker.css';
import { useTaskStore } from "../store/StoreContext";
import {TempusDominus} from "@eonasdan/tempus-dominus";

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

const TimeDateLabel = (props) => {
    useEffect(() => {
        const options = {
            display: {
                components: {
                    calendar: false,
                    date: false, 
                    month: false,
                    year: false,
                    decades: false, 
                }
            },
            allowInputToggle: false
        }
        const startPicker = new TempusDominus(document.getElementById('datetime-picker-start'), options);
        return () => {
            // cleanup
        }
    }, [])

    // label, date, time, dateChangeCallBack, timeChangeCallBack, requiredDate
    return <label>
        {props.label.charAt(0).toUpperCase() + props.label.slice(1)}
        { props.stateObj.errors.length ? errorsList(props.stateObj.errors) : null }
        <div className="horizontal-align">
            <label className="date">
                Date
                <input
                    name={`${props.label} date`}
                    className={props.stateObj.errors.length ? "errors" : ""}
                    onChange={props.dateChangeCallback}
                    onBlur={props.dateBlurCallback}
                    value={props.stateObj.value}
                    required={props.requiredDate}
                    />
                </label>
            <label className="time">
                Time
                <div className="horizontal-align">
                    <input
                        name={`${props.label} time`}
                        id={`${props.label}-time`}
                        data-td-target={`#datetime-picker-${props.label}`}
                        className={props.stateObj.errors.length ? "errors" : ""}
                        onChange={props.timeChangeCallback}
                        onBlur={props.timeBlurCallback}
                        value={props.stateObj.value}
                        placeholder={props.timePlaceholder}
                    />
                    <button 
                        id={`datetime-picker-${props.label}`} 
                        data-td-target-input={`#${props.label}-time`} 
                        className="btn no-shadow datepicker-toggle" 
                        type="button"
                        >
                        <i className="far fa-clock fa-fw"></i>
                    </button>
                </div>
            </label>
        </div>
    </label>
}

const TaskCreatePopup = (props) => {
    const [title, setTitle] = useState({value: "", errors: []});
    const [desc, setDesc] = useState({value: "", errors: []});
    const [start, setStart] = useState({date: "", time: "", errors: []});
    const [due, setDue] = useState({date: "", time: "", errors: []});
    const tasks = useTaskStore();
    const dateFormat = "D";
    const timeFormat = "t";
    const dateTimeFormat = dateFormat + " " + timeFormat;

    useEffect(() => {
        const firstInput = document.querySelector("input[name='title']");
        firstInput.focus();
    }, [])

    const getSelector = (name, type) => {
        return `#new-wrapper ${type}[name='${name}']`;
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        var valid = true;
        var focusEle = null;

        const titleErrors = getErrors("title", title.value);
        if (titleErrors.length !== 0) {
            valid = false;
            setTitle({value: title.value, errors: titleErrors});
            focusEle = document.querySelector(getSelector('title', 'input'));
        }
        const descErrors = getErrors("description", desc.value);
        if (descErrors.length !== 0) {
            valid = false;
            setDesc({value: desc.value, errors: descErrors});
            if (!focusEle) {focusEle = document.querySelector(getSelector('description', 'textarea'))}
        }
        const startErrors = getErrors('start', start.date, start.time);
        if (startErrors.length !== 0) {
            valid = false;
            setStart({date: start.date, time: start.time, errors: startErrors});
            if (!focusEle) {focusEle = document.querySelector(getSelector('start date', 'input'))}
        }
        const dueErrors = getErrors('due', due.date, due.time);
        if (dueErrors.length !== 0) {
            valid = false;
            setDue({date: due.date, time: due.time, errors: dueErrors});
            if (!focusEle) {focusEle = document.querySelector(getSelector('due date', 'input'))}
        }

        if (valid) {
            const data = new FormData(event.target);
            // Don't input start time if there is no date
            if (start.date !== "") {
                data.set("start", DateTime.fromFormat(`${start.date} ${start.time === "" ? "12:00 AM" : start.time}`, dateTimeFormat).toISO())
            }
            data.set("due", DateTime.fromFormat(`${due.date} ${due.time === "" ? "11:59 PM" : due.time}`, dateTimeFormat).toISO())
            const converted = Object.fromEntries(data.entries());
            console.log(`${due.date}  ${due.time === "" ? "11:59 PM" : due.time}`)
            console.log(converted)
            tasks.createTask(converted);
            props.closeFn();
            return;
        }

        focusEle.focus();
    }

    const validTime = (date, time, errors) => {
        var parsedDate;
        var parsedTime;
        var validTime = true;
        parsedTime = DateTime.fromFormat(time, timeFormat);
        parsedDate = DateTime.fromFormat(date, dateFormat);
        if (parsedTime.invalid) {
            errors.push("Time is not of the format h:mm P");
            validTime = false;
        }
        if (parsedDate.invalid) {
            errors.push("Date is not of the format mm/dd/yyyy");
            validTime = false;
        }
        return validTime;
    }

    const getErrors = (name, value1, time = null) => {
        // Time format until we get parsing done: 8/6/2014 1:07 PM
        // Assume time is EOD if blank
        var time;

        const errors = [];
        var timeIsValid
        switch (name) {
            case 'title':
                if (value1.length > 100) { 
                    errors.push(`Title is ${pluralize("character", value1.length-100, true)} too long`);
                }
                else if (value1.length === 0) {
                    errors.push(`Title is required`);
                }
                break;
            case 'description':
                if (value1.length > 1000) { 
                    errors.push(`Description is ${pluralize("character", value1.length-1000, true)} too long`);
                }
                break;
            case 'start':
                if (value1 !== "") {
                    time = time === "" ? "12:00 AM" : time;
                    validTime(value1, time, errors);
                }
                break;
            case 'due':
                if (value1 === "") {
                    errors.push("Due date is required")
                }
                else {
                    time = time === "" ? "11:59 PM" : time;
                    timeIsValid = validTime(value1, time, errors);
                    if (start.value && timeIsValid && DateTime.fromFormat(start.date + " " + start.time, dateTimeFormat) >=  DateTime.fromFormat(value1 + " " + time)) {
                        errors.push('Due does not come after start')
                    }
                }
                break;
            default:
                console.error("Proper name was not supplied to getErrors()")
                break;
        } 
        return errors;
    }

    const startBlur = () => setStart({date: start.date, time: start.time, errors: getErrors("start", start.date, start.time)});
    const dueBlur = () => setDue({date: due.date, time: due.time, errors: getErrors("due", due.date, due.time)});

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
                <form id="add-task" className="form" onSubmit={handleSubmit}>
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
                    <div className="start-due-wrapper horizontal-align"> 
                        <TimeDateLabel 
                            label="start"
                            stateObj={start}
                            timePlaceholder="12:00 AM"
                            requiredDate={false}
                            dateChangeCallback={e => setStart({date: e.target.value, time: start.time, errors: start.errors})}
                            timeChangeCallback={e => setStart({date: start.date, time: e.target.value, errors: start.errors})}
                            dateBlurCallback={startBlur}
                            timeBlurCallback={startBlur}
                        />
                        <TimeDateLabel 
                            label="due"
                            stateObj={due}
                            timePlaceholder="11:59 PM"
                            requiredDate={true}
                            dateChangeCallback={e => setDue({date: e.target.value, time: due.time, errors: due.errors})}
                            timeChangeCallback={e => setDue({date: due.date, time: e.target.value, errors: due.errors})}
                            dateBlurCallback={dueBlur}
                            timeBlurCallback={dueBlur}
                        />
                    </div>
                    <div className="centered">
                        <button id="add-btn" className="btn not-square" type="submit" formNoValidate={true}>Add task</button>
                    </div>
                </form>
            </section>
        </div>
    )
}

export default TaskCreatePopup;