import { Fragment, useState, useEffect, useReducer } from "react";
import { DateTime } from "luxon";
import pluralize from 'pluralize';
import '../static/css/new.css';
import '../static/css/datetimepicker.css';
import { useTaskStore } from "../store/StoreContext";
import { TempusDominus, Namespace } from "@eonasdan/tempus-dominus";


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
                    value={props.stateObj.date}
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
                        value={props.stateObj.time}
                        placeholder={props.timePlaceholder}
                    />
                    <button 
                        id={`datetime-picker-${props.label}`} 
                        data-td-target-input={`#${props.label}-time`} 
                        data-td-toggle={`#${props.label}-time`} 
                        className="btn no-shadow datepicker-toggle" 
                        type="button"
                        title="Choose time"
                        >
                        <i className="far fa-clock fa-fw"></i>
                    </button>
                </div>
            </label>
        </div>
    </label>
}

const dateReducer = (state, action) => {
    switch (action.type) {
        case 'setErrors':
            return {...state, errors: action.data};
        case 'setDate':
            return {...state, date: action.data};
        case 'setTime':
            return {...state, time: action.data};
        default:
            throw new Error();
    }
}

const TaskCreatePopup = (props) => {
    const [title, setTitle] = useState({value: "", errors: []});
    const [desc, setDesc] = useState({value: "", errors: []});
    const [start, dispatchStart] = useReducer(dateReducer, {date: "", time: "", errors: []});
    const [due, dispatchDue] = useReducer(dateReducer, {date: "", time: "", errors: []});
    const tasks = useTaskStore();
    const defaultDueTime = "11:59 PM";
    const defaultStartTime = "12:00 AM";
    const dateFormat = "D";
    const timeFormat = "t";
    const dateTimeFormat = dateFormat + " " + timeFormat;

    useEffect(() => {
        const firstInput = document.querySelector("input[name='title']");
        firstInput.focus();
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
            container: document.getElementById("root")
        }
        const startPicker = new TempusDominus(document.getElementById('datetime-picker-start'), {...options, defaultDate: new Date (DateTime.now().set({hour: 0, minute: 0, second: 0}).toMillis())});
        const startSubscriptions = startPicker.subscribe(
            [ Namespace.events.change],
            [
                (e) => {
                    const time = DateTime.fromMillis(e.date.getTime()).toFormat(timeFormat);
                    dispatchStart({type:"setTime", data: time});
                }
            ]
        );
        const duePicker = new TempusDominus(document.getElementById('datetime-picker-due'), {...options, defaultDate: new Date (DateTime.now().set({hour: 23, minute: 59, second: 59}).toMillis())});
        const dueSubscriptions = duePicker.subscribe(
            [ Namespace.events.change],
            [
                (e) => {
                    const time = DateTime.fromMillis(e.date.getTime()).toFormat(timeFormat);
                    dispatchDue({type:"setTime", data: time});
                }
            ]
        );

        return () => {
            startSubscriptions.unsubscribe();
            startPicker.dispose();
            dueSubscriptions.unsubscribe();
            duePicker.dispose();
        }
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
            dispatchStart({type: "setErrors", data: startErrors});
            if (!focusEle) {focusEle = document.querySelector(getSelector('start date', 'input'))}
        }
        const dueErrors = getErrors('due', due.date, due.time);
        if (dueErrors.length !== 0) {
            valid = false;
            dispatchDue({type: "setErrors", data: dueErrors});
            if (!focusEle) {focusEle = document.querySelector(getSelector('due date', 'input'))}
        }

        if (valid) {
            const data = new FormData(event.target);
            // Don't input start time if there is no date
            if (start.date !== "") {
                data.set("start", DateTime.fromFormat(`${start.date} ${start.time === "" ? defaultStartTime : start.time}`, dateTimeFormat).toISO())
            }
            data.set("due", DateTime.fromFormat(`${due.date} ${due.time === "" ? defaultDueTime : due.time}`, dateTimeFormat).toISO());
            data.delete("due date");
            data.delete("due time");
            data.delete("start date");
            data.delete("start time");
            const converted = Object.fromEntries(data.entries());
            console.log(converted)
            tasks.createTask(converted);
            props.closeFn();
            return;
        }

        focusEle.focus();
    }

    const validTime = (date, time, errors) => {
        var parsedDate = DateTime.fromFormat(date, dateFormat);
        var parsedTime = DateTime.fromFormat(time, timeFormat);
        var validTime = true;
        
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
                    time = time === "" ? defaultStartTime : time;
                    validTime(value1, time, errors);
                }
                break;
            case 'due':
                if (value1 === "") {
                    errors.push("Due date is required")
                }
                else {
                    time = time === "" ? defaultDueTime : time;
                    const startTime = start.time === "" ? defaultStartTime : start.time;
                    timeIsValid = validTime(value1, time, errors);
                    if (start.date && timeIsValid && DateTime.fromFormat(start.date + " " + startTime, dateTimeFormat) >=  DateTime.fromFormat(value1 + " " + time, dateTimeFormat)) {
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

    const startBlur = () => dispatchStart({type: "setErrors", data: getErrors("start", start.date, start.time)});
    const dueBlur = () => dispatchDue({type: "setErrors", data: getErrors("due", due.date, due.time)});

    return (
        <div id="new-wrapper">
            <section className="mid-section" aria-labelledby="popup-title">
                <div className="title-button-wrapper">
                    <h2 id="popup-title">New Task</h2>
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
                            timePlaceholder={defaultStartTime}
                            requiredDate={false}
                            dateChangeCallback={e => dispatchStart({type: "setDate", data: e.target.value})}
                            timeChangeCallback={e => dispatchStart({type: "setTime", data: e.target.value})}
                            dateBlurCallback={startBlur}
                            timeBlurCallback={startBlur}
                        />
                        <TimeDateLabel 
                            label="due"
                            stateObj={due}
                            timePlaceholder={defaultDueTime}
                            requiredDate={true}
                            dateChangeCallback={e => dispatchDue({type:"setDate", data: e.target.value})}
                            timeChangeCallback={e => dispatchDue({type: "setTime", data: e.target.value})}
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