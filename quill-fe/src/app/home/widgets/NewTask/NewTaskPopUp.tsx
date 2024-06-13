import { ChangeEvent, FormEvent, Fragment, useEffect } from "react";
import { observer } from "mobx-react-lite";
import './NewTask.css';
import { makeDraggable } from "@/util/Draggable";
import { ICONS } from "@/util/constants";
import { ColorBubble } from "@/widgets/TaskDetail/TaskComponents";
import { ErrorsList, FormField, FormFieldParams, handleSubmit } from "@util/FormComponents";
import TaskStore from "@/store/tasks/TaskStore";
import { FloatingPortal } from "@floating-ui/react";

const OUTER_WRAPPER_NAME = "new-wrapper";
const OUTER_WRAPPER_ID = `#${OUTER_WRAPPER_NAME}`;

/**
 * A form to create a new task. It works by editing the formData of a task that has already been created and is marked as being edited
 * in TaskStore.
 */
const AddNewTaskPopUp = observer(({taskStore, addNewTaskFloatStyles, addNewTaskFloatRefs, addNewTaskFloatContext}: 
    {
        taskStore: TaskStore, 
        addNewTaskFloatStyles?: {}, 
        addNewTaskFloatRefs?: any
        addNewTaskFloatContext?: any,   
    }) => {
    const taskToCreate = taskStore.taskBeingEdited;
    if (!taskToCreate) { return; }
    
    const formData: {
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
            value: taskToCreate.title,
            onChange: function (e) { e.target && taskToCreate.setTitle(e.target.value); },
            labelClasses: `title`,
            errors: taskToCreate.validationErrors.title,
            outerWidgetId: OUTER_WRAPPER_NAME
        },
        desc: {
            name: `Description`,
            type: `textarea`,
            value: taskToCreate.description,
            errors: taskToCreate.validationErrors.description,
            onChange: function (e) { e.target && taskToCreate.setDescription(e.target.value); },
            outerWidgetId: OUTER_WRAPPER_NAME,
        },
        startDate: {
            name: `Start Date`,
            value: taskToCreate.startDateString,
            errors: taskToCreate.validationErrors.startDateString,
            onChange: function (e) { e.target && taskToCreate.setStartDateString(e.target.value); },
            outerWidgetId: OUTER_WRAPPER_NAME,
        },
        startTime: {
            name: `Start Time`,
            value: taskToCreate.startTimeString,
            errors: taskToCreate.validationErrors.startTimeString,
            onChange: function (e) { e.target && taskToCreate.setStartTimeString(e.target.value); },
            outerWidgetId: OUTER_WRAPPER_NAME,
        },
        dueDate: {
            name: `Due Date`,
            value: taskToCreate.dueDateString,
            errors: taskToCreate.validationErrors.due,
            onChange: function (e) { e.target && taskToCreate.setDueDateString(e.target.value); },
            outerWidgetId: OUTER_WRAPPER_NAME,
        },
        dueTime: {
            name: `Due Time`,
            value: taskToCreate.dueTimeString,
            errors:  taskToCreate.validationErrors.dueTimeString,
            onChange: function (e) { e.target && taskToCreate.setDueTimeString(e.target.value); },
            outerWidgetId: OUTER_WRAPPER_NAME,
        },
        workInterval: {
            name: `Work Range`,
            value: '',
            errors: taskToCreate.validationErrors.workInterval,
            onChange: (e) => {},
            outerWidgetId: OUTER_WRAPPER_NAME,
        },
        color: {
            name: `Color`,
            required: true,
            value: taskToCreate.colorString,
            labelClasses: `color`,
            contentBeforeInput: <ColorBubble task={taskToCreate}/>,
            inputContentWrapperClasses: `color-label-wrapper`,
            errors: taskToCreate.validationErrors.color,
            onChange: function (e) { e.target && taskToCreate.setColorString(e.target.value); },
            outerWidgetId: OUTER_WRAPPER_NAME,
        }
    }

    useEffect(() => {
        const popup = document.querySelector(OUTER_WRAPPER_ID);
        popup && makeDraggable(popup);
        const firstInput = document.querySelector(`input[name='${formData[Object.keys(formData)[0]].name}']`) as HTMLElement;
        firstInput && firstInput.focus();
        
        return () => {
            // if (taskStore.taskBeingEdited) {
            //     taskToCreate.abortEditing();
            // }
        }
    }, [])


    return (
        <div id={OUTER_WRAPPER_NAME} ref={addNewTaskFloatRefs && addNewTaskFloatRefs.setFloating} style={addNewTaskFloatStyles && addNewTaskFloatStyles} className="popup draggable">
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
                    <FormField {...formData.desc}/>
                    <div className={"start-due-wrapper horizontal-align"}> 
                        <div>
                            <h3>Start</h3>
                            <div className={"horizontal-align sublabel"}>
                                <FormField {...formData.startDate} />
                                <FormField {...formData.startTime} />
                            </div>
                        </div>
                        <div>
                            <h3>Due</h3>
                            <div className={"horizontal-align sublabel"}>
                                <FormField {...formData.dueDate} />
                                <FormField {...formData.dueTime} />
                            </div>
                        </div>
                    </div>
                    <div className="centered">
                        { formData.workInterval.errors && ErrorsList({errors: formData.workInterval.errors, errorListId: formData.workInterval.idPrefix})}
                        <button id="add-btn" className="btn large" type="submit" formNoValidate={true}>+</button>
                    </div>
                </form>
            </section>
        </div>
    )
})

export default AddNewTaskPopUp;