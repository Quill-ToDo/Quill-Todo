import {useState} from 'react';
import axiosInstance from "../API/TaskApi";

const Login = (props) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        try {
            const response = axiosInstance.post('/token/obtain/', {
                email: email,
                password: password
            });
            axiosInstance.defaults.headers['Authorization'] = "JWT " + response.data.access;
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            return data;
        } catch (error) {
            throw error;
        }
    };

    return <div>Login
    <form onSubmit={handleSubmit}>
        <label>
            Email:
            <input name="email" type="text" value={email} onChange={e => {
                setEmail(e.target.value);
            }}/>
        </label>
        <label>
            Password:
            <input name="password" type="password" value={password} onChange={e => {
                setPassword(e.target.value);
            }}/>
        </label>
        <input type="submit" value="Submit"/>
    </form>
</div>
}

export default Login;