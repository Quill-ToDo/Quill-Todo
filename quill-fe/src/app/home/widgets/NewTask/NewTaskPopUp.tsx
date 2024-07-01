import { ChangeEvent, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import './NewTask.css';
import { makeDraggable } from "@/util/Draggable";
import { ICONS } from "@/util/constants";
import { ColorBubble, TaskTitle } from "@/widgets/TaskDetail/TaskComponents";
import { FormField } from "@util/FormComponents";
import { TaskModel } from "../../_globalStore/tasks/TaskModel";

const OUTER_WRAPPER_NAME = "new-wrapper";
const OUTER_WRAPPER_ID = `#${OUTER_WRAPPER_NAME}`;

/**
 * A form to create a new task. 
 * It surfaces and edits the editable fields of a task that has already been created 
 * and is marked as "beingCreated"
 * in TaskStore.
 */
export const AddNewTaskPopUp = observer(({close, taskToCreate}: 
    {
        close: () => void, 
        taskToCreate: TaskModel | null, 
    }) => {
    const formRef = useRef(null);

    useEffect(() => {
        const popup = document.querySelector(OUTER_WRAPPER_ID);
        popup && makeDraggable(popup as HTMLElement);
    }, [])


    return (!taskToCreate ? <></> : <div id={OUTER_WRAPPER_NAME} className="popup draggable">
            <div className="header-container draggable-handle">
                <h2 id="popup-title">New Task</h2>
                <div className="aligned end">
                    <button className="btn small square" title="Close" onClick={() => {
                        taskToCreate && taskToCreate.abortTaskCreation();
                        close();
                    }}>
                        { ICONS.X }
                    </button>
                </div>
            </div>
            <section className="mid-section" aria-labelledby="popup-title">
                <form 
                    id="add-taskToCreate" 
                    ref={formRef}
                    className="form"
                    onSubmit={(e) =>  {
                        e.preventDefault();
                        if (taskToCreate) { 
                            if (taskToCreate.isValid) {
                                taskToCreate.submitNewTask().then(((value) => {
                                    close();
                                })); 
                            }
                            else {
                                let focusEle = e.target.querySelector(`[aria-invalid="true"]`);
                                !!focusEle && focusEle.focus();
                            }
                        }
                    }}
                >
                    <div id="title-color">
                        <FormField 
                            name="Color"
                            required={true}
                            element={<ColorBubble task={taskToCreate} />}
                            />
                        <FormField
                            name="Title"
                            required={true}
                            element={<TaskTitle task={taskToCreate} editAllowed={true}/>}
                        />
                    </div>
                    <FormField 
                        name={`Description`}
                        required={false}
                        type={`textarea`}
                        inputProps={
                            { 
                                // TODO figure out what happens if I set this : required: true,
                                value: taskToCreate.description,
                                onChange: function (e: ChangeEvent) { e.target && taskToCreate.setDescription((e.target as HTMLTextAreaElement).value);}

                            }
                        }
                        errors={taskToCreate.validationErrors.description}
                    />
                    <div className={"start-due-wrapper horizontal-align"}> 
                        <div>
                            <div className={"horizontal-align"}>
                                <FormField 
                                    name={`Start Date`}
                                    required={false}
                                    inputProps={
                                        { 
                                            value: taskToCreate.startDateStringUnderEdit,
                                            onChange: function (e: ChangeEvent) { e.target && taskToCreate.setStartDateStringUnderEdit(e.target.value);}
                                        }
                                    }
                                    errors={taskToCreate.validationErrors.startDateStringUnderEdit}
                                />
                                <FormField 
                                    name={`Start Time`}
                                    required={false}
                                    inputProps={
                                        { 
                                            value: taskToCreate.startTimeStringUnderEdit,
                                            onChange: function (e: ChangeEvent) { e.target && taskToCreate.setStartTimeStringUnderEdit(e.target.value); }
            
                                        }
                                    }
                                    errors={taskToCreate.validationErrors.startTimeStringUnderEdit}
                                />
                            </div>
                        </div>
                        <div>
                            <div className={"horizontal-align"}>
                                <FormField 
                                    name={`Due Date`}
                                    required={false}
                                    inputProps={
                                        { 
                                            value: taskToCreate.dueDateStringUnderEdit,
                                            onChange: function (e: ChangeEvent) { e.target && taskToCreate.setDueDateStringUnderEdit(e.target.value); }
            
                                        }
                                    }
                                    errors={taskToCreate.validationErrors.due.concat(taskToCreate.validationErrors.workInterval, taskToCreate.validationErrors.dueDateStringUnderEdit)}
                                />
                                <FormField  
                                    name={`Due Time`}
                                    required={false}
                                    inputProps={
                                        { 
                                            value: taskToCreate.dueTimeStringUnderEdit,
                                            onChange: function (e: ChangeEvent) { e.target && taskToCreate.setDueTimeStringUnderEdit(e.target.value); }
            
                                        }
                                    }
                                    errors={ taskToCreate.validationErrors.dueTimeStringUnderEdit}
                                  
                                />
                            </div>
                        </div>
                    </div>
                    <div className="centered">
                        <button id="add-btn" className="btn large text" type="submit" formNoValidate={true}>Add</button>
                    </div>
                </form>
            </section>
        </div>
    )
})