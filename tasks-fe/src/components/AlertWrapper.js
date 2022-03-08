import { useCallback, useEffect, useRef, useState } from 'react';
import { ERROR_ALERT, NOTICE_ALERT, SUCCESS_ALERT } from '../static/js/alertEvent';

const animationDelay = "1s"; 


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
                props.removeCallback();
            }}
        >
            <i className="fas fa-times fa-fw fa-2x"></i>
        </button>

    useEffect(() => {
        const alertInPage = document.getElementById(alert.id);
        const closeBtnInPage = document.getElementById(btnId);

        // alertInPage.style.animationDelay = animationDelay;

        // Every time the component re-renders, re-start the animation process for every alert 
        // that isn't of type "failure"
        // if (alert.type !== "failure" && !toRemove.current.has(alert) && !ongoingAnimations.current.has(alert)) {
        if (alert.type !== "failure") {
            alertInPage.addEventListener('animationend', () => {
                // Hide alert
                props.animationStop();
                props.removeCallback();
            }, false);
            alertInPage.addEventListener('animationstart', () => {
                // console.log("animation start")
                props.animationStart();
            })
            
            // On focus, save previously focused element to return focus to on alert dismount. 
            // Also, stop animation on focus.
    
            closeBtnInPage.addEventListener("focus", (e) => {
                previouslyFocused.current = e.relatedTarget;
                // const prevAnimation = alertInPage.style.animation;
                // alertInPage.style.animation="0";
                
                alertInPage.classList.remove("slide-out");
                props.animationStop();
                
                closeBtnInPage.addEventListener("blur", () => {
                    alertInPage.classList.add("slide-out");
                    // alertInPage.style.animation = prevAnimation;
                    // console.log(alertInPage.style.animation)
                })
            })
        }

        
        // Focus on error message close button on render
        if (alert.type === ERROR_ALERT) {
            closeBtnInPage.focus();
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
                return <Alert 
                    alert={alert}
                    key={alert.detail.id}
                    animationStart={() => props.animationStart(alert)}
                    animationStop={() => props.animationStop(alert)}
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

    const animationStop = (alert) => {
        ongoingAnimations.current.delete(alert);
    }
    
    const animationStart = (alert) => {
        ongoingAnimations.current.add(alert);
    }

    const dismissAlert = useCallback(
        (alert) => {
            // If there are no animations currently happening then remove every task that has finished its animation cycle

            const alertInPage = document.getElementById(alert.detail.id);
            if (!alertInPage) {
                return;
            }
            alertInPage.style.display = "none";
            toRemove.current.add(alert);
            animationStop(alert);
            if (!ongoingAnimations.current.size) {
                console.log("removing " + toRemove.current.size + " alerts");
                removeCallback(toRemove.current);
                toRemove.current.clear();
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
                    animationStop={(alert) => animationStop(alert)}
                    animationStart={(alert) => animationStart(alert)}
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
                    setAlerts(alerts.filter(a => !alertsToRemove.has(a)));
                }} 
            />
            {props.children}
        </div>
    );
}

export default AlertWrapper;