import Home from "../../../page";
import {
    render,
    screen,
    within,
    act,
} from '@testing-library/react';
import { addAlert, ERROR_ALERT, NOTICE_ALERT } from "./alertEvent";
import {
    http,
    HttpResponse,
} from 'msw'
import { ERROR_TEXT } from "./AlertWrapper";
import { MOCK_SERVER_HANDLER, testTaskStore, testUser } from "@/testing/jest.setup";
import { AxiosError } from "axios";

const slideOutTimeout = 15000;
const defaultTimeout = 5000;
beforeAll(() => {
    // Can only set these outside of the functions below
})

beforeEach(() => {
    act(() => {
        render(<Home widgets={<></>}/>);
    })
})

afterAll(() => {
    // jest.useRealTimers();
})

it("should not let an alert be generated if it is passed a null element", async () => {
    expect(() => addAlert(null, NOTICE_ALERT, "This should not generate!!")).toThrow("Target element for alert");
})

it("should render failure alerts that require dismissal", async () => {
    // Arrange
    jest.useFakeTimers();
    // Act
    await act(async ()=>addAlert(await screen.findByRole('menubar'), ERROR_ALERT, "Test fail"));
    expect(await screen.findByRole("alertdialog", {name: ERROR_TEXT})).toBeDefined();
    const p = new Promise((r) => {setTimeout(r, slideOutTimeout+5000)});
    jest.runAllTimers();
    await p;
    // Assert
    expect(screen.getByRole("alertdialog", {name: ERROR_TEXT})).toBeDefined();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
})

it.skip("should render notice and success alerts that slide out", async() => {
    // Arrange
    jest.useFakeTimers();
    // Act
    await act(async () => {
        addAlert(await screen.findByRole('menubar'), NOTICE_ALERT, "Test notice");
    })
    const notice = await screen.findByText("Test notice");
    await act(async () => {
        // TODO this line is breaking
        await testUser.unhover(notice);
    })
    const p = new Promise((r) => {setTimeout(r, slideOutTimeout+5000)});
    jest.runAllTimers();
    await p;
    // Assert
    expect(notice).not.toBeInTheDocument();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
}, 10000)

it("should be able to close error alerts", async () => {
    // Arrange
    await act (async () => {
        addAlert(await screen.findByRole('menubar'), ERROR_ALERT, "Test fail");   
    })
    const alert = await screen.findByRole("alertdialog", {name: ERROR_TEXT});
    const close = within(alert).getByRole("button", {name: "Close"});
    // Act
    expect(close).toHaveFocus();
    await act(async () => {
        await testUser.keyboard("{Enter}");
    })
    // Assert
    expect(screen.queryByRole("alertdialog", {name: ERROR_TEXT})).not.toBeInTheDocument();
})

it("should be able to close notice alerts", async () => {
    // Arrange
    await act(async () => {
        addAlert(await screen.findByRole('menubar'), NOTICE_ALERT, "Test notice")    
    })
    const notice = await screen.findByRole("listitem", {name: "Test notice"});
    const nClose = within(notice).getByRole("button", {name: "Close"});
    // Act
    // User.click did not work, had to use base pointer method
    await act(async () => {
        await testUser.pointer({keys: '[MouseLeft]', target: nClose});
    })
    // Assert
    expect(within(notice).getByRole("button", {name: "Close"})).toBeNull();
})

it.skip("should handle failure to update task", async () => {
    // TODO: Need to figure out checkboxes
    // Arrange 
    if (MOCK_SERVER_HANDLER.server) {
        MOCK_SERVER_HANDLER.server.use(
            http.patch(MOCK_SERVER_HANDLER.API_URL+":id", () => {
                return new HttpResponse("Server error", { status: 500 },)
            }, { once: true }));
    }
    // const task = await screen.findByRole("checkbox", {name: TASK_NAME});
    // const box = await screen.findByRole("checkbox", {name: });
    // Act
    await act(async () => {
        // await testUser.click(box);
    })
    const alert = await screen.findByRole("alertdialog", {name: ERROR_TEXT});
    const close = within(alert).getByRole("button", {name: "Close"});
    // Assert
    expect(close).toHaveFocus();
    // Should revert changes
    expect(await screen.findByRole("checkbox", {name:"Overdue incomplete"})).not.toBeChecked();
})

it("should handle failure to load tasks", async () => {
    // Arrange
    if (MOCK_SERVER_HANDLER.server) {
        MOCK_SERVER_HANDLER.server.use(
            http.get(MOCK_SERVER_HANDLER.API_URL, () => {
                return new HttpResponse("Server error", { status: 500 },)
            }));
    }
    // Act
    await act(async () => {
        await testTaskStore.loadTasks();
    })
    const alert = await screen.findByRole("alertdialog", {name: ERROR_TEXT});
    const close = within(alert).getByRole("button", {name: "Close"});
    // Assert
    expect(alert).toBeInTheDocument();
    expect(close).toHaveFocus(); // For some reason this won't work!
})