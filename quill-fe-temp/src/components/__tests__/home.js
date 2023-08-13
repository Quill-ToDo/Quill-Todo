import {
    render,
    screen
} from '@testing-library/react';
import { logRoles } from '@testing-library/react';
import { DateTime, Settings } from 'luxon';
import MockTaskApiHandler from '../../API/MockTaskApiHandler';

// await screen.findByText("Overdue incomplete");
// logRoles(screen.getByTestId("home"));

import App from "../../App"

const baseDate = DateTime.utc(2021, 6, 6, 6);
const mockServerHandler = new MockTaskApiHandler({date: baseDate});
const luxonNow = Settings.now;

beforeAll(() => {
    // Start mock API
    mockServerHandler.server.listen();
    // Set constant time for DateTime.now()
    const millis = baseDate.toMillis();
    Settings.now = () => millis;
})

beforeEach(() => {
    mockServerHandler.server.resetHandlers();
    mockServerHandler.setup.initTasks();
})

afterAll(() => {
    Settings.now = luxonNow;
    mockServerHandler.server.close();
})

it("should render the app without crashing", () => {
    render(<App />);
})

it.todo("should now allow not signed out users to access the home page")
it.todo("should redirect users to home after sign in")
it.todo("Should render the calendar component")


it("should render the list component", () => {
    render(<App />);
    // render(<Home />);
    expect(screen.getByRole("region", {name:"Task list"})).toBeInTheDocument();
})