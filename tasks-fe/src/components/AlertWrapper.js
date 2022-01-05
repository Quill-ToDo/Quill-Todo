import { useEffect, useRef } from 'react';
import close from '../static/images/close.png';
import { useAlertStore } from '../store/StoreContext';
import { observer } from 'mobx-react-lite';

const Alert = (props) => {
    return (
        <div id={props.id} className={"alert-pop-up " + props.type}>
            <p>{props.body}</p>
            <img src={close} alt="An x to close" onClick={props.removeCallback}></img>
        </div>
    )
}

const AlertBox = observer((props) => {
    const alertStore = useAlertStore();
    // The number of elements currently being animated
    const ongoingAnimations = useRef(0);
    // Ids of elements to animate
    var animateIds = [];
    // Ids of elements who's animation cycles have finished and can be removed
    var toRemove = [];

    const dismissAlert = (id) => {
        // When an event finishes its animation cycle, if there are no other animations currently happening 
        // then remove every task that has also finished its animation cycle
        document.getElementById(id).style.display = "none";
        toRemove.push(id);
        if (!ongoingAnimations.current) {
            toRemove.forEach((oldId)=>{
                alertStore.remove(oldId);
                toRemove = [];
            })
        }
    }

    // Manipulate animations and counter for number of animations in progress
    const incAnimations = () => {ongoingAnimations.current += 1};
    const decAnimations = () => {ongoingAnimations.current -= 1};
    const playAnimation = (animation) => {incAnimations(); animation.play()}
    const stopAnimation = (animation) => {decAnimations(); animation.cancel()}

    const slideOutAnimation = [
        {right: 0},
        {right: 0, opacity: .5, offset: .6, easing: "ease-in"},
        {right: "-100%", opacity: 0}
    ]

    useEffect(() => {
        // Every time the component re-renders, re-start the animation process for every alert 
        // that isn't of type "failure"
        animateIds.forEach((id) => {
            const alert = document.getElementById(id);
            var animation = new Animation(new KeyframeEffect(alert, slideOutAnimation, {"duration": 3000, "delay": 4000}),);
            playAnimation(animation);
            animation.onfinish = () => {decAnimations(); dismissAlert(id)};
            alert.onmouseenter = () => {stopAnimation(animation)};
            alert.onmouseleave = () => {playAnimation(animation)};
        });
    })


    if (alertStore.alerts.length){
        return (
            <div id="alert-wrapper">
                {alertStore.alerts.map((alert) => {
                    const id = "alert-"+alert.id; 
                    if (alert.type !== "failure") {
                        // Danger should persist
                        animateIds.push(id)
                    }
                    return <Alert 
                        id={id}
                        key={id}
                        body={alert.body} 
                        type={alert.type}
                        removeCallback={()=>dismissAlert(id)}
                        />
                    })}
            </div>
        )
    }
    else { return null }
})

export default AlertBox;