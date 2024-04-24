export function makeDraggable(divToDrag : Element) {
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
            divToDrag.style.left = (mousePosition.x + offset[0]) + 'px';
            divToDrag.style.top  = (mousePosition.y + offset[1]) + 'px';
        }
    }, true);
}

