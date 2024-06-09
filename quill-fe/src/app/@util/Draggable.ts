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

