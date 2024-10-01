import {
    logRoles,
    render,
    screen,
    within
} from '@testing-library/react';
import {act,} from 'react';
import QuillContext from "@/app/page";
import { AddNewTaskPopUp, NEW_TASK_POPUP_TITLE } from './NewTaskPopUp';
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH, TaskModel } from '@/store/tasks/TaskModel';
import { ERROR_TEXT } from '../Alerts/AlertWrapper';
import { ADD_BUTTON_TEXT } from './NewTaskPopUp';
import '@testing-library/jest-dom';
import { BASE_DATE, testTaskStore, testUser } from '@/testing/jest.setup';
import { DATETIME_FORMATS, PARTIAL_DATETIME_FORMATS } from '@/app/@util/DateTimeHelper';
import { NEW_TASK_TEXT } from '../../dashboardLayout';

const selectors = {
    title: (popup: HTMLElement) => within(popup).getByRole("textbox", {name: "Title", exact: false}),
    desc: (popup: HTMLElement) => within(popup).getByRole("textbox", {name: "Description", exact: false}),
    startDate: (popup: HTMLElement) => within(popup).getByRole("textbox", {name: "Start Date", exact: false}),
    startTime: (popup: HTMLElement) => within(popup).getByRole("textbox", {name: "Start Time", exact: false}),
    dueDate: (popup: HTMLElement) => within(popup).getByRole("textbox", {name: "Due Date", exact: false}),
    dueTime: (popup: HTMLElement) => within(popup).getByRole("textbox", {name: "Due Time", exact: false}),
    dueTimepicker: (popup: HTMLElement) => within(popup).getByRole("button", {name: "Choose Due time", exact: false})
}

const getPopup = async () => await screen.findByRole("region", {name: NEW_TASK_POPUP_TITLE});

let task: TaskModel;
let 
    popup: HTMLElement, 
    titleBox: HTMLElement,
    descriptionBox: HTMLElement,
    dueTimeBox: HTMLElement, 
    dueDateBox: HTMLElement, 
    startDateBox: HTMLElement,
    startTimeBox: HTMLElement; 

beforeEach(async () => {
    task = testTaskStore.createNewTask();
    const close = () => {};
    await act(async () => {
        render(<AddNewTaskPopUp taskToCreate={task} close={close}/>);
    })
    popup = await getPopup();
    titleBox = selectors.title(popup);
    descriptionBox = selectors.desc(popup);
    dueDateBox = selectors.dueDate(popup);
    dueTimeBox = selectors.dueTime(popup);
    startDateBox = selectors.startDate(popup);
    startTimeBox = selectors.startTime(popup);
})

const renderPopupInFullApp = async () => {
    await act(async () => {
        render(<QuillContext widgets={[]}/>);
    })
    const addBtn = await screen.findByRole('menuitem', {name: NEW_TASK_TEXT});
    expect(addBtn).toBeDefined();
    await act(async () => {
        await testUser.click(addBtn);
    })
    expect(await getPopup()).not.toBeUndefined();
}

const typeInInput = async (input: HTMLElement, text: string) => {
    await act (async () => {
        testUser.clear(input);
        await testUser.type(input, text);
    })
    expect(input).toHaveValue(text);
}

const submitPopup = async (passedPopup?: HTMLElement) => {
    const element = passedPopup ? passedPopup : popup;
    const submit = await within(element).findByRole("button", {name: ADD_BUTTON_TEXT});
    expect(submit).toBeDefined();
    await act(async () => {
        await testUser.click(submit);
    })
}

const expectValidSubmission = async () => {
    expect(task.isValid && !task.isNewAndUnsubmitted).toBeTruthy();
    // TODO: expect close to have been called
}

const expectInvalidSubmission = async ({errors, passedTask}: {errors?: string[], passedTask?: TaskModel}={}) => {
    const taskToUse = passedTask ? passedTask : task;
    expect(!taskToUse.isValid && taskToUse.isNewAndUnsubmitted).toBeTruthy();
    if (errors) {
        expect(errors.length > 0).toBeTruthy()
        errors.forEach(async (error) => {
            await within(popup).findByText(error);
        })
    }
    // TODO expect close not to have been called
}


it("should show a task-creation popup when users click the add button", async () => {
    await renderPopupInFullApp();
})

it("should show an error alert when the popup cannot be submitted", async () => {
    // Arrange
    const badDate = "ding dong";
    await renderPopupInFullApp();
    const popupInFullApp = await getPopup(); 
    const dueDateInFullApp = selectors.dueDate(popupInFullApp);
    // Act
    await typeInInput(dueDateInFullApp, badDate);
    await submitPopup(popupInFullApp);
    // Assert
    expect(await getPopup()).toBeInTheDocument();
    screen.logTestingPlaygroundURL()
    // TODO Why is this binch not here?
    expect(await screen.findByRole("alertdialog", {name: ERROR_TEXT})).toBeInTheDocument();
})

describe("should allow the user to create a new task", () => {
    it("with nothing specified", async () => {
        // Arrange
        const t = "My task";

        // Act
        await submitPopup();
        // Assert
        expectValidSubmission();
    })

    it("with only a title specified", async () => {
        // Arrange
        const t = "My task";
        // Act
        await typeInInput(titleBox, t);
        await submitPopup();
        // Assert
        expectValidSubmission();
    })

    it("with a valid description", async () => {
        // Arrange
        const d = "This is my task! Hopefully it has a description."
        // Act
        await typeInInput(descriptionBox, d);
        await submitPopup();
        // Assert
        expectValidSubmission();
    })
    
    it("with a valid due date specified", async () => {
        // Arrange
        const newDate = `${BASE_DATE.plus({days: 1}).toLocaleString(PARTIAL_DATETIME_FORMATS.D.token)}`;
        // Act
        await typeInInput(dueDateBox, newDate);
        await submitPopup();
        // Assert
        expectValidSubmission();
    })

    it("with a valid due time typed in", async () => {
        // Arrange
        const newTime = `${BASE_DATE.plus({hours: 1}).toLocaleString(PARTIAL_DATETIME_FORMATS.t.token)}`;
        // Act
        await typeInInput(dueTimeBox, newTime);
        await submitPopup();
        // Assert
        expectValidSubmission();
    })

    it("with a valid start date specified", async () => {
        // Arrange
        const newDate = `${BASE_DATE.minus({weeks: 1}).toLocaleString(PARTIAL_DATETIME_FORMATS.D.token)}`;
        // Act
        await typeInInput(startDateBox, newDate);
        await submitPopup();
        // Assert
        expectValidSubmission();
    })

    it("with a valid start time specified", async () => {
        // Arrange
        const newTime = `${BASE_DATE.minus({hours: 1}).toLocaleString(PARTIAL_DATETIME_FORMATS.t.token)}`;
        // Act
        await typeInInput(startTimeBox, newTime);
        await submitPopup();
        // Assert
        expectValidSubmission();
    })

    // it.todo("with a valid datetime chosen from the calendar")
    // it.todo("with a valid start time chosen from the timepicker")
})

describe("should not allow the user to create a new task", () => {
    it.todo("with an ill-formatted color")

    it("with a title too long", async () => {
        // Arrange
        let t = "Too long!Too long!Too long!Too long!Too long!";
        let tooLong = t.padEnd(MAX_TITLE_LENGTH+1, t);
        // Act
        await typeInInput(titleBox, tooLong);
        await submitPopup();
        // Assert
        expect(titleBox).toHaveFocus();
        expectInvalidSubmission({errors: task.validationErrors.title});
    })

    it.skip("with a description too long", async () => {
        // Arrange
        let d = "Too long!Too long!Too long!Too long!Too long!";
        let tooLong = d.padEnd(MAX_DESCRIPTION_LENGTH+1, d);
        // Act
        // This times out :(
        await typeInInput(descriptionBox, tooLong);
        await submitPopup();
        // Assert
        expect(descriptionBox).toHaveFocus();
        expectInvalidSubmission({errors: task.validationErrors.description});
    }, 10000)

    it("with a start date after due date", async () => {
        // Arrange
        const newDate = `${BASE_DATE.plus({days: 2}).toLocaleString(PARTIAL_DATETIME_FORMATS.D.token)}`;
        // Act
        await typeInInput(startDateBox, newDate);
        await submitPopup();
        // Assert
        expectInvalidSubmission({errors: task.validationErrors.workInterval});
    })

    it("with a start time after due time", async () => {
        // Arrange
        const newStartTime = `${BASE_DATE.plus({hours: 4}).toLocaleString(PARTIAL_DATETIME_FORMATS.t.token)}`;
        const newDueTime = `${BASE_DATE.plus({hours: 3}).toLocaleString(PARTIAL_DATETIME_FORMATS.t.token)}`;
        // Act
        await typeInInput(startTimeBox, newStartTime);
        await typeInInput(dueTimeBox, newDueTime);
        await submitPopup();
        // Assert
        expectInvalidSubmission({errors: task.validationErrors.workInterval});
    })
    
    interface InnerFieldData {
        getItem: () => HTMLElement, 
        getErrors: () => string[],
    }
    describe.each([
        {
            name: "due",
            date: {
                getItem: () => dueDateBox,
                getErrors: () => task.validationErrors.dueDateStringUnderEdit,
            },
            time: {
                getItem: () => dueTimeBox,
                getErrors: () => task.validationErrors.dueTimeStringUnderEdit,
            },
        }, {
            name: "start",
            date: {
                getItem: () => startDateBox,
                getErrors: () => task.validationErrors.startDateStringUnderEdit,
            },
            time: {
                getItem: () => startTimeBox,
                getErrors: () => task.validationErrors.startTimeStringUnderEdit,
            }
        }])('with an ill-formatted $name', (dateData: {name: string, date: InnerFieldData, time: InnerFieldData }) => {
            it("date", async () => {
                // Arrange
                const invalidDate = "this is not a date!";
                const element = dateData.date.getItem();
                // Act
                await typeInInput(element, invalidDate);
                await submitPopup();
                // Assert
                expect(element).toHaveFocus();
                expectInvalidSubmission({errors: dateData.date.getErrors()});
            })
            it("time", async () => {
                // Arrange
                const invalidTime = "this is not a time!";
                const element = dateData.time.getItem();
                // Act
                await typeInInput(element, invalidTime);
                await submitPopup();
                // Assert
                expect(element).toHaveFocus();
                expectInvalidSubmission({errors: dateData.time.getErrors()});
            })
    })
})