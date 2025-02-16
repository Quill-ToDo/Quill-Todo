import '@testing-library/jest-dom';
import { act } from 'react';
import { MOCK_SERVER_HANDLER, testTaskStore } from '@/app/__testing__/jest.setup.test';

it("should load tasks", async () => {
    // Act
    await act(async () => {
        await testTaskStore.loadTasks();
    })
    // Assert
    expect(testTaskStore.isLoaded).toBeTruthy();
})

it("should load updates from the server", async () => {
    // Act
    await act(async () => {
        await testTaskStore.loadTasks();
    })
    // Assert
    expect(testTaskStore.isLoaded).toBeTruthy();
    expect(testTaskStore.tasks.length !== 0).toBeTruthy();
    // Arrange
    MOCK_SERVER_HANDLER.setup.setTasks([]);
    // Act
    await act(async () => {
        await testTaskStore.loadTasks();
    })
    // Assert
    expect(testTaskStore.tasks.length === 0).toBeTruthy();
})
it.todo("should throw error when tasks cannot load");