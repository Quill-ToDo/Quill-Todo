import {LIST_WIDGET_NAME, ListWidget, OVERDUE, TODAY, UPCOMING} from "./List";
import { DateTime, } from 'luxon';
import {
    render,
    screen,
    within,
    waitFor,
    logRoles,
} from '@testing-library/react';
import {act} from 'react';
import { testTaskStore, MOCK_SERVER_HANDLER, BASE_DATE, testUser } from "@/app/__testing__/jest.setup.test";
import { PARTIAL_DATETIME_FORMATS } from "@/app/@util/DateTimeHelper";

const TASK_NAME = MOCK_SERVER_HANDLER.peekTasks()[0].title;

beforeEach(() => {
    render(<ListWidget passedStore={testTaskStore}/>);
})

it("should render the list component", () => {
    expect(screen.getByRole("region", {name:LIST_WIDGET_NAME})).toBeInTheDocument();
})

it("should show a loading message before tasks are loaded", async () => {
    // Arrange
    // Act
    await act(async () => {
        testTaskStore.setIsLoaded(false);
    })
    // Assert
    expect(testTaskStore.isLoaded).toBeFalsy();
    expect(screen.getByRole("region", {name:LIST_WIDGET_NAME}))
    .toHaveTextContent(/loading/i);
})

it("should show loaded tasks in the list", async () => {
    // Arrange
    // Act
    await act(async () => {
        await testTaskStore.loadTasks();
        expect(testTaskStore.isLoaded).toBeTruthy();
    })
    const list = screen.getByRole("region", {name: OVERDUE}); 
    // Assert
    expect(within(list).getAllByRole('button', { name: TASK_NAME })).not.toBeNull();
})

it("should show a message on the list if no tasks are present", async () => {
    // Arrange
    MOCK_SERVER_HANDLER.setup.setTasks([]);
    // Act
    await act(async () => {
        await testTaskStore.loadTasks();
        expect(testTaskStore.isLoaded).toBeTruthy();
    })
    // Assert
    expect(testTaskStore.tasks.length === 0).toBeTruthy();
    expect(await screen.findByText("You have no tasks to work on. Try adding one!")).not.toBeNull();
})

it("should show the correct time and date in the list", async () => {
    // Arrange
    const list = await screen.findByRole("region", {name: LIST_WIDGET_NAME});
    await act(async () => {
        await testTaskStore.loadTasks();
    })
    logRoles(list);
    const listTaskLink = await within(list).findByRole("listitem", {name: TASK_NAME, exact: false});
    const task = MOCK_SERVER_HANDLER.peekTasks().find(task => task.title === TASK_NAME);
    expect(task).toBeDefined()
    if (task) {
        const due = task.due;
        // Assert
        // Validate that the dates are right
        expect(within(listTaskLink).getByText(due.toLocaleString(PARTIAL_DATETIME_FORMATS.D.token))).not.toBeNull();
        expect(within(listTaskLink).getByText(due.toLocaleString(PARTIAL_DATETIME_FORMATS.t.token))).not.toBeNull();
    }
})

describe("should show uncompleted tasks", () => {
    it("check boxes as unfilled", async () => {
        // Arrange
        const task = await screen.findAllByRole("button", {name: TASK_NAME, exact: false});
        const checkbox = await within(task[0]).findByRole("checkbox", {name: `Mark task complete ${TASK_NAME}`, exact: false});
        // Assert
        expect(checkbox).not.toBeChecked();
    })

    it("title without a line-through", async () => {
        const title = await screen.findByText(TASK_NAME);
        expect(title).not.toHaveStyle("text-decoration: line-through")
    })

    it("as complete after clicking on its check box", async () => {
        // Arrange
        const task = await screen.findByRole("button", {name: TASK_NAME, exact: false});
        // logRoles(task);
        const box = await within(task).findByRole("checkbox");
        // Act
        await act(async () => {
            await testUser.click(box);
        })
        // Assert
        expect(box).toBeChecked();
    })
})

describe("should show complete tasks", () => {
    const TASK_NAME = "Overdue complete";

    it("check boxes as filled", async () => {
        const task = await screen.findByRole("button", {name: TASK_NAME, exact: false});
        const checkbox = await within(task).findByRole("checkbox");
        expect(checkbox).toBeChecked();
    })

    it("title with a line-through", async () => {
        // Arrange
        const title = await screen.findByText(TASK_NAME);
        // Act
        expect(title).toHaveStyle("text-decoration: line-through")
    })
    
    it("as incomplete after clicking on its check box", async () => {
        // Arrange
        const task = await screen.findByRole("button", {name: TASK_NAME, exact: false});
        const box = await within(task).findByRole("checkbox");
        // Act
        await act(async () => {
            await testUser.click(box);
        })
        // Assert
        expect(box).not.toBeChecked();
    })
})

describe("should show tasks in the", () => {
    const ensureTasksInSection = (tasks: string[], section: HTMLElement) => {
        tasks.forEach((taskName) => {
            const locations = screen.getAllByText(taskName);
            locations.forEach((loc) => {
                expect(section).toContainElement(loc);
            })
        });
    }

    it("overdue section", async () => {
        // Tasks as defined in MockTaskApiHandler
        const overdueTaskNames = MOCK_SERVER_HANDLER.peekTasks().filter(task => task.due < DateTime.now()).map(task => task.title);
        const section = await screen.findByRole("region", {name: OVERDUE});
        ensureTasksInSection(overdueTaskNames, section)
    })

    it("upcoming section", async () => {
        const upcomingTaskNames = MOCK_SERVER_HANDLER.peekTasks().filter(task => task.start > DateTime.now()).map(task => task.title);
        const section = await screen.findByRole("region", {name: UPCOMING});
        ensureTasksInSection(upcomingTaskNames, section)
    })

    it("due today section", async () => {
        // Arrange
        const todayDue = MOCK_SERVER_HANDLER.peekTasks().filter(task => DateTime.now().startOf("day") < task.due && task.due < DateTime.now().endOf("day")).map(task => task.title);
        const today = await screen.findByRole("region", { name: TODAY});
        const dueToday = await within(today).findByRole("region", {name: "Due"});
        // Assert
        ensureTasksInSection(todayDue, dueToday);
    })

    it("work on today section", async () => {
        const workTaskNames = MOCK_SERVER_HANDLER.peekTasks().filter(task => DateTime.now() > task.start && task.due > DateTime.now()).map(task => task.title);
        const today = await screen.findByRole("region", {name: TODAY});
        const workToday = await within(today).findByRole("region", {name: "Work"});
        ensureTasksInSection(workTaskNames, workToday);
    })
})

it("should be able to toggle sections opened and closed", async () => {
    // Arrange
    const todaySection = await screen.findByRole("region", {name: TODAY});
    //Act
    await act (async() => {
        await testUser.click(within(todaySection).getByRole("button", {name: `Collapse ${TODAY.toLocaleLowerCase()} section`, exact: false}));
    })
    // Assert
    await waitFor(() => {
        expect(within(todaySection).getByText("Due")).not.toBeVisible();
    })
    expect(within(todaySection).getByText("Work")).not.toBeVisible();
    // Act
    await act(async() => {
        await testUser.click(within(todaySection).getByRole("button", {name: `Expand ${TODAY.toLocaleLowerCase()} section`, exact: false}));  
    })
    // Assert
    await waitFor(() => {
        expect(within(todaySection).getByText("Due")).toBeVisible();
    })
    expect(within(todaySection).getByText("Work")).toBeVisible();
})