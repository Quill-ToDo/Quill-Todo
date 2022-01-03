import React from 'react';
import ReactDOM from 'react-dom';
import './static/css/application.css';
// import App from './App';
import reportWebVitals from './reportWebVitals';
// import { StoreProvider } from "./store/StoreContext";
// import * as React from "react"
// import { render } from "react-dom"
import { observer } from "mobx-react-lite"
import { makeObservable, observable, action, computed } from "mobx"

// Add this in your component file
require('react-dom');
window.React2 = require('react');
console.log(window.React1 === window.React2);

// ReactDOM.render(
//   <React.StrictMode>
//     <StoreProvider>
//       <App />
//     </StoreProvider>
//   </React.StrictMode>,
//   document.getElementById('root')
// );

console.log(":(")

class Todo {
    id = Math.random()
    title = ""
    finished = false

    constructor(title) {
        makeObservable(this, {
            title: observable,
            finished: observable,
            toggle: action
        })
        this.title = title
    }

    toggle() {
        this.finished = !this.finished
    }
}

class TodoList {
    todos = []
    get unfinishedTodoCount() {
        return this.todos.filter(todo => !todo.finished).length
    }
    constructor(todos) {
        makeObservable(this, {
            todos: observable,
            unfinishedTodoCount: computed
        })
        this.todos = todos
    }
}

const TodoView = observer(({ todo }) => (
    <li>
        <input type="checkbox" checked={todo.finished} onClick={() => todo.toggle()} />
        {todo.title}
    </li>
))

const TodoListView = observer(({ todoList }) => (
    <div>
        <ul>
            {todoList.todos.map(todo => (
                <TodoView todo={todo} key={todo.id} />
            ))}
        </ul>
        Tasks left: {todoList.unfinishedTodoCount}
    </div>
))

const store = new TodoList([new Todo("Get Coffee"), new Todo("Write simpler code")])
ReactDOM.render(<TodoListView todoList={store} />, document.getElementById("root"))

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
