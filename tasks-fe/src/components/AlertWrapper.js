import { useCallback, useEffect, useRef, useState } from 'react';
import { ERROR_ALERT, NOTICE_ALERT, SUCCESS_ALERT } from '../static/js/alertEvent';

const Alert = (props) => {
    const alert = props.alert.detail;
    const previouslyFocused = useRef(null);
    const descId = alert.id + "-desc";
    const labelId = alert.id + "-label";
    const btnId = alert.id + "-close";
    const colorMapping = {SUCCESS_ALERT: "btn-green", ERROR_ALERT: "btn-red", NOTICE_ALERT: "btn-light-grey"}
    const closeBtn = 
        <button 
            className={"no-shadow btn " + colorMapping[alert.type] } 
            id={btnId} 
            title="Close" 
            onClick={ () => {
                console.log("clicking clos close on " + alert.id)
                props.removeCallback();
            }}
        >
            <i className="fas fa-times fa-fw fa-2x"></i>
        </button>

    useEffect(() => {
        // Every time the component re-renders, re-start the animation process for every alert 
        // that isn't of type "failure"
        // if (alert.type !== "failure" && !toRemove.current.has(alert) && !ongoingAnimations.current.has(alert)) {
        if (alert.type !== "failure") {
            const alertInPage = document.getElementById(alert.id);
            // ongoingAnimations.current.add(alert);
            alertInPage.addEventListener('animationend', () => {
                // Hide alert
                props.removeCallback();
            }, false);
        }


        // On focus, save previously focused element to return focus to on alert dismount. 
        // Also, stop animation on focus.

        document.getElementById(btnId).addEventListener("focus", (e) => {
            previouslyFocused.current = e.relatedTarget;
            const alertInPage = document.getElementById(alert.id);
            const prevAnimation = alertInPage.style.animation;
            alertInPage.style.animation="0";
            alertInPage.addEventListener("blur", () => {
                alertInPage.style.animation = prevAnimation;
            })
        })
        
        // Focus on error message close button on render
        if (alert.type === ERROR_ALERT) {
            document.getElementById(btnId).focus();
        }
        
        return () => {
            // Focus on the element user was focused on before the alert popped up
            if (previouslyFocused.current !== null) {
                previouslyFocused.current.focus();
            }
        }
        // Adding alert to ongoing every time it reloads but ongoing stays. Add if it isn't already in it
    })

    if (alert.type === ERROR_ALERT) {
        return (
            <li 
                id={alert.id}
                role="alertdialog"
                open=""
                aria-live='assertive'
                aria-describedby={descId}
                aria-labelledby={labelId}
                className={"alert-pop-up " + alert.type}>
                <div className='alert-cont-wrapper'>
                    <h3 id={labelId}>Error:</h3>
                    <p id={descId}>{alert.body}</p>
                </div>
                {closeBtn}
            </li>
        )   
    }
    else {
        return (
            <li 
                id = {alert.id}
                aria-describedby={descId}
                aria-labelledby={labelId}
                className={"alert-pop-up slide-out " + alert.type}>
                <div className='alert-cont-wrapper'>
                    <h3 id={labelId}>{alert.type === NOTICE_ALERT ? "Notice:" : "Success:"}</h3>
                    <p id={descId}>{alert.body}</p>
                </div>
                {closeBtn}
            </li>
        )  
    }
}

const AlertList = (props) => {
    return (
        <ul>
            {props.alerts.map((alert) => {
                props.ongoingAnimations.current.add(alert);
                return <Alert 
                    alert={alert}
                    key={alert.detail.id}
                    removeCallback={()=>props.removeCallback(alert)}
                />
            })}
        </ul>
    );
}

const AlertBox = (props) => {
    // Ids of elements currently being animated
    const ongoingAnimations = useRef(new Set());
    // Ids of elements who's animation cycles have finished and can be removed
    const toRemove = useRef(new Set());
    
    const removeCallback = props.removeCallback;

    const dismissAlert = useCallback(
        (alert) => {
            // When an event finishes its animation cycle, if there are no other animations currently happening 
            // then remove every task that has also finished its animation cycle

            const alertInPage = document.getElementById(alert.detail.id);
            alertInPage.style.display = "none";
            toRemove.current.add(alert);
            ongoingAnimations.current.delete(alert)
            console.log("should remove " + toRemove.current.size + " alerts");
            console.log("but there are " + ongoingAnimations.current.size + " alerts with ongoing animations")
            if (!ongoingAnimations.current.size) {
                removeCallback(toRemove.current);
                toRemove.current.clear();
                // for (const alertToRemove of toRemove.current) {
                //     console.log("removing alert " + alertToRemove);
                //     toRemove.current.delete(alertToRemove);
                //     removeCallback(alertToRemove);
                // }
            }
        },
        [removeCallback],
    )

    return (
        <section 
            id="alert-wrapper" 
            data-testid="alert-wrapper" 
            role="log" 
            aria-atomic="false"
            aria-label='Alerts'
        >
            {props.alerts.length ?
                <AlertList 
                    alerts={props.alerts}
                    ongoingAnimations={ongoingAnimations}
                    removeCallback={(alert) => dismissAlert(alert)}
                />
                :
                null
            }
        </section>
    )
}

const AlertWrapper = (props) => {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        // Add listener for when you add a new alert
        const wrapper = document.getElementById("alert-capture");
        wrapper.addEventListener("alert", (event) => setAlerts(alerts.concat([event])));
        return () => {
            wrapper.removeEventListener("alert",  (event) => setAlerts(alerts.concat([event])));
        }
    }, [alerts])


    return (         
        <div id="alert-capture">
            <AlertBox 
                alerts={alerts} 
                removeCallback={(alertsToRemove) => {
                    console.log("removing alerts")
                    // Use a filter method to remove them all at once instead of this
                    setAlerts(alerts.filter(a => !alertsToRemove.has(a)));
                }} 
            />
            {props.children}
        </div>
    );
}

export default AlertWrapper;