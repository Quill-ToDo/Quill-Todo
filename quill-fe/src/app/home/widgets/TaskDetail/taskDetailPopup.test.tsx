import {
    logRoles,
    render,
    screen,
    within,
} from '@testing-library/react';
import {act} from 'react';
import { LIST_WIDGET_NAME, ListWidget } from '@/widgets/List/List';
import Home from "@/app/page";
import { MOCK_SERVER_HANDLER, testRoot, testTaskStore, testUser } from '@/app/__testing__/jest.setup.test';
import { TASK_DETAIL_POPUP_NAME } from './TaskDetail';
import { http, HttpResponse } from 'msw';
import { ERROR_TEXT } from '../Alerts/AlertWrapper';
import { PARTIAL_DATETIME_FORMATS } from '@/app/@util/DateTimeHelper';

const TASK_NAME = MOCK_SERVER_HANDLER.peekTasks()[0].title;
let list: HTMLElement;

beforeEach(async () => {
    await act(async () => {
        await render(<Home rootStore={testRoot} widgets={<ListWidget />} />);
    })
    expect (testTaskStore.isLoaded).toBeTruthy();
    list = await screen.findByRole("region", {name: LIST_WIDGET_NAME});
})

const getTaskDetailsPopup = async (passedTaskName?: string) => {
    const listTask = await within(list).findByText(passedTaskName ? passedTaskName : TASK_NAME);
    await act(async () => {
        await testUser.click(listTask);
    })
    const popup = await screen.findByRole("dialog", {name: TASK_DETAIL_POPUP_NAME });
    return popup;
}

it("should be able to open task details", async () => {
    const popup = await getTaskDetailsPopup(); 
    expect(popup).toBeInTheDocument();
});

it("should display task details on show", async () => {
    // Arrange
    const popup = await getTaskDetailsPopup();
    expect(popup).toBeInTheDocument();
    const task = MOCK_SERVER_HANDLER.tasks.find((task) => TASK_NAME === task.title); 
    expect(task).toBeDefined();
    const due = task.due;
    const start = task.start;
    // Assert
    // This task doesn't have a desc
    expect(within(popup).getByText("Task description"));
    expect(within(popup).getByText("Due")).toBeInTheDocument();
    expect(within(popup).getByText("Start")).toBeInTheDocument();
    // Validate that the dates are right
    logRoles(await screen.findByTestId("home"));
    expect(within(popup).getByDisplayValue(due.toLocaleString(PARTIAL_DATETIME_FORMATS.D.token))).toBeInTheDocument();
    expect(within(popup).getByText(start.toLocaleString(PARTIAL_DATETIME_FORMATS.D.token))).toBeInTheDocument();
    expect(within(popup).getAllByText(due.toLocaleString(PARTIAL_DATETIME_FORMATS.t.token))[0]).toBeInTheDocument();
    expect(within(popup).getAllByText(start.toLocaleString(PARTIAL_DATETIME_FORMATS.t.token))[0]).toBeInTheDocument();
});

describe("should be able to close details", () => {
    it("by clicking close button", async () => {
        // Arrange
        const popup = await getTaskDetailsPopup();
        expect(popup).toBeInTheDocument();
        const close = await within(popup).findByRole("button", {name: "Close"});
        // Act
        await act(async () => {
            await testUser.click(close);
        })
        // Assert
        expect(screen.queryByRole("dialog", {name: TASK_DETAIL_POPUP_NAME })).toBeNull();
    });

    it.todo("by clicking off of popup");

    it("via escape button", async () => {
        // Arrange
        const popup = await getTaskDetailsPopup();
        // Act
        await act(async () => {
            await testUser.keyboard('[Escape]');
        })
        // Assert
        expect(popup).not.toBeInTheDocument();
    });
})


it("should not close details via any other buttons", async () => {
    // Cant be sure this is working before the one above i working
    // Arrange
    const popup = await getTaskDetailsPopup();
    // Act
    await act(async () => {
        await testUser.keyboard('k');
        await testUser.keyboard('kgfjlfkd');
    })
    expect(popup).toBeInTheDocument();
});

it("should be able to mark tasks as complete from details and have it update in list", async () => {
    // Arrange
    const popup = await getTaskDetailsPopup();
    const checkbox = within(popup).getByRole("checkbox");
    // Act
    await act(async () => {
        await testUser.click(checkbox);
    })
    // Assert
    expect(checkbox).toBeChecked();
});

it("should be able to delete a task", async () => {
    // Arrange
    const taskName = "Delete me!";
    MOCK_SERVER_HANDLER.setup.addTask({
        title: taskName,
        due: MOCK_SERVER_HANDLER.date,
    });
    const popup = await getTaskDetailsPopup();
    // Act
    await act(async () => {
        await testUser.click(within(popup).getByRole("button", {name: "Delete task"}));
    })
    // Assert
    expect(popup).not.toBeInTheDocument();
    expect(within(list).queryByText(taskName)).toBeNull();
});


it.skip("should handle failure to delete task", async () => {
    // Arrange 
    // Won't work with fake timers :(
    if (MOCK_SERVER_HANDLER.server) {
        MOCK_SERVER_HANDLER.server.use(
            http.delete(MOCK_SERVER_HANDLER.API_URL+":id", () => {
                return new HttpResponse("Server error", { status: 500 },)
            }, { once: true }));
    }
    const popup = await getTaskDetailsPopup();
    const del = within(popup).findByRole("button", {name: "Delete task"});
    // Act
    await act(async () => {
        await testUser.click(del); 
    })
    // Should render an alert
    const alert = await screen.findByRole("alertdialog", {name: ERROR_TEXT});
    // const close = await screen.findByRole("button", {name: "Close"});
    // // This is extremely inconsistent... 
    // expect(close).toHaveFocus(); //To have focus isnt working
    await act(async () => {
        await testUser.keyboard("{Enter}");
    })
    // Task should still appear among other in the list, not deleted
    expect(within(list).findByText(TASK_NAME)).not.toBeNull();
    // Assert
    expect(alert).not.toBeInTheDocument();
})

describe("should be able to edit a task", () => {
    it.todo("edit title");
    it.todo("add title");
    it.todo("remove title");
    it.todo("add description");
    it.todo("remove description");
    it.todo("edit description");
});