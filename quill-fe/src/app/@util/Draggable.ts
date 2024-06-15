export function makeDraggable(divToDrag : HTMLElement) {
    var mousePosition;
    var offset = [0,0];
    var isDown = false;
    const dragHandle = divToDrag.querySelector(".draggable-handle");
    if (dragHandle === null) {
        throw new Error("");
    }

    dragHandle.addEventListener('mousedown', function(e) {
        isDown = true;
        offset = [
            divToDrag.offsetLeft - e.clientX,
            divToDrag.offsetTop - e.clientY
        ];
    }, true);

    document.addEventListener('mouseup', function() {
        isDown = false;
    }, true);
    
    document.addEventListener('mousemove', function(event) {
        event.preventDefault();
        if (isDown) {
            mousePosition = {
    
                x : event.clientX,
                y : event.clientY
    
            };
            let newX = mousePosition.x + offset[0];
            let newY = mousePosition.y + offset[1];
            if (newX > 0 && newX < window.innerWidth-50) {
                divToDrag.style.left = newX + 'px';
            }
            if (newY > 0 && newY < window.innerHeight-50) {
                divToDrag.style.top  = newY + 'px';
            }
        }
    }, true);
}

export function makeDraggableUsingFloating({containerId, containerRef}: {containerId?: string, containerRef?: HTMLElement}) {
    var mousePosition;
    var isDown = false;
    var offset = [0, 0];
    let container: HTMLElement | null;
    if (containerId) {
        container = document.querySelector(`#${containerId}.draggable`);        
        if (!container) {
            throw new Error(`Could not find an element with id ${containerId} .draggable class`);
        }
    }
    else if (containerRef) {
        container = containerRef;
    }
    else {
        throw new Error(`A container ID or reference is required to make it draggable`);
    }

    const dragHandle = container.querySelector(".draggable-handle");
    if (!dragHandle) {
        throw new Error("Could not find an element with .draggable-handle class inside a .draggable class");
    }
            
    dragHandle.addEventListener('mousedown', function(e) {
        isDown = true;
        offset = [
            container.offsetLeft - e.clientX,
            container.offsetTop - e.clientY
        ];
    }, true);

    document.addEventListener('mouseup', function() {
        isDown = false;
    }, true);
    
    document.addEventListener('mousemove', function(event) {
        event.preventDefault();
        if (isDown) {
            mousePosition = {
                x : event.clientX,
                y : event.clientY
            };
            let newX = mousePosition.x + offset[0];
            let newY = mousePosition.y + offset[1];
            container.style.top  = newY + 'px';
            container.style.left = newX + 'px';
        }
    }, true);
}
