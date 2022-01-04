import { Fragment, useState, useEffect, useRef } from 'react';
import close from '../static/images/close.png';
import { v4 as v4uuid } from 'uuid';

const setRemoveTimer = (id, type, body, callback) => {
    if (type === "notice") {
        console.log("setting timeout for " + body, id)
        // document.getElementById(id).style.animation=`alert-slide-out ${10000}ms ease-in-out`;
        return setTimeout(() => {
            callback();
            console.log("removing " + body)
        }, 5000)
    }
}

const Alert = (props) => {
    // If one is removed before hte others can be tehn it will be rerendered, don't want this
    const timeout = useRef(null);
    // timeout.current = setRemoveTimer(props.type, props.body, props.removeCallback);
    useEffect(() => {
        timeout.current = setRemoveTimer(props.id, props.type, props.body, props.removeCallback);
        return () => {
            clearTimeout(timeout.current);
        }
    })
    return (
        <div
            id={props.id}
            className={"alert-pop-up " + props.type} 
            onMouseEnter={() => {
                if (timeout) {
                    console.log("clearing timer")
                    clearTimeout(timeout)
                }
                }}
            onMouseLeave={() => {
                timeout.current = setRemoveTimer(props.id, props.type, props.body, props.removeCallback);
            }}
            >
            <p>{props.body}</p>
            <img src={close} alt="An x to close" onClick={props.removeCallback}></img>
        </div>
    )
}

const AlertBox = (props) => {
    return (
        <div id="alert-wrapper">
            {props.alerts.map((alert) => {
                return <Alert 
                    id={alert.id}
                    body={alert.body} 
                    type={alert.type}
                    removeCallback={() => props.removeCallback(alert.id)}
                    />
                })}
        </div>
    )
}

const AlertWrapper = ({children}) => {
    const [alerts, setAlerts] = useState([
        {"id":4, "type":"alert", "body": "ooga ooga"},
        {"id":0, "type":"notice", "body": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"},
        {"id":1, "type":"notice", "body": "AGAGAGAGGAGA"},
        {"id":2, "type":"alert", "body": "ba ba black sheep have u any wool ewe"},
        {"id":3, "type":"notice", "body": "very cool things are happening lul"},
    ]);

    const addAlert = (event) => {
        console.log("got event")
        setAlerts(alerts.concat({"id": v4uuid(), "type": event.detail.type, "body": event.detail.body}))
    };

    const removeAlert = (id) => {
        setAlerts(alerts.filter((alert) => alert.id !== id));
    }

    useEffect(() => {
        const wrapper = document.getElementById("alert-listener");
        wrapper.addEventListener("alert", addAlert);
        return () => {
            wrapper.removeEventListener("alert", addAlert)
        }
    }, [])

    console.log(alerts)
    
    return (
        <div id="alert-listener">
            <AlertBox alerts={alerts} removeCallback={(id) => removeAlert(id)} />
            {children}
        </div>
    )
}


export default AlertWrapper;