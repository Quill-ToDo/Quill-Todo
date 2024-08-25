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
import { testTaskStore, MOCK_SERVER_HANDLER, BASE_DATE, testUser } from "@/testing/jest.setup";

const TASK_NAME = "Overdue incomplete";

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
        render(<ListWidget passedStore={testTaskStore} />);
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
    const listTaskLink = await within(list).findByRole("button", {name: TASK_NAME, exact: false});
    const due = BASE_DATE.minus({days: 7}).setZone(DateTime.local().zoneName);
    // Assert
    // Validate that the dates are right
    expect(within(listTaskLink).getByText(due.toLocaleString(DateTime.DATE_SHORT))).not.toBeNull();
    expect(within(listTaskLink).getByText(due.toLocaleString(DateTime.TIME_SIMPLE))).not.toBeNull();
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
        const overdueTaskNames = ["Overdue incomplete", "Overdue complete", "No start"];
        const section = await screen.findByRole("region", {name: OVERDUE});
        ensureTasksInSection(overdueTaskNames, section)
    })

    it("upcoming section", async () => {
        const upcomingTaskNames = ["Upcoming", "Upcoming span"];
        const section = await screen.findByRole("region", {name: UPCOMING});
        ensureTasksInSection(upcomingTaskNames, section)
    })

    it("due today section", async () => {
        const todayDue = ["Due today", "Due today span"];
        const today = await screen.findByRole("region", {name: TODAY});
        const dueToday = await within(today).findByRole("region", {name: "Due"});
        ensureTasksInSection(todayDue, dueToday);
    })

    it("work on today section", async () => {
        const workTaskNames = ["Work on today", "Due tomorrow"];
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