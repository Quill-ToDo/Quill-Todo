import { ChangeEvent, FormEvent, Fragment, useEffect } from "react";
import { observer } from "mobx-react-lite";
import './NewTask.css';
import { makeDraggable } from "@/util/Draggable";
import { ICONS } from "@/util/constants";
import { ColorBubble } from "../TaskDetail/TaskComponents";
import { FormField, FormFieldParams, handleSubmit } from "@/app/@util/FormComponents";
import EditTaskModel from "./EditTaskModel";
const ERROR_ID_END = "-error-list";
const OUTER_WRAPPER_ID = "#new-wrapper";

// /**
//  * 
//  * A wrapper for time and date form formData.
//  * 
//  * @param {*} props
//  * @returns 
//  */
const TimeDateLabel = ({dateData, timeData}: {dateData: FormFieldParams, timeData: FormFieldParams}) => {
    const timeErrorListId = `${time.idPrefix}${ERROR_ID_END}`;
    const dateErrorListId = `${date.idPrefix}${ERROR_ID_END}`;
    return <div>
        <h3>{startOrDue}</h3>
        <div className={"horizontal-align"}>
            <FormField 
                {...dateData}
            />
            <label className={`${date.idPrefix} sublabel`}>
                {date.name}
                <input
                    id={`${date.idPrefix}-input`}
                    name={date.name}
                    onChange={date.change}
                    value={date.value}
                    aria-describedby={dateErrorListId}
                    aria-invalid={date.errorsForInvalidField.length !== 0}
                    />
            </label>
            <label className={`${time.idPrefix} sublabel`}>
                {time.name}
                <div className={"horizontal-align"}>
                    <input
                        id={`${time.idPrefix}-input`}
                        name={time.name}
                        onChange={time.change}
                        value={time.value}
                        aria-describedby={timeErrorListId}
                        aria-invalid={time.errorsForInvalidField.length !== 0}
                    />
                </div>
            </label>
        </div>
        <div className="horizontal-align">
            { date.errorsToDisplay&& date.errorsToDisplay.length ? ErrorsList(date.errorsToDisplay, dateErrorListId) : null }
            { time.errorsToDisplay&& time.errorsToDisplay.length ? ErrorsList(time.errorsToDisplay, timeErrorListId) : null }
        </div>
    </div>
}

/**
 * A form to create a new task. It works by editing the formData of a task that has already been created and is marked as being edited
 * in TaskStore.
 */
const NewTaskPopUp = observer((props) => {
    const taskToCreate = props.taskStore.taskBeingEdited;

    const formData: 
        {
            [index: string]: FormFieldParams,
            [index: number]: FormFieldParams,
            title: FormFieldParams, 
            desc: FormFieldParams, 
            startDate: FormFieldParams, 
            startTime: FormFieldParams, 
            dueDate: FormFieldParams, 
            dueTime: FormFieldParams, 
            workInterval: FormFieldParams, 
            color: FormFieldParams, 

        } = {
        title: {
            name: `Title`,
            outerWidgetId: OUTER_WRAPPER_ID,
            value: taskToCreate.title,
            labelClasses: `title`,
            errors: taskToCreate.validationErrors.title,
            onChange: function (e) {
                taskToCreate.setTitle(e.target.value);
            },
        },
        desc: {
            name: `Description`,
            type: `textarea`,
            outerWidgetId: OUTER_WRAPPER_ID,
            value: taskToCreate.description,
            errors: taskToCreate.validationErrors.description,
            onChange: function (e) {
                taskToCreate.setDescription(e.target.value);
            },
        },
        startDate: {
            name: `Start Date`,
            inputId: `${OUTER_WRAPPER_ID}-startDate`,
            value: taskToCreate.startDateString,
            errorsToDisplay: taskToCreate.validationErrors.startDateString.concat(taskToCreate.validationErrors.start),
            errorsForInvalidField: taskToCreate.validationErrors.startDateString.concat(taskToCreate.validationErrors.start).concat(taskToCreate.validationErrors.workInterval),

            selectorForFieldElement: function () { return getSelector(formData.startDate.name, 'input'); },
            change: function (e) {
                taskToCreate.setStartDateString(e.target.value);
            },
        },
        startTime: {
            name: `Start Time`,
            inputId: `${OUTER_WRAPPER_ID}-startTime`,
            value: taskToCreate.startTimeString,
            errorsToDisplay: taskToCreate.validationErrors.startTimeString,
            errorsForInvalidField: taskToCreate.validationErrors.startTimeString.concat(taskToCreate.validationErrors.workInterval),
            selectorForFieldElement: function () { return getSelector(formData.startTime.name, 'input'); },
            change: function (e) {
                taskToCreate.setStartTimeString(e.target.value);
            },
        },
        dueDate: {
            name: `Due Date`,
            inputId: `${OUTER_WRAPPER_ID}-dueDate`,
            value: taskToCreate.dueDateString,
            errorsToDisplay: taskToCreate.validationErrors.dueDateString.concat(taskToCreate.validationErrors.due),
            errorsForInvalidField: taskToCreate.validationErrors.dueDateString.concat(taskToCreate.validationErrors.due).concat(taskToCreate.validationErrors.workInterval),
            selectorForFieldElement:  function () { return getSelector(formData.dueDate.name, 'input'); },
            change: function (e) {
                taskToCreate.setDueDateString(e.target.value);
            },
        },
        dueTime: {
            name: `Due Time`,
            inputId: `${OUTER_WRAPPER_ID}-dueTime`,
            value: taskToCreate.dueTimeString,
            errorsToDisplay:  taskToCreate.validationErrors.dueTimeString,
            errorsForInvalidField: taskToCreate.validationErrors.dueTimeString.concat(taskToCreate.validationErrors.workInterval),
            selectorForFieldElement:  function () { return getSelector(formData.dueTime.name, 'input'); },
            change: function (e) {
                taskToCreate.setDueTimeString(e.target.value);
            },
        },
        // workInterval : {
        //     name: `Work Range`,
        //     inputId: `${OUTER_WRAPPER_ID}-startDate`,
        //     value: '',
        //     selectorForFieldElement: function () { return getSelector(formData.startDate.name, 'input'); },
        //     errorsToDisplay: taskToCreate.validationErrors.workInterval,
        //     errorsForInvalidField: taskToCreate.validationErrors.workInterval,
        // },
        color : {
            name: `Color`,
            required: true,
            value: taskToCreate.colorString,
            labelClasses: `color`,
            contentBeforeInput: <ColorBubble task={taskToCreate}/>,
            inputContentWrapperClasses: `color-label-wrapper`,
            errors: taskToCreate.validationErrors.color,
            onChange: function (e) {
                taskToCreate.setColorString(e.target.value);
            },
        }
    }

    useEffect(() => {
        makeDraggable(document.querySelector("#new-wrapper.popup"));
        const firstInput = document.querySelector(`input[name='${formData.title.name}']`);
        firstInput.focus();

        return () => {
            if (taskToCreate.beingEdited) {
                taskToCreate.abortEditing();
            }
        }
    }, [taskToCreate, formData.title.name])

    return (
        <div id="new-wrapper" className="popup draggable">
            <div className="header-container draggable-handle">
                <h2 id="popup-title">New Task</h2>
                <div className="aligned end">
                    <button className="btn small square btn-red" title="Close" onClick={() => {
                        taskToCreate.abortEditing();
                    }}>
                        { ICONS.X }
                    </button>
                </div>
            </div>
            <section className="mid-section" aria-labelledby="popup-title">
                <form id="add-task" className="form" onSubmit={(e) => handleSubmit({
                    outerWidgetId: OUTER_WRAPPER_ID,
                    submitEvent: e,
                    successCallback: () => taskToCreate.finishEditing(),
                    fieldData: formData, 
                })}>
                    <div id="title-color">
                        <FormField {...formData.title} />
                        <div className="color-label-wrapper">
                            <FormField {...formData.color} />
                        </div>
                    </div>
                    <label>
                        <FormField {...formData.desc}/>
                    </label>
                    <div className={"start-due-wrapper horizontal-align"}> 
                        {/* <TimeDateLabel 
                            label={"Start"}
                            date={formData.startDate}
                            time={formData.startTime}
                        />
                        <TimeDateLabel 
                            label={"Due"} 
                            date={formData.dueDate}
                            time={formData.dueTime}
                        /> */}
                    </div>
                    <div className="centered">
                        {/* { formData.workInterval.errorsToDisplay && formData.workInterval.errorsToDisplay && ErrorsList(formData.workInterval.errorsToDisplay, formData.workInterval.idPrefix)} */}
                        <button id="add-btn" className="btn large" type="submit" formNoValidate={true}>+</button>
                    </div>
                </form>
            </section>
        </div>
    )
})

export default NewTaskPopUp;