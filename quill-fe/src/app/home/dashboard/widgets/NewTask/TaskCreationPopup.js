import { Fragment, useEffect } from "react";
import { observer } from "mobx-react-lite";
import './new.css';
const ERROR_ID_END = "-error-list";

/**
 * @param {string[]} errors List of errors to display 
 * @returns Content of errors list. Separated from the list for performance.
 */
const ErrorsListContent = (errors) => {
    return errors.map((errorText) => {
        return <li key={"error-"+errorText}>
            {errorText}
        </li>
    })
}
/**
 * @param {string[]} errors List of errors to display 
 * @returns List of errors
 */
const ErrorsList = (errors, id) => {
    if (errors.length > 1) {
        return <Fragment> 
            <ul id={id} className="error-list" aria-live="polite">
                <ErrorsListContent errors={errors} />
            </ul>
        </Fragment>
    }
    else {
        return <p className="error-list">{errors[0]}</p>
    }
}
/**
 * 
 * A wrapper for time and date form fields.
 * 
 * ---
 * 
 * *Required props:*
 *  - **label** : string - Label that will be used in classes and IDs. "start" or "due" probably.
 *  - **date** : object - The date that will appear in the date form field
 *       - **name**: string - name of the field
 *       - **id**: string - to use for IDs
 *       - **value**: string - value of the field
 *       - **errors**: list<string> - errors of the field
 *       - **selector**: function () - returns string to use to select this element
 *       - **change**: function (e) - method to call on change
 *  - **time** : object - The time that will appear in the time form field
 *     - Same format as **date** above
 * @param {*} props
 * @returns 
 */
const TimeDateLabel = (props) => {
    const startOrDue = props.label;
    const date = props.date;
    const time = props.time;
    const timeErrorListId = `${time.id}${ERROR_ID_END}`;
    const dateErrorListId = `${date.id}${ERROR_ID_END}`;
    return <div>
        <h3>{startOrDue}</h3>
        <div className={"horizontal-align"}>
            <label className={date.idPrefix}>
                {date.name}
                <input
                    id={`${date.idPrefix}-input`}
                    name={date.name}
                    onChange={date.change}
                    value={date.value}
                    aria-describedby={dateErrorListId}
                    />
            </label>
            <label className={time.id}>
                {time.name}
                <div className={"horizontal-align"}>
                    <input
                        id={`${time.id}-input`}
                        name={time.name}
                        onChange={time.change}
                        value={time.value}
                        aria-describedby={timeErrorListId}
                    />
                </div>
            </label>
        </div>
        <div className="horizontal-align">
        { date.errors && date.errors.length ? ErrorsList(date.errors, dateErrorListId) : null }
        { time.errors && time.errors.length ? ErrorsList(time.errors, timeErrorListId) : null }
        </div>
    </div>
}

const checkRemoveErrorOutline = (fieldInfo) => {
    // TODO: Need to make it so that calling this gets the most recent changes from task. Need to get the new
    // Validation errors after they are set.
    const elem = document.querySelector(fieldInfo.selector());
    if (elem.hasAttribute("aria-invalid") && fieldInfo.errors.length) {
        elem.setAttribute("aria-invalid", "false");
    }
}

/**
 * A form to create a new task. It works by editing the fields of a task that has already been created and is marked as being edited
 * in TaskStore.
 */
const TaskCreatePopup = observer((props) => {
    /**
     * @param {string} name Name of DOM element
     * @param {string} type DOM element type
     * @returns A selector string for an element with #new-wrapper with type type and name name.
     */
    const getSelector = (name, type) => {
        return `#new-wrapper ${type}[name='${name}']`;
    }
    /**
     * Handle submission of the form. Validates that the task does not have any errors. If it does, it moves focus to the first field in the form
     * with errors. Otherwise, the task is saved to the DB.
     * 
     * @param {SubmitEvent} event
     * @param {Task} taskToCreate 
     * @returns
     */
    const handleSubmit = (event, taskToCreate, possibleInputs) => {
        event.preventDefault();
        let focusEle = null;

        // Get element with errors to switch focus to
        for (const name in possibleInputs) {
            const field = possibleInputs[name];
            const elem = document.querySelector(field.selector());
            if (field.errors.length) {
                if (!focusEle) {
                    focusEle = elem;
                }
                elem.setAttribute("aria-invalid", "true");
            }
            else {
                elem.setAttribute("aria-invalid", "false");
            }
        }

        if (!focusEle) {
            // Valid 
            taskToCreate.finishEditing();
            return;
        }

        focusEle.focus();
    }
    const taskToCreate = props.taskStore.taskBeingEdited;

    const fields = {
        title: {
            name: `Title`,
            idPrefix: `title`,
            value: taskToCreate.title,
            errors: taskToCreate.validationErrors.title,
            selector: function () { return getSelector(fields.title.name, 'input'); },
            change: function (e) {
                taskToCreate.setTitle(e.target.value);
                checkRemoveErrorOutline(fields.title);
            },
        },
        desc: {
            name: `Description`,
            idPrefix: `desc`,
            value: taskToCreate.description,
            errors: taskToCreate.validationErrors.description,
            selector: function () { return getSelector(fields.desc.name, 'textarea'); },
            change: function (e) {
                taskToCreate.setDescription(e.target.value);
                checkRemoveErrorOutline(fields.desc);
            },
        },
        startDate: {
            name: `Start Date`,
            idPrefix: `startDate`,
            value: taskToCreate.startDateStringBeingEdited,
            errors: taskToCreate.validationErrors.startDateString,
            selector: function () { return getSelector(fields.startDate.name, 'input'); },
            change: function (e) {
                taskToCreate.setStartDateString(e.target.value);
                checkRemoveErrorOutline(fields.startDate);
            },
        },
        startTime: {
            name: `Start Time`,
            idPrefix: `startTime`,
            value: taskToCreate.startTimeStringBeingEdited,
            errors: taskToCreate.validationErrors.startTimeString,
            selector: function () { return getSelector(fields.startTime.name, 'input'); },
            change: function (e) {
                taskToCreate.setStartTimeString(e.target.value);
                checkRemoveErrorOutline(fields.startTime);
            },
        },
        dueDate: {
            name: `Due Date`,
            idPrefix: `dueDate`,
            value: taskToCreate.dueDateStringBeingEdited,
            errors: taskToCreate.validationErrors.dueDateString,
            selector:  function () { return getSelector(fields.dueDate.name, 'input'); },
            change: function (e) {
                taskToCreate.setDueDateString(e.target.value);
                checkRemoveErrorOutline(fields.dueDate);
            },
        },
        dueTime: {
            name: `Due Time`,
            idPrefix: `dueTime`,
            value: taskToCreate.dueTimeStringBeingEdited,
            errors:  taskToCreate.validationErrors.dueTimeString,
            selector:  function () { return getSelector(fields.dueTime.name, 'input'); },
            change: function (e) {
                taskToCreate.setDueTimeString(e.target.value);
                checkRemoveErrorOutline(fields.dueTime);
            },
        },
        workInterval : {
            name: `Work Range`,
            idPrefix: 'dateRange',
            value: '',
            selector: function () { return getSelector(fields.startDate.name, 'input'); },
            errors:  taskToCreate.validationErrors.workInterval,
        }
    }

    useEffect(() => {
        const firstInput = document.querySelector(`input[name='${fields.title.name}']`);
        firstInput.focus();

        return () => {
            if (taskToCreate.beingEdited) {
                taskToCreate.abortEditing();
            }
        }
    }, [taskToCreate, fields.title.name])

    return (
        <div id="new-wrapper">
            <section className="mid-section" aria-labelledby="popup-title">
                <div className="title-button-wrapper">
                    <h2 id="popup-title">New Task</h2>
                    <div className="aligned-buttons">
                        <button className="btn btn-red" title="Close" onClick={() => {
                            taskToCreate.abortEditing();
                        }}>
                            <i className="fas fa-times fa-fw fa-2x"></i>
                        </button>
                    </div>
                </div>
                <form id="add-task" className="form" onSubmit={(e) => handleSubmit(e, taskToCreate, fields)}>
                    <label>
                        Title
                        <input
                            name={fields.title.name}
                            onChange={fields.title.change}
                            value={fields.title.value}
                            aria-describedby={fields.title.idPrefix}
                            required
                            />
                    </label>
                    { fields.title.errors.length ? ErrorsList(fields.title.errors, fields.title.idPrefix) : null }
                    <label>
                        Description
                        <textarea
                            name={fields.desc.name}
                            onChange={fields.desc.change}
                            value={fields.desc.value}
                            aria-describedby={fields.desc.idPrefix}
                        />
                    </label>
                    { fields.desc.errors.length ? ErrorsList(fields.desc.errors, fields.desc.idPrefix) : null }
                    <div className={"start-due-wrapper horizontal-align"}> 
                        <TimeDateLabel 
                            label={"Start"}
                            date={fields.startDate}
                            time={fields.startTime}
                        />
                        <TimeDateLabel 
                            label={"Due"} 
                            date={fields.dueDate}
                            time={fields.dueTime}
                        />
                    </div>
                    <div className="centered">
                        { fields.workInterval.errors && fields.workInterval.errors.length ? ErrorsList(fields.workInterval.errors, fields.workInterval.idPrefix) : null }
                        <button id="add-btn" className="btn not-square" type="submit" formNoValidate={true}>+</button>
                    </div>
                </form>
            </section>
        </div>
    )
})

export default TaskCreatePopup;