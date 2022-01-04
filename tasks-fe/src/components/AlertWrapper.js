import { Fragment, useState, useEffect, useRef } from 'react';
import close from '../static/images/close.png';
import { v4 as v4uuid } from 'uuid';

const setRemoveTimer = (type, body, callback) => {
    if (type === "notice") {
        console.log("setting timeout for " + body)
        return setTimeout(() => {
            callback();
            console.log("removing " + body)
        }, 8500)
    }
}

const Alert = (props) => {
    // If one is removed before hte others can be tehn it will be rerendered, don't want this
    const timeout = useRef(null);
    useEffect(() => {
        timeout.current = setRemoveTimer(props.type, props.body, props.removeCallback);
        return () => {
            clearTimeout(timeout.current);
        }
    }, [])

    return (
        <div
            id={props.id}
            className={"alert-pop-up " + props.type} 
            onMouseEnter={() => {
                console.log("hover")
                if (timeout) {
                    clearTimeout(timeout)
                }
                }}
            onMouseLeave={() => {
                timeout.current = setRemoveTimer(props.type, props.body, props.removeCallback);
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
        <Fragment>
            <div id="alert-listener">
                <AlertBox alerts={alerts} removeCallback={(id) => removeAlert(id)} />
                {children}
            </div>
        </Fragment>   
    )
}


export default AlertWrapper;