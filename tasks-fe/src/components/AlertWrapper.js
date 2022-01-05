import { Fragment, useState, useEffect, useRef } from 'react';
import close from '../static/images/close.png';
import { v4 as v4uuid } from 'uuid';
import { set } from 'mobx';

const Alert = (props) => {
    return (
        <div id={props.id} className={"alert-pop-up " + props.type}>
            <p>{props.body}</p>
            <img src={close} alt="An x to close" onClick={props.removeCallback}></img>
        </div>
    )
}

const AlertBox = (props) => {
    // The number of elements currently being animated
    const numInProgressAnimations = useRef(0);
    // Ids of elements to animate
    var animateIds = [];


    const hide = (ele) => {ele.style.display = "none";}
    const incAnimations = () => {
        numInProgressAnimations.current += 1
    };
    const decAnimations = (e) => {numInProgressAnimations.current -= 1};

    
    const alertFinished = (id) => {
        hide(document.getElementById(id));
        props.removeCallback(id, numInProgressAnimations.current)
    }

    // Manipulate animations and number of animations in progress
    const playAnimation = (animation) => {incAnimations(); animation.play()}
    const stopAnimation = (animation) => {decAnimations(); animation.cancel()}
    const pauseAnimation = (animation) => {decAnimations(); animation.cancel()}
    
    const slideOutAnimation = [
        {right: 0},
        {right: 0, opacity: .5, offset: .6, easing: "ease-in"},
        {right: "-100%", opacity: 0}
    ]

    useEffect(() => {
        animateIds.forEach((id) => {
            const alert = document.getElementById(id);
            var animation = alert.animate(slideOutAnimation, 5000);
            numInProgressAnimations.current += 1;
            pauseAnimation(animation);
            setTimeout(() => {playAnimation(animation)}, 2000)
            animation.onfinish = () => {decAnimations(); alertFinished(id)};
            alert.onmouseenter = () => {stopAnimation(animation)};
            alert.onmouseleave = () => {playAnimation(animation)};
        });
    }, [])


    return (
        <div id="alert-wrapper">
            {props.alerts.map((alert) => {
                const id = "alert-"+alert.id; 
                if (alert.type === "notice") {
                    animateIds.push(id)
                }
                return <Alert 
                    id={id}
                    key={id}
                    body={alert.body} 
                    type={alert.type}
                    removeCallback={()=>alertFinished(id)}
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
    var toRemove = [];

    const queueToRemove = (id, ongoingAnimations) => {
        // When an event finishes its animation cycle, if there are no other animations happening then remove every task that 
        // has finished its animation cycle from alerts (and the page) 
        toRemove.push(id);
        if (!ongoingAnimations) {
            setAlerts(alerts.filter((alert) => !(toRemove.includes("alert-"+alert.id))));
            toRemove = [];
        }
    }

    const addAlert = (event) => {
        console.log("got event")
        setAlerts(alerts.concat({"id": v4uuid(), "type": event.detail.type, "body": event.detail.body}));
    };

    useEffect(() => {
        const wrapper = document.getElementById("alert-listener");
        wrapper.addEventListener("alert", addAlert);
    }, [])
    
    return (
        <div id="alert-listener">
            <AlertBox 
                alerts={alerts}
                removeCallback={(id, numOngoingAnimations) => queueToRemove(id, numOngoingAnimations)}
            />
            {children}
        </div>
    )
}


export default AlertWrapper;