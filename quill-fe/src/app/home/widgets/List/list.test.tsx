import {
    render,
    screen,
    within,
    waitFor,
    logRoles,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event'
import { DateTime, Settings } from 'luxon';
import MockTaskApiHandler from '../../../../../__testing__/TestingAPI/MockTaskApiHandler';
import {ListWidget} from "./List";
import RootStore from '../../_globalStore/RootStore';

const LIST_WIDGET_NAME = "Task List";


const baseDate = DateTime.utc(2022, 5, 31, 6);
const mockServerHandler = new MockTaskApiHandler({date: baseDate});
const luxonNow = Settings.now;
const root = new RootStore();
const store = root.taskStore;

beforeAll(() => {
    // Start mock API
    mockServerHandler.server && mockServerHandler.server.listen();
    // Set constant time for DateTime.now()
    const millis = baseDate.toMillis();
    Settings.now = () => millis;
})

beforeEach(() => {
    mockServerHandler.server && mockServerHandler.server.resetHandlers();
    mockServerHandler.setup.initTasks();
    // IntersectionObserver isn't available in test environment
    const mockIntersectionObserver = jest.fn();
    mockIntersectionObserver.mockReturnValue({
        observe: () => null,
        unobserve: () => null,
        disconnect: () => null
    });
    window.IntersectionObserver = mockIntersectionObserver;
})

afterAll(() => {
    Settings.now = luxonNow;
    mockServerHandler.server && mockServerHandler.server.close();
})

it("should render the list component", () => {

    render(<ListWidget taskStore={store}/>);
    // logRoles(screen.findByRole("region"))
    expect(screen.getByRole("region", {name:LIST_WIDGET_NAME})).toBeInTheDocument();
})

it("should show a loading message before tasks are loaded", () => {
    // const root = new RootStore();
    // const store = root.taskStore;
    render(<ListWidget taskStore={store}/>);
    expect(store.isLoaded).toBeFalsy();
    expect(screen.getByRole("region", {name:LIST_WIDGET_NAME}))
    .toHaveTextContent(/loading/i);
})

it.only("should load tasks in the list", async () => {
    // const root = new RootStore();
    // const store = root.taskStore;
    expect(store.isLoaded).toBeTruthy();
    render(<ListWidget taskStore={store}/>);
    expect(screen.getByRole("region", {name:LIST_WIDGET_NAME})).toContainElement(await screen.findByLabelText("Overdue incomplete"));
})


it("should show a message on the list if no tasks are present", async () => {
    mockServerHandler.setup.setTasks([]);
    render(<ListWidget />);
    await screen.findByText("You have no tasks to work on. Try adding one!");
})

it("should show the correct time and date in the list", async () => {
    render(<ListWidget />);
    const list = await screen.findByRole("region", {name: "Task list"});
    const listTaskLink = await within(list).findByRole("link", {name: /^Overdue incomplete */, exact: false});
    const due = baseDate.minus({days: 7}).setZone(DateTime.local().zoneName);
    // Validate that the dates are right
    within(listTaskLink).getByText(due.toLocaleString(DateTime.DATE_SHORT));
    within(listTaskLink).getByText(due.toLocaleString(DateTime.TIME_SIMPLE));
})

describe("should show uncompleted tasks", () => {
    it("check boxes as unfilled", async () => {
        render(<ListWidget />);
        const checkbox = await screen.findByRole("checkbox", {name: "Overdue incomplete"});
        expect(checkbox).not.toBeChecked();
    })

    it("title without a line-through", async () => {
        render(<ListWidget />);
        const title = await screen.findByText("Overdue incomplete");
        expect(title).not.toHaveStyle("text-decoration: line-through")
    })

    it("as complete after clicking on its check box", async () => {
        render(<ListWidget />);
        const user = userEvent.setup()
        const box = await screen.findByRole("checkbox", {name: "Overdue incomplete"});
        await user.click(box);
        expect(box).toBeChecked();
    })
})

describe("should show complete tasks", () => {
    it("check boxes as filled", async () => {
        render(<ListWidget />);
        const taskName = "Overdue complete";
        const checkbox = await screen.findByRole("checkbox", {name: taskName});
        expect(checkbox).toBeChecked();
    })

    it("title with a line-through", async () => {
        render(<ListWidget />);
        const title = await screen.findByText("Overdue complete");
        // expect(window.getComputedStyle(title).getPropertyValue('text-decoration') === "line-through").toBeTruthy();
        expect(title).toHaveStyle("text-decoration: line-through")
    })
    
    it("as incomplete after clicking on its check box", async () => {
        const user = userEvent.setup()
        render(<ListWidget />);
        const box = await screen.findByRole("checkbox", {name: "Overdue complete"});
        await user.click(box);
        expect(box).not.toBeChecked();
    })
})

describe("should show tasks in the", () => {
    const ensureTasksInSection = (tasks, section) => {
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
        render(<ListWidget />);
        const section = await screen.findByRole("region", {name: "Overdue"});
        ensureTasksInSection(overdueTaskNames, section)
    })

    it.skip("upcoming section", async () => {
        const upcomingTaskNames = ["Upcoming", "Upcoming span"];
        render(<ListWidget />);
        const section = await screen.findByRole("region", {name: "Upcoming"});
        ensureTasksInSection(upcomingTaskNames, section)
    })

    // BROKEN!!!!
    it.skip("due today section", async () => {
        const todayDue = ["Due today", "Due today span"];
        render(<ListWidget />);
        const today = await screen.findByRole("region", {name: "Today"});
        const dueToday = await within(today).findByRole("region", {name: "Due"});
        ensureTasksInSection(todayDue, dueToday);
    })

    it.skip("work on today section", async () => {
        const workTaskNames = ["Work on today", "Due tomorrow"];
        render(<ListWidget />);
        const today = await screen.findByRole("region", {name: "Today"});
        const workToday = await within(today).findByRole("region", {name: "Work"});
        ensureTasksInSection(workTaskNames, workToday);
    })
})

it("should be able to toggle sections opened and closed", async () => {
    render(<ListWidget />);
    const user = userEvent.setup()
    const todaySection = await screen.findByRole("region", {name: "Today"});
    await user.click(within(todaySection).getByRole("button", {name: "Collapse today tasks"}));
    await waitFor(() => {
        expect(within(todaySection).getByText("Due")).not.toBeVisible();
    })
    expect(within(todaySection).getByText("Work")).not.toBeVisible();
    await user.click(within(todaySection).getByRole("button", {name: "Expand today tasks"}));
    await waitFor(() => {
        expect(within(todaySection).getByText("Due")).toBeVisible();
    })
    expect(within(todaySection).getByText("Work")).toBeVisible();
})

// TODO
it.todo("should add a task and find the same task in the calendar")